import { expect, test, type Locator, type Page } from "@playwright/test";

import { diskPosts } from "./disk-posts";
import { fixtureMd, fixtureTag } from "./fixtures";

// Listas inteiras (Q24, T-131, BRAND §9.2): lateral com o h1, a contagem e o
// filtro; a lista sob o rótulo `/ LISTAGEM`; o item com a data, o título, a
// descrição em até 2 linhas, o tempo e os votos (só com 1 ou mais). Em
// /prototipos/, a miniatura. Em /mais-votados/, o mesmo item, sem posição.

const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];
const LISTS = ["/blog/", "/artigos/", "/prototipos/", `/tags/${fixtureTag}/`];
const WIDTHS = [360, 1280] as const;
const PIXELS_TO_SIGNIFICANCE = 3;

function fullDate(datetime: string): string {
  const [year, month, day] = datetime.split("-");
  return `${day}.${MONTHS[Number(month) - 1]}.${year}`;
}

function votesBody(votes: Record<string, number>, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: status === 200 ? JSON.stringify({ votes }) : "{}",
  };
}

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

type Box = { top: number; bottom: number; left: number; right: number };

async function partsOf(article: Locator) {
  return article.evaluate((root) => {
    const box = (node: Element | null | undefined): Box | null => {
      if (!node || !(node instanceof HTMLElement || node instanceof SVGElement))
        return null;
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return null;
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
      };
    };
    return {
      date: box(root.querySelector("time")),
      thumb: box(root.querySelector("[data-thumb]")),
      title: box(root.querySelector(":is(h2, h3)")),
      description: box(root.querySelector("[data-description]")),
      reading: box(root.querySelector("[data-reading]")),
      votes: box(root.querySelector("[data-votes]")),
    };
  });
}

