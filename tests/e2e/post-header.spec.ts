import { expect, test, type Locator, type Page } from "@playwright/test";

import { publishedPosts } from "./published-posts";

const LABELS = [
  "Data",
  "Atualizado em",
  "Leitura",
  "Tipo",
  "Nível",
  "Autor",
  "Tags",
] as const;

function familyNames(stack: string): string[] {
  const names: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (const char of stack) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === ",") {
      names.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) names.push(current.trim());
  return names;
}

function firstFamily(stack: string): string {
  return familyNames(stack)[0] ?? "";
}

async function variableFamily(page: Page, variable: string): Promise<string> {
  const value = await page.evaluate((name) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }, variable);
  expect(value, variable).not.toBe("");
  return firstFamily(value);
}

function channels(color: string): [number, number, number] {
  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color.trim());
  if (hex?.[1] && hex[2] && hex[3]) {
    return [
      Number.parseInt(hex[1], 16),
      Number.parseInt(hex[2], 16),
      Number.parseInt(hex[3], 16),
    ];
  }
  const match = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (!match?.[1] || !match[2] || !match[3]) {
    throw new Error(color);
  }
  return [
    Math.round(Number(match[1])),
    Math.round(Number(match[2])),
    Math.round(Number(match[3])),
  ];
}

