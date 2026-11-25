import { expect, test, type Locator, type Page } from "@playwright/test";

import { publishedPosts } from "./published-posts";
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

const KIND = new RegExp(`^(${Object.values(KIND_LABELS).join("|")})$`);
const titleHeading = ":is(h2, h3)";

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

async function tagHrefsFromPosts(page: Page): Promise<string[]> {
  const hrefs: string[] = [];
  const seen = new Set<string>();
  for (const post of await publishedPosts(page)) {
    await open(page, post.href);
    const links = page
      .getByRole("list", { name: "Tags", exact: true })
      .getByRole("link");
    const count = await links.count();
    for (let index = 0; index < count; index += 1) {
      const href = await links.nth(index).getAttribute("href");
      if (!href || !/^\/tags\/[a-z0-9-]+\/$/.test(href) || seen.has(href)) {
        continue;
      }
      seen.add(href);
      hrefs.push(href);
    }
  }
  expect(hrefs.length).toBeGreaterThan(0);
  return hrefs;
}

async function listingPaths(page: Page): Promise<string[]> {
  const tags = await tagHrefsFromPosts(page);
  return ["/", "/blog/", tags[0] ?? ""];
}

async function listingSurfaces(page: Page): Promise<string[]> {
  const tags = await tagHrefsFromPosts(page);
  return ["/", "/blog/", "/artigos/", "/prototipos/", ...tags];
}

async function listArticles(page: Page): Promise<Locator[]> {
  const items = page.locator("[data-listing] article");
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
  const articles: Locator[] = [];
  for (let index = 0; index < count; index += 1) {
    articles.push(items.nth(index));
  }
  return articles;
}

async function cardsOn(page: Page): Promise<Locator[]> {
  return listArticles(page);
}

async function publishedHrefs(page: Page): Promise<string[]> {
  const posts = await publishedPosts(page);
  return posts.map((post) => post.href);
}

async function expectDateLine(container: Locator) {
  const time = container.locator("time");
  await expect(time).toHaveCount(1);
  const datetime = (await time.getAttribute("datetime")) ?? "";
  expect(datetime).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await expect(time).toHaveText(dateFromDatetime(datetime));
  // O NOVO divide a linha com a data (BRAND §9.2, T-131).
  await expect(time.locator("xpath=..")).toHaveText(
    new RegExp(`^${dateFromDatetime(datetime).replaceAll(".", "\\.")}(NOVO)?$`),
  );

  await expect(container.getByText(KIND)).toHaveCount(0);
  await expect(container.getByText(/Fól\./)).toHaveCount(0);
  await expect(
    container.getByText(/Iniciante|Intermediário|Avançado/),
  ).toHaveCount(0);
}

async function animationNames(svg: Locator): Promise<string[]> {
  return svg.evaluate((element) =>
    [element, ...element.querySelectorAll("*")].map(
      (node) => getComputedStyle(node).animationName,
    ),
  );
}

// A home tem itens próprios desde a T-125 (BRAND §9.2, home.spec.ts).
function inHomeBand(root: Element) {
  const label = root.closest("section")?.querySelector("h2");
  return /^\/ [A-ZÁÉÍÓÚÂÊÔÃÕÇ ]+$/.test(
    (label?.textContent ?? "").replace(/\s+/g, " ").trim(),
  );
}