test.describe("listas inteiras [RF-02]", () => {
  test("um rótulo / LISTAGEM, a data completa e o título em h3", async ({
    page,
  }) => {
    const posts = diskPosts();
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      await open(page, "/blog/");
      const section = page.locator("[data-list-section]");
      await expect(section).toHaveCount(1);
      const label = section.locator("h2");
      await expect(label).toHaveCount(1);
      await expect(label).toHaveText("/ LISTAGEM");
      const rule = await label.evaluate(
        (node) =>
          getComputedStyle(node.parentElement ?? node).borderBottomWidth,
      );
      expect(rule).toBe(width === 360 ? "2px" : "1px");
      await expect(page.locator("[data-year-group]")).toHaveCount(0);
      const times = page.locator("[data-listing] article time");
      await expect(times).toHaveCount(posts.length);
      for (const [row, post] of posts.entries()) {
        await expect(times.nth(row)).toHaveAttribute("datetime", post.date);
        await expect(times.nth(row)).toHaveText(fullDate(post.date));
      }
      await expect(page.locator("[data-listing] article h3")).toHaveCount(
        posts.length,
      );
      await expect(page.locator("[data-listing] article h2")).toHaveCount(0);
      const listBox = await page.locator("[data-listing]").boundingBox();
      const labelBox = await label.boundingBox();
      if (!listBox || !labelBox) throw new Error("sem caixa");
      expect(listBox.y).toBeGreaterThanOrEqual(labelBox.y + labelBox.height);
    }
  });

  test("lateral com h1, contagem e filtro de lg em diante", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const listPath of ["/blog/", "/artigos/", "/prototipos/"]) {
      await test.step(listPath, async () => {
        await open(page, listPath);
        const h1 = await page.locator("h1").boundingBox();
        const count = await page.locator("[data-count]").boundingBox();
        const select = await page.locator("#filtro-tag").boundingBox();
        const list = await page.locator("[data-list-section]").boundingBox();
        if (!h1 || !count || !select || !list) throw new Error("sem caixa");
        expect(count.y).toBeGreaterThan(h1.y);
        expect(select.y).toBeGreaterThan(count.y);
        expect(select.x + select.width).toBeLessThanOrEqual(list.x);
        expect(Math.abs(list.y - h1.y)).toBeLessThan(40);
      });
    }
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, "/blog/");
    const select = await page.locator("#filtro-tag").boundingBox();
    const list = await page.locator("[data-listing]").boundingBox();
    if (!select || !list) throw new Error("sem caixa");
    expect(list.y).toBeGreaterThan(select.y + select.height);
  });

  test("/tags/<tag>/ tem a contagem e não tem filtro", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, `/tags/${fixtureTag}/`);
    await expect(page.locator("#filtro-tag")).toHaveCount(0);
    const tagged = diskPosts().filter((post) => post.tags.includes(fixtureTag));
    await expect(page.locator("[data-count]")).toHaveText(
      `${tagged.length} posts`,
    );
  });

  test("item em colunas de sm em diante e empilhado abaixo", async ({
    page,
  }) => {
    await page.route("**/api/votes", (route) =>
      route.fulfill(
        votesBody(
          Object.fromEntries(diskPosts().map((post) => [post.slug, 10])),
        ),
      ),
    );
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      for (const listPath of LISTS) {
        await test.step(`${listPath} ${width}px`, async () => {
          await open(page, listPath);
          const item = page.locator("[data-listing] article").first();
          await expect(item.locator("[data-votes]")).toBeVisible();
          const parts = await partsOf(item);
          const { date, title, description, reading, votes } = parts;
          if (!date || !title || !description || !reading || !votes) {
            throw new Error(JSON.stringify(parts));
          }
          expect(description.top).toBeGreaterThanOrEqual(title.bottom - 1);
          if (width === 360) {
            expect(title.top).toBeGreaterThanOrEqual(date.bottom - 1);
            expect(reading.top).toBeGreaterThanOrEqual(description.bottom - 1);
            expect(Math.abs(votes.top - reading.top)).toBeLessThan(3);
            expect(votes.left).toBeGreaterThan(reading.right);
          } else {
            expect(date.right).toBeLessThanOrEqual(title.left);
            expect(Math.abs(date.top - title.top)).toBeLessThan(12);
            expect(reading.left).toBeGreaterThanOrEqual(title.right);
            expect(reading.left).toBeGreaterThanOrEqual(description.right);
            expect(Math.abs(reading.top - title.top)).toBeLessThan(12);
            expect(votes.top).toBeGreaterThanOrEqual(reading.bottom - 1);
            expect(Math.abs(votes.left - reading.left)).toBeLessThanOrEqual(1);
          }
        });
      }
    }
  });

  test("descrição em até 2 linhas e tempo em minutos", async ({ page }) => {
    await open(page, "/blog/");
    const item = page
      .locator("[data-listing] article")
      .filter({ has: page.locator(`a[href="${fixtureMd.href}"]`) });
    const description = item.locator("[data-description]");
    await expect(description).toHaveText(fixtureMd.description);
    await expect(description).toHaveCSS("-webkit-line-clamp", "2");
    const reading = item.locator("[data-reading]");
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
    await expect(reading.locator("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(item.locator("[data-rank-position]")).toHaveCount(0);
  });

  test("votos só com 1 ou mais", async ({ page }) => {
    const slug = fixtureMd.href.split("/")[2] ?? "";
    const others = diskPosts()
      .map((post) => post.slug)
      .filter((other) => other !== slug);
    await page.route("**/api/votes", (route) =>
      route.fulfill(
        votesBody({
          [slug]: 1,
          ...Object.fromEntries(others.map((other) => [other, 0])),
        }),
      ),
    );
    await open(page, "/blog/");
    const items = page.locator("[data-listing] article");
    const target = items.filter({
      has: page.locator(`a[href="${fixtureMd.href}"]`),
    });
    await expect(target.locator("[data-votes]")).toBeVisible();
    await expect(target.locator("[data-vote-value]")).toHaveText("1");
    await expect(target.locator("[data-vote-word]")).toHaveText("voto");
    const rest = items.filter({
      hasNot: page.locator(`a[href="${fixtureMd.href}"]`),
    });
    const count = await rest.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(rest.nth(index).locator("[data-votes]")).toBeHidden();
    }

    await page.unrouteAll({ behavior: "ignoreErrors" });
    await page.route("**/api/votes", (route) =>
      route.fulfill(votesBody({}, 500)),
    );
    const failed = page.waitForResponse((response) =>
      response.url().includes("/api/votes"),
    );
    await open(page, "/blog/");
    await failed;
    const all = await items.count();
    for (let index = 0; index < all; index += 1) {
      await expect(items.nth(index).locator("[data-votes]")).toBeHidden();
    }
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
      const headings = page.locator("[data-listing] article h3");
      const count = await headings.count();
      expect(count).toBeGreaterThan(0);
      for (let index = 0; index < count; index += 1) {
        await expect(headings.nth(index)).toHaveCSS("font-size", size);
      }
    }
  });

  test("miniatura só em /prototipos/", async ({ page }) => {
    for (const [width, size] of [
      [360, { width: 72, height: 54 }],
      [1280, { width: 96, height: 72 }],
    ] as const) {
      await page.setViewportSize({ width, height: 800 });
      await open(page, "/prototipos/");
      const items = page.locator("[data-listing] article");
      const count = await items.count();
      expect(count).toBeGreaterThan(0);
      for (let index = 0; index < count; index += 1) {
        const item = items.nth(index);
        const thumb = item.locator("[data-thumb]");
        await expect(thumb).toHaveCount(1);
        const box = await thumb.boundingBox();
        expect(Math.round(box?.width ?? 0)).toBe(size.width);
        expect(Math.round(box?.height ?? 0)).toBe(size.height);
        const parts = await partsOf(item);
        if (!parts.thumb || !parts.title || !parts.date) {
          throw new Error("sem caixa");
        }
        expect(parts.thumb.right).toBeLessThanOrEqual(parts.title.left);
        if (width === 1280) {
          expect(parts.date.right).toBeLessThanOrEqual(parts.thumb.left);
        } else {
          expect(parts.thumb.top).toBeGreaterThanOrEqual(parts.date.bottom - 1);
        }
      }
      const withCover = items
        .filter({ has: page.locator(`a[href="${fixtureMd.href}"]`) })
        .locator("img[data-thumb]");
      await expect(withCover).toHaveAttribute("alt", "");
    }
    for (const listPath of ["/blog/", "/artigos/", `/tags/${fixtureTag}/`]) {
      await open(page, listPath);
      await expect(page.locator("[data-listing] [data-thumb]")).toHaveCount(0);
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
        const link = item.locator("h3 a");
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
      for (const listPath of ["/blog/", "/prototipos/"]) {
        await test.step(`${listPath} ${width}px`, async () => {
          await page.unrouteAll({ behavior: "ignoreErrors" });
          let release = () => {};
          const gate = new Promise<void>((resolve) => {
            release = resolve;
          });
          let opened = false;
          await page.route("**/api/votes", async (route) => {
            if (!opened) await gate;
            await route.fulfill(
              votesBody({ [fixtureMd.href.split("/")[2] ?? ""]: 120 }),
            );
          });
          await page.setViewportSize({ width, height: 800 });
          await open(page, listPath);
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
            expect(Math.abs(a.top - b.top)).toBeLessThan(
              PIXELS_TO_SIGNIFICANCE,
            );
            expect(Math.abs(a.height - b.height)).toBeLessThan(
              PIXELS_TO_SIGNIFICANCE,
            );
          }
        });
      }
    }
  });
});

