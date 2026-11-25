import { expect, test, type Locator, type Page } from "@playwright/test";

import { fixtureMd, fixtureTag } from "./fixtures";

// Item das listas inteiras (Q24, T-131, BRAND §9.2): data, título, descrição,
// tempo de leitura e votos, um abaixo do outro, em todas as larguras.

const LISTS = ["/blog/", "/artigos/", "/prototipos/", `/tags/${fixtureTag}/`];
const WIDTHS = [360, 1280] as const;
const PIXELS_TO_SIGNIFICANCE = 3;

async function open(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
}

async function tokenColor(page: Page, token: string, property = "color") {
  return page.evaluate(
    ([name, prop]) => {
      const probe = document.createElement("span");
      probe.style.setProperty(prop, `var(${name})`);
      document.body.append(probe);
      const style = getComputedStyle(probe);
      const color = prop === "color" ? style.color : style.backgroundColor;
      probe.remove();
      return color;
    },
    [token, property] as const,
  );
}

type Box = { top: number; bottom: number; left: number };

async function partsOf(article: Locator) {
  return article.evaluate((root) => {
    const box = (node: Element | null | undefined): Box | null => {
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left };
    };
    return {
      date: box(root.querySelector("time")),
      title: box(root.querySelector(":is(h2, h3)")),
      description: box(root.querySelector("[data-description]")),
      reading: box(root.querySelector("[data-reading]")),
      votes: box(root.querySelector("[data-votes]")),
    };
  });
}

async function expectStacked(article: Locator, label: string) {
  const parts = await partsOf(article);
  const order = [
    parts.date,
    parts.title,
    parts.description,
    parts.reading,
    parts.votes,
  ];
  for (const part of order) expect(part, label).not.toBeNull();
  const boxes = order as Box[];
  for (let index = 1; index < boxes.length; index += 1) {
    const previous = boxes[index - 1];
    const current = boxes[index];
    if (!previous || !current) continue;
    expect(current.top, `${label} parte ${index}`).toBeGreaterThanOrEqual(
      previous.bottom - 1,
    );
  }
  const left = boxes[0]?.left ?? 0;
  for (const part of boxes) {
    expect(Math.abs(part.left - left), label).toBeLessThanOrEqual(1);
  }
}