test.describe("card e cabeçalho [RF-01, RF-04]", () => {
  test("C1 data e tipo nos cards, sem fólio e sem nível", async ({ page }) => {
    for (const path of await listingPaths(page)) {
      await test.step(path, async () => {
        await open(page, path);
        for (const article of await cardsOn(page)) {
          if (await article.evaluate(inHomeBand)) continue;
          await expectDateLine(article);
        }
      });
    }
  });

  test("C2 título do card na fonte de display 600", async ({ page }) => {
    for (const path of await listingPaths(page)) {
      await test.step(path, async () => {
        await open(page, path);
        const headings = page.locator(`article ${titleHeading}`);
        const count = await headings.count();
        expect(count).toBeGreaterThan(0);
        for (let index = 0; index < count; index += 1) {
          const measured = await headings.nth(index).evaluate((element) => {
            const style = getComputedStyle(element);
            const variable = getComputedStyle(document.documentElement)
              .getPropertyValue("--font-plex-condensed")
              .trim();
            const label = element.closest("section")?.querySelector("h2");
            return {
              family: style.fontFamily,
              variable,
              weight: style.fontWeight,
              fontSize: style.fontSize,
              home: /^\/ /.test((label?.textContent ?? "").trim()),
            };
          });
          expect(familyPrefix(measured.family, measured.variable)).toBe(
            normalizeFamily(measured.variable),
          );
          expect(measured.weight).toBe("600");
          // Os tamanhos dos itens da home estão no home.spec.ts (T-125).
          if (measured.home) continue;
          expect(fontSizePx(measured.fontSize)).toBeGreaterThanOrEqual(20);
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

  test("C4 data e tipo no cabeçalho, sem fólio e sem nível", async ({
    page,
  }) => {
    for (const href of await publishedHrefs(page)) {
      await test.step(href, async () => {
        await open(page, href);
        const header = page.getByRole("article").locator("header");
        await expect(header).toHaveCount(1);

        const publication = await header
          .getByText("Publicação", { exact: true })
          .count();
        expect.soft(publication).toBe(0);
        await expect(header.getByText(/Fól\./)).toHaveCount(0);
        await expect(header.getByText("Nível", { exact: true })).toHaveCount(0);
        await expect(
          header.getByText("Atualizado em", { exact: true }),
        ).toHaveCount(0);

        const rail = header.locator("[data-post-rail]");
        await expect(rail).toHaveCount(1);
        const times = header.locator("time");
        await expect(times).toHaveCount(1);
        const datetime = (await times.getAttribute("datetime")) ?? "";
        expect(datetime).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        await expect(times).toHaveText(dateFromDatetime(datetime));

        const items = rail.locator("> div").nth(1).locator("> div");
        const item = (label: string) =>
          items.filter({ has: page.getByText(label, { exact: true }) });
        await expect(item("Data")).toHaveCount(1);
        await expect(item("Data").locator("time")).toHaveCount(1);
        await expect(item("Tipo").getByText(KIND)).toHaveText(KIND);
      });
    }
  });

  test("C5 ícone do tipo só abaixo de lg", async ({ page }) => {
    for (const href of await publishedHrefs(page)) {
      await test.step(href, async () => {
        await open(page, href);
        const header = page.getByRole("article").locator("header");
        const tipo = header
          .locator("[data-post-rail] > div")
          .nth(1)
          .locator("> div")
          .filter({ has: page.getByText("Tipo", { exact: true }) });
        const svg = tipo.locator("svg");
        await page.setViewportSize({ width: 1280, height: 800 });
        await expect(svg).toHaveCount(1);
        await expect(svg).toBeHidden();

        await page.setViewportSize({ width: 360, height: 800 });
        await expect(svg).toHaveCount(1);
        await expect(svg).toBeVisible();
        await expect(svg).toHaveAttribute("aria-hidden", "true");
        await expect(svg).toHaveCSS("width", "12px");
        await expect(svg).toHaveCSS("height", "12px");
        const names = await animationNames(svg);
        expect(names.every((name) => name === "none")).toBe(true);
      });
    }
  });

  test("C7 nome do link é o título do post", async ({ page }) => {
    const cards: { listing: string; href: string }[] = [];
    for (const path of await listingPaths(page)) {
      await open(page, path);
      for (const article of await cardsOn(page)) {
        const link = article.locator(titleHeading).getByRole("link");
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
          .locator(`article ${titleHeading}`)
          .getByRole("link")
          .filter({ hasText: title });
        await expect(link).toHaveCount(1);
        await expect(link).toHaveAccessibleName(title);
      });
    }
  });

  test("C8 tempo de leitura do card é o do post", async ({ page }) => {
    const seen = new Map<string, string>();
    for (const path of await listingSurfaces(page)) {
      await test.step(path, async () => {
        await open(page, path);
        for (const article of await listArticles(page)) {
          if (await article.evaluate(inHomeBand)) continue;
          const reading = article.locator("[data-reading]");
          await expect(reading).toHaveCount(1);
          // O item diz `N minutos` e o post `N min de leitura` (T-131).
          const cardText = textOf(await reading.textContent()).replace(
            /\s*de leitura$/,
            "",
          );
          expect(cardText).toMatch(/^(1 minuto|\d+ minutos)$/);
          const href =
            (await article
              .locator(titleHeading)
              .getByRole("link")
              .getAttribute("href")) ?? "";
          expect(href).toMatch(/^\/blog\/[a-z0-9-]+\/$/);
          const previous = seen.get(href);
          if (previous !== undefined) {
            expect(cardText).toBe(previous);
            continue;
          }
          await open(page, href);
          const postReading = page.getByText(/^\d+ min de leitura$/);
          await expect(postReading).toHaveCount(1);
          const postText = textOf(await postReading.textContent());
          expect(Number.parseInt(cardText, 10)).toBe(
            Number.parseInt(postText, 10),
          );
          seen.set(href, cardText);
          await open(page, path);
        }
      });
    }
    expect(seen.size).toBeGreaterThan(0);
  });

  test("C9 nenhum card com capa", async ({ page }) => {
    const paths = await tagHrefsFromPosts(page);
    for (const path of paths) {
      await test.step(path, async () => {
        await open(page, path);
        await expect(page.locator("article img")).toHaveCount(0);
      });
    }
  });

  // O C11, o C12, o C14, o C18, o C20 e a linha de baixo eram do item da
  // T-123; o item empilhado está no list-item.spec.ts (T-131, Q24).

  test("GET com 0 mostra 0 e GET 500 mantém –", async ({ page }) => {
    const slugs = [
      "fixture-md",
      "fixture-mdx",
      "fixture-sem-titulos",
      "fixture-formulas",
      "2026-10-como-o-blog-e-feito",
      "2026-10-por-que-este-blog",
    ];
    await page.route("**/api/votes", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          votes: Object.fromEntries(slugs.map((slug) => [slug, 0])),
        }),
      });
    });
    await open(page, "/blog/");
    const zeros = page.locator("[data-listing] [data-vote-value]");
    await expect(zeros.first()).toHaveText("0");
    const zeroCount = await zeros.count();
    expect(zeroCount).toBeGreaterThan(0);
    for (let index = 0; index < zeroCount; index += 1) {
      await expect(zeros.nth(index)).toHaveText("0");
    }

    await page.unrouteAll({ behavior: "ignoreErrors" });
    await page.route("**/api/votes", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: "{}",
      });
    });
    const failed = page.waitForResponse(
      (response) => response.url().includes("/api/votes"),
      { timeout: 5_000 },
    );
    await open(page, "/blog/");
    await failed;
    const dashes = page.locator("[data-listing] [data-vote-value]");
    const dashCount = await dashes.count();
    expect(dashCount).toBeGreaterThan(0);
    for (let index = 0; index < dashCount; index += 1) {
      await expect(dashes.nth(index)).toHaveText("–");
    }
  });
});