test.describe("/mais-votados/ [RF-02]", () => {
  test("lateral, / LISTAGEM e o item das listas, sem posição", async ({
    page,
  }) => {
    await page.route("**/api/votes", (route) =>
      route.fulfill(votesBody({ "fixture-md": 2, "fixture-mdx": 1 })),
    );
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      await open(page, "/mais-votados/");
      const items = page.locator("[data-ranking] article");
      await expect(items).toHaveCount(2);
      await expect(page.locator("[data-list-section] h2")).toHaveText(
        "/ LISTAGEM",
      );
      await expect(items.locator("[data-rank-position]")).toHaveCount(0);
      await expect(items.locator("[data-thumb]")).toHaveCount(0);
      const first = items.first();
      await expect(first.locator("h3 a")).toHaveAttribute(
        "href",
        fixtureMd.href,
      );
      await expect(first.locator("time")).toHaveText("02.jan.2000");
      await expect(first.locator("[data-description]")).toHaveText(
        fixtureMd.description,
      );
      await expect(first.locator("[data-reading]")).toContainText(
        /^\s*\d+ minutos?/,
      );
      await expect(first.locator("[data-votes]")).toBeVisible();
      await expect(first.locator("[data-vote-value]")).toHaveText("2");
      await expect(items.nth(1).locator("[data-vote-word]")).toHaveText("voto");
      if (width === 1280) {
        const h1 = await page.locator("h1").boundingBox();
        const list = await page.locator("[data-top-voted]").boundingBox();
        if (!h1 || !list) throw new Error("sem caixa");
        expect(h1.x + h1.width).toBeLessThanOrEqual(list.x);
      }
    }
  });
});
