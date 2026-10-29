import { expect, test, type Locator, type Page } from "@playwright/test";

import { nextPageLink, titlePostsOnPage } from "./published-posts";
import { KIND_LABELS } from "../../src/lib/kind";

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
] as const;

const MONTH = MONTHS.join("|");
const FOLIO_DATE = new RegExp(
  `^Fól\\. \\d{3} · \\d{2}\\.(?:${MONTH})\\.\\d{4}$`,
);
const KIND = new RegExp(`^(${Object.values(KIND_LABELS).join("|")})$`);
const LEVEL = /^\\{3} (Iniciante|Intermediário|Avançado)$/;
const HATCH = {
  Iniciante: 1,
  Intermediário: 2,
  Avançado: 3,
} as const;

function dateFromDatetime(datetime: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datetime);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  if (!match?.[1] || !match[3] || !month) return datetime;
  return `${match[3]}.${month}.${match[1]}`;
}

function normalizeFamily(value: string): string {
  return value.replace(/\s*,\s*/g, ",").trim();
}

function familyPrefix(family: string, variable: string): string {
  const normalizedFamily = normalizeFamily(family);
  const normalizedVariable = normalizeFamily(variable);
  if (
    normalizedVariable.length > 0 &&
    normalizedFamily.startsWith(normalizedVariable)
  ) {
    return normalizedVariable;
  }
  return normalizedFamily;
}

function fontSizePx(value: string): number {
  const match = /^(\d+(?:\.\d+)?)px$/.exec(value.trim());
  return match?.[1] ? Number(match[1]) : Number.NaN;
}

function textOf(value: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

async function open(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
}

async function tagPathFromNav(page: Page): Promise<string> {
  const nav = page.getByRole("navigation", {
    name: "Filtrar por tag",
    exact: true,
  });
  await expect(nav).toHaveCount(1);
  const hrefs = await nav
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  const tag = hrefs.find((href) => href?.startsWith("/tags/"));
  expect(tag).toBeTruthy();
  return tag ?? "";
}

async function listingPaths(page: Page): Promise<string[]> {
  await open(page, "/");
  return ["/", await tagPathFromNav(page)];
}

async function cardsOn(page: Page, path: string): Promise<Locator[]> {
  const articles: Locator[] = [];
  if (path === "/") {
    const destaque = page.getByRole("region", {
      name: "Destaque",
      exact: true,
    });
    await expect(destaque).toHaveCount(1);
    const featured = destaque.locator("article");
    await expect(featured).toHaveCount(1);
    articles.push(featured);
  }
  const list = page.getByRole("list", { name: "Posts", exact: true });
  await expect(list).toHaveCount(1);
  const items = list.locator(":scope > li").locator("article");
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    articles.push(items.nth(index));
  }
  return articles;
}

async function publishedHrefs(page: Page): Promise<string[]> {
  const hrefs: string[] = [];
  const seen = new Set<string>();
  await open(page, "/");
  for (;;) {
    for (const post of await titlePostsOnPage(page)) {
      if (seen.has(post.href)) continue;
      seen.add(post.href);
      hrefs.push(post.href);
    }
    const next = nextPageLink(page);
    if ((await next.count()) === 0) break;
    const href = await next.getAttribute("href");
    expect(href).toBeTruthy();
    await open(page, href ?? "");
  }
  expect(hrefs.length).toBeGreaterThan(0);
  return hrefs;
}

async function expectFolioLine(container: Locator) {
  const time = container.locator("time");
  await expect(time).toHaveCount(1);
  const datetime = (await time.getAttribute("datetime")) ?? "";
  expect(datetime).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await expect(time).toHaveText(dateFromDatetime(datetime));
  await expect(time.locator("xpath=..")).toHaveText(FOLIO_DATE);

  const kind = container.getByText(KIND);
  await expect(kind).toHaveText(KIND);

  const level = container.getByText(LEVEL);
  await expect(level).toHaveText(LEVEL);
  const levelText = textOf(await level.textContent());
  const name = /^\\{3} (Iniciante|Intermediário|Avançado)$/.exec(
    levelText,
  )?.[1];
  const label = name as keyof typeof HATCH | undefined;
  const marked = textOf(
    await level
      .locator("[aria-hidden='true'] > span")
      .first()
      .evaluate((element) => element.textContent),
  );
  const strokes = /^(\\+)$/.exec(marked)?.[1]?.length;
  expect(strokes).toBe(label ? HATCH[label] : undefined);
}

async function animationNames(svg: Locator): Promise<string[]> {
  return svg.evaluate((element) =>
    [element, ...element.querySelectorAll("*")].map(
      (node) => getComputedStyle(node).animationName,
    ),
  );
}