function text(value: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

async function box(locator: Locator) {
  const value = await locator.boundingBox();
  expect(value).not.toBeNull();
  if (!value) throw new Error("sem caixa");
  return value;
}

async function railMetrics(rail: Locator) {
  return rail.evaluate((element) => {
    const cell = element.firstElementChild;
    const meta = element.lastElementChild;
    if (!(cell instanceof HTMLElement) || !(meta instanceof HTMLElement)) {
      return null;
    }
    const railBox = element.getBoundingClientRect();
    const metaBox = meta.getBoundingClientRect();
    return {
      cellHeight: cell.getBoundingClientRect().height,
      metaTop: metaBox.top - railBox.top,
    };
  });
}

test.describe("cabeçalho do post [RF-04]", () => {
  test("H1 lateral a 1280", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const posts = await publishedPosts(page);
    const display = await variableFamily(page, "--font-plex-condensed");

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);
        const header = page.getByRole("article").locator("header");
        const rail = header.locator("[data-post-rail]");
        await expect(rail).toHaveCount(1);

        const railBox = await box(rail);
        expect(railBox.width).toBeCloseTo(240, 0);
        await expect(rail).toHaveCSS("position", "sticky");

        const prose = page.locator("article > .prose");
        const proseBox = await box(prose);
        expect(proseBox.x - (railBox.x + railBox.width)).toBeCloseTo(64, 0);

        const cell = rail.locator("> div").first();
        const digits = cell.locator("> div > span").nth(1);
        await expect(digits).toHaveCSS("font-size", "44px");
        await expect(digits).toHaveCSS("font-weight", "600");
        const family = await digits.evaluate(
          (element) => getComputedStyle(element).fontFamily,
        );
        expect(firstFamily(family)).toBe(display);

        const meta = rail.locator("> div").nth(1);
        const found = await meta
          .locator("p")
          .evaluateAll(
            (nodes, labels) =>
              nodes
                .map((node) =>
                  (node.textContent ?? "").replace(/\s+/g, " ").trim(),
                )
                .filter((value) => labels.includes(value)),
            [...LABELS] as string[],
          );
        const timeCount = await header.locator("time").count();
        const expected = LABELS.filter(
          (label) => label !== "Atualizado em" || timeCount === 2,
        );
        expect(found).toEqual(expected);

        const title = cell.locator("p[aria-hidden='true']");
        await expect(title).toHaveCount(1);
        await expect(title).toHaveAttribute("aria-hidden", "true");
        expect(await title.evaluate((element) => element.tagName)).toBe("P");
        expect(text(await title.textContent())).toBe(post.title);
        await expect(
          page.getByRole("heading", { name: post.title, exact: true }),
        ).toHaveCount(1);

        const deck = header.locator("> p");
        await expect(deck).toHaveCount(1);
        await expect(deck).toHaveCSS("font-size", "24px");
        const muted = await page.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-muted")
            .trim(),
        );
        const color = await deck.evaluate(
          (element) => getComputedStyle(element).color,
        );
        expect(channels(color)).toEqual(channels(muted));
      });
    }
  });

  test("H2 lateral a 360", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const posts = await publishedPosts(page);

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);
        const header = page.getByRole("article").locator("header");
        const rail = header.locator("[data-post-rail]");
        await expect(rail).toHaveCount(1);
        await expect(rail).not.toHaveCSS("position", "sticky");

        const cell = rail.locator("> div").first();
        const deck = header.locator("> p");
        const meta = rail.locator("> div").nth(1);
        const folioTop = (await box(cell)).y;
        const titleTop = (await box(header.locator("h1"))).y;
        const deckTop = (await box(deck)).y;
        const metaTop = (await box(meta)).y;
        expect(folioTop).toBeLessThan(titleTop);
        expect(titleTop).toBeLessThan(deckTop);
        expect(deckTop).toBeLessThan(metaTop);

        const tracks = await meta.evaluate((element) =>
          getComputedStyle(element)
            .gridTemplateColumns.split(" ")
            .filter((part) => part.length > 0),
        );
        expect(tracks).toHaveLength(2);
        const first = await box(meta.locator("> div").nth(0));
        const second = await box(meta.locator("> div").nth(1));
        expect(Math.abs(first.y - second.y)).toBeLessThan(1);
        expect(second.x - first.x).toBeGreaterThan(8);

        const hiddenTitle = cell.locator("p[aria-hidden='true']");
        await expect(hiddenTitle).toHaveCSS("display", "none");
        await expect(deck).toHaveCSS("font-size", "18px");
      });
    }
  });

  test("H3 título da lateral ao rolar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const posts = await publishedPosts(page);

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);
        const rail = page.locator("[data-post-rail]");
        await expect(rail).toHaveCount(1);
        await expect(rail).not.toHaveAttribute("data-title-out");

        const before = await railMetrics(rail);
        expect(before).not.toBeNull();
        if (!before) return;

        await page
          .locator("article > .prose p")
          .last()
          .evaluate((element) => {
            element.scrollIntoView();
          });
        await expect(rail).toHaveAttribute("data-title-out", "");

        const cell = rail.locator("> div").first();
        const title = cell.locator("p[aria-hidden='true']");
        const folio = cell.locator("> div").first();
        await expect(title).toHaveCSS("opacity", "1");
        await expect(folio).toHaveCSS("opacity", "0");

        const after = await railMetrics(rail);
        expect(after).not.toBeNull();
        if (!after) return;
        expect(after.cellHeight).toBeCloseTo(before.cellHeight, 0);
        expect(after.metaTop).toBeCloseTo(before.metaTop, 0);

        await page.locator("article h1").evaluate((element) => {
          element.scrollIntoView();
        });
        await expect(rail).not.toHaveAttribute("data-title-out");
      });
    }
  });

  test("H4 movimento reduzido", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 800 });
    const posts = await publishedPosts(page);

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);
        const rail = page.locator("[data-post-rail]");
        await expect(rail).toHaveCount(1);
        const cell = rail.locator("> div").first();
        const title = cell.locator("p[aria-hidden='true']");
        const folio = cell.locator("> div").first();
        await expect(title).toHaveCSS("transition-duration", "0s");
        await expect(folio).toHaveCSS("transition-duration", "0s");

        await page
          .locator("article > .prose p")
          .last()
          .evaluate((element) => {
            element.scrollIntoView();
          });
        await expect(rail).toHaveAttribute("data-title-out", "");
        await expect(title).toHaveCSS("opacity", "1");
        await expect(folio).toHaveCSS("opacity", "0");
      });
    }
  });
});

test.describe("cabeçalho do post sem JavaScript [RF-04]", () => {
  test.use({ javaScriptEnabled: false });

  test("H5 sem JavaScript fica o fólio", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const posts = await publishedPosts(page);

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);
        const rail = page.locator("[data-post-rail]");
        await expect(rail).toHaveCount(1);
        await page
          .locator("article > .prose p")
          .last()
          .evaluate((element) => {
            element.scrollIntoView();
          });
        await expect(rail).not.toHaveAttribute("data-title-out");
        const cell = rail.locator("> div").first();
        await expect(cell.locator("p[aria-hidden='true']")).toHaveCSS(
          "opacity",
          "0",
        );
        await expect(cell.locator("> div").first()).toHaveCSS("opacity", "1");
      });
    }
  });
});