test.describe("item das listas inteiras [RF-02]", () => {
  test("data, título, descrição, tempo e votos, um abaixo do outro", async ({
    page,
  }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      for (const listPath of LISTS) {
        await test.step(`${listPath} ${width}px`, async () => {
          await open(page, listPath);
          const articles = page.locator("[data-listing] article");
          const count = await articles.count();
          expect(count).toBeGreaterThan(0);
          for (let index = 0; index < count; index += 1) {
            await expectStacked(articles.nth(index), `${listPath} #${index}`);
          }
        });
      }
    }
  });

  test("descrição do post, tempo em minutos e votos em tinta", async ({
    page,
  }) => {
    await open(page, "/blog/");
    const item = page
      .locator("[data-listing] article")
      .filter({ has: page.locator(`a[href="${fixtureMd.href}"]`) });
    await expect(item).toHaveCount(1);
    await expect(item.locator("[data-description]")).toHaveText(
      fixtureMd.description,
    );

    const reading = item.locator("[data-reading]");
    await expect(reading).toHaveCount(1);
    const shown = (
      await reading.evaluate((node) => {
        const clone = node.cloneNode(true) as HTMLElement;
        for (const hidden of clone.querySelectorAll(".sr-only")) {
          hidden.remove();
        }
        return clone.textContent ?? "";
      })
    )
      .replace(/\s+/g, " ")
      .trim();
    expect(shown).toMatch(/^(1 minuto|(?:[02-9]|\d{2,}) minutos)$/);
    await expect(reading).toHaveAttribute("title", `${shown} de leitura`);
    const clock = reading.locator("svg");
    await expect(clock).toHaveAttribute("aria-hidden", "true");
    await expect(clock).toHaveCSS("width", "12px");

    const ink = await tokenColor(page, "--color-ink");
    const votes = item.locator("[data-votes]");
    await expect(votes).toHaveCSS("color", ink);
    await expect(votes.locator("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(votes.locator("[data-vote-word]")).toHaveText(/^votos?$/);
    await expect(item.locator("[data-rank-position]")).toHaveCount(0);
  });

  test("título em 20 px abaixo de sm e 26 px de sm em diante", async ({
    page,
  }) => {
    for (const [width, size] of [
      [360, "20px"],
      [1280, "26px"],
    ] as const) {
      await page.setViewportSize({ width, height: 800 });
      await open(page, "/blog/");
      const headings = page.locator("[data-listing] article h2");
      const count = await headings.count();
      expect(count).toBeGreaterThan(0);
      for (let index = 0; index < count; index += 1) {
        await expect(headings.nth(index)).toHaveCSS("font-size", size);
      }
    }
  });

  test("hover e foco: fundo sheet e título em accent, sem esmaecer", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const listPath of ["/blog/", "/artigos/", `/tags/${fixtureTag}/`]) {
      await test.step(listPath, async () => {
        await open(page, listPath);
        const sheet = await tokenColor(
          page,
          "--color-sheet",
          "background-color",
        );
        const accent = await tokenColor(page, "--color-accent");
        const articles = page.locator("[data-listing] article");
        expect(await articles.count()).toBeGreaterThanOrEqual(2);
        const item = articles.first();
        const link = item.locator("h2 a");
        await expect(item).not.toHaveCSS("background-color", sheet);
        await item.hover();
        await expect(item).toHaveCSS("background-color", sheet);
        await expect(link).toHaveCSS("color", accent);
        await expect(link).toHaveCSS("text-decoration-line", "none");
        const opacities = await articles.evaluateAll((nodes) =>
          nodes.map((node) => getComputedStyle(node).opacity),
        );
        expect(opacities.every((value) => value === "1")).toBe(true);
        await page.mouse.move(0, 0);
        await expect(item).not.toHaveCSS("background-color", sheet);
        await link.focus();
        await expect(item).toHaveCSS("background-color", sheet);
        await expect(link).toHaveCSS("color", accent);
        const focused = await articles.evaluateAll((nodes) =>
          nodes.map((node) => getComputedStyle(node).opacity),
        );
        expect(focused.every((value) => value === "1")).toBe(true);
        await link.blur();
      });
    }
  });

  test("sem regra de esmaecer no CSS", async ({ page }) => {
    await open(page, "/blog/");
    const found = await page.evaluate(() => {
      const hits: string[] = [];
      const visit = (rules: CSSRuleList) => {
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSStyleRule) {
            if (rule.selectorText.includes("data-dim")) {
              hits.push(rule.selectorText);
            }
          } else if (rule instanceof CSSGroupingRule) {
            visit(rule.cssRules);
          }
        }
      };
      for (const sheet of Array.from(document.styleSheets)) {
        visit(sheet.cssRules);
      }
      return hits;
    });
    expect(found).toEqual([]);
    await expect(page.locator("[data-dim]")).toHaveCount(0);
  });

  test("movimento reduzido tira a transição", async ({ page }) => {
    await open(page, "/blog/");
    const item = page.locator("[data-listing] article").first();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(item).toHaveCSS("transition-duration", "0s");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(item).not.toHaveCSS("transition-duration", "0s");
  });

  test("os votos e o NOVO não movem a lista", async ({ page }) => {
    for (const width of WIDTHS) {
      await test.step(`${width}px`, async () => {
        await page.unrouteAll({ behavior: "ignoreErrors" });
        let release = () => {};
        const gate = new Promise<void>((resolve) => {
          release = resolve;
        });
        let opened = false;
        await page.route("**/api/votes", async (route) => {
          if (!opened) await gate;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ votes: { "fixture-md": 120 } }),
          });
        });
        await page.setViewportSize({ width, height: 800 });
        await open(page, "/blog/");
        await page.evaluate(() => document.fonts.ready);
        const items = page.locator("[data-listing] article");
        const tops = () =>
          items.evaluateAll((nodes) =>
            nodes.map((node) => {
              const rect = node.getBoundingClientRect();
              return { top: rect.top, height: rect.height };
            }),
          );
        const before = await tops();
        opened = true;
        release();
        await expect(
          page.locator(
            `[data-listing] article:has(a[href="${fixtureMd.href}"]) [data-vote-value]`,
          ),
        ).toHaveText("120");
        const after = await tops();
        expect(after.length).toBe(before.length);
        for (let index = 0; index < after.length; index += 1) {
          const a = before[index];
          const b = after[index];
          if (!a || !b) continue;
          expect(Math.abs(a.top - b.top)).toBeLessThan(PIXELS_TO_SIGNIFICANCE);
          expect(Math.abs(a.height - b.height)).toBeLessThan(
            PIXELS_TO_SIGNIFICANCE,
          );
        }
      });
    }
  });
});

test.describe("item de /mais-votados/ [RF-02]", () => {
  test("o ranking usa o item empilhado, sem posição", async ({ page }) => {
    await page.route("**/api/votes", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ votes: { "fixture-md": 2, "fixture-mdx": 1 } }),
      });
    });
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      await open(page, "/mais-votados/");
      const items = page.locator("[data-ranking] article");
      await expect(items).toHaveCount(2);
      await expect(items.locator("[data-rank-position]")).toHaveCount(0);
      const first = items.first();
      await expect(first.locator("h2 a")).toHaveAttribute(
        "href",
        fixtureMd.href,
      );
      await expect(first.locator("[data-description]")).toHaveText(
        fixtureMd.description,
      );
      await expect(first.locator("[data-reading]")).toContainText(
        /^\s*\d+ minutos?/,
      );
      await expect(first.locator("[data-vote-value]")).toHaveText("2");
      await expect(items.nth(1).locator("[data-vote-word]")).toHaveText("voto");
      await expectStacked(first, `/mais-votados/ ${width}px`);
    }
  });
});