test.describe("card e cabeçalho [RF-01, RF-04]", () => {
  test("C1 fólio, data, tipo e nível nos cards", async ({ page }) => {
    for (const path of await listingPaths(page)) {
      await test.step(path, async () => {
        await open(page, path);
        for (const article of await cardsOn(page, path)) {
          await expectFolioLine(article);
        }
      });
    }
  });

  test("C2 título do card em Cormorant 600", async ({ page }) => {
    for (const path of await listingPaths(page)) {
      await test.step(path, async () => {
        await open(page, path);
        const headings = page.locator("article h2");
        const count = await headings.count();
        expect(count).toBeGreaterThan(0);
        for (let index = 0; index < count; index += 1) {
          const measured = await headings.nth(index).evaluate((element) => {
            const style = getComputedStyle(element);
            const variable = getComputedStyle(document.documentElement)
              .getPropertyValue("--font-cormorant")
              .trim();
            return {
              family: style.fontFamily,
              variable,
              weight: style.fontWeight,
              fontSize: style.fontSize,
            };
          });
          expect(familyPrefix(measured.family, measured.variable)).toBe(
            normalizeFamily(measured.variable),
          );
          expect(measured.weight).toBe("600");
          expect(fontSizePx(measured.fontSize)).toBeGreaterThanOrEqual(22);
        }
      });
    }
  });

  test("C3 ícone parado no card", async ({ page }) => {
    for (const path of await listingPaths(page)) {
      await test.step(path, async () => {
        await open(page, path);
        const svgs = page.locator("article svg");
        const count = await svgs.count();
        expect(count).toBeGreaterThan(0);
        for (let index = 0; index < count; index += 1) {
          const svg = svgs.nth(index);
          await expect(svg).toHaveAttribute("aria-hidden", "true");
          const names = await animationNames(svg);
          expect(names.every((name) => name === "none")).toBe(true);
        }
      });
    }
  });

  test("C4 fólio, tipo e nível no cabeçalho", async ({ page }) => {
    for (const href of await publishedHrefs(page)) {
      await test.step(href, async () => {
        await open(page, href);
        const header = page.getByRole("article").locator("header");
        await expect(header).toHaveCount(1);

        const publication = await header
          .getByText("Publicação", { exact: true })
          .count();
        expect.soft(publication).toBe(0);

        const times = header.locator("time");
        const timeCount = await times.count();
        expect.soft([1, 2]).toContain(timeCount);
        for (let index = 0; index < timeCount; index += 1) {
          const time = times.nth(index);
          const datetime = (await time.getAttribute("datetime")) ?? "";
          expect.soft(datetime).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          await expect.soft(time).toHaveText(dateFromDatetime(datetime));
        }

        const h1 = header.locator("h1");
        await expect(h1).toHaveCount(1);
        const previous = h1.locator("xpath=preceding-sibling::*[1]");
        const previousCount = await previous.count();
        expect(previousCount).toBe(1);
        await expectFolioLine(previous);

        const outside = timeCount - (await previous.locator("time").count());
        expect([0, 1]).toContain(outside);
        expect(
          await header.getByText("Atualizado em", { exact: true }).count(),
        ).toBe(outside);
        if (outside === 1) {
          const placed = await header.evaluate((headerEl) => {
            const line = headerEl.querySelector("h1")?.previousElementSibling;
            return [...headerEl.querySelectorAll("time")]
              .filter((time) => !line?.contains(time))
              .every((time) =>
                (time.parentElement?.textContent ?? "").includes(
                  "Atualizado em",
                ),
              );
          });
          expect(placed).toBe(true);
        }
      });
    }
  });

  test("C5 ícone animado no cabeçalho", async ({ page }) => {
    for (const href of await publishedHrefs(page)) {
      await test.step(href, async () => {
        await open(page, href);
        const svg = page.getByRole("article").locator("header svg");
        expect(await svg.count()).toBe(1);
        await expect(svg).toHaveAttribute("aria-hidden", "true");
        const names = await animationNames(svg);
        expect(names.some((name) => name !== "none")).toBe(true);
      });
    }
  });

  test("C6 ícone parado com movimento reduzido", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, "/");
    const hrefs = await page
      .locator("article h2 a")
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      );
    expect(hrefs.length).toBeGreaterThan(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const href of hrefs) {
      await test.step(href, async () => {
        await open(page, href);
        const svg = page.getByRole("article").locator("header svg");
        expect(await svg.count()).toBe(1);
        const names = await animationNames(svg);
        expect(names.every((name) => name === "none")).toBe(true);
      });
    }
  });

  test("C7 nome do link é o título do post", async ({ page }) => {
    const cards: { listing: string; href: string }[] = [];
    for (const path of await listingPaths(page)) {
      await open(page, path);
      for (const article of await cardsOn(page, path)) {
        const link = article.locator("h2").getByRole("link");
        await expect(link).toHaveCount(1);
        const href = (await link.getAttribute("href")) ?? "";
        expect(href).toMatch(/^\/blog\/[a-z0-9-]+\/$/);
        cards.push({ listing: path, href });
      }
    }
    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      await test.step(`${card.listing} ${card.href}`, async () => {
        await open(page, card.href);
        const h1 = page.locator("h1");
        await expect(h1).toHaveCount(1);
        const title = textOf(
          await h1.evaluate((element) => element.textContent),
        );
        await open(page, card.listing);
        const link = page
          .locator("article h2")
          .getByRole("link")
          .filter({ hasText: title });
        await expect(link).toHaveCount(1);
        await expect(link).toHaveAccessibleName(title);
      });
    }
  });
});
