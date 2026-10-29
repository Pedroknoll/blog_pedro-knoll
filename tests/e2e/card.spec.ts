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

async function listingSurfaces(page: Page): Promise<string[]> {
  await open(page, "/");
  const paths = ["/"];
  for (;;) {
    const next = nextPageLink(page);
    if ((await next.count()) === 0) break;
    const href = await next.getAttribute("href");
    expect(href).toBeTruthy();
    await open(page, href ?? "");
    paths.push(href ?? "");
  }
  await open(page, "/");
  const nav = page.getByRole("navigation", {
    name: "Filtrar por tag",
    exact: true,
  });
  await expect(nav).toHaveCount(1);
  const hrefs = await nav
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  const tags = hrefs.filter((href) => href?.startsWith("/tags/"));
  expect(tags.length).toBeGreaterThan(0);
  return [...paths, ...tags.filter((href): href is string => !!href)];
}

async function listArticles(page: Page): Promise<Locator[]> {
  const list = page.getByRole("list", { name: "Posts", exact: true });
  await expect(list).toHaveCount(1);
  const items = list.locator(":scope > li").locator("article");
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
  const articles: Locator[] = [];
  for (let index = 0; index < count; index += 1) {
    articles.push(items.nth(index));
  }
  return articles;
}

async function featuredArticle(page: Page): Promise<Locator | null> {
  const destaque = page.getByRole("region", { name: "Destaque", exact: true });
  if ((await destaque.count()) === 0) return null;
  const featured = destaque.locator("article");
  await expect(featured).toHaveCount(1);
  return featured;
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

  test("C8 tempo de leitura do card é o do post", async ({ page }) => {
    const seen = new Map<string, string>();
    for (const path of await listingSurfaces(page)) {
      await test.step(path, async () => {
        await open(page, path);
        const featured = await featuredArticle(page);
        const articles = [
          ...(featured ? [featured] : []),
          ...(await listArticles(page)),
        ];
        for (const article of articles) {
          const hidden = article.locator(".sr-only");
          await expect(hidden).toHaveCount(1);
          const cardText = await article.evaluate((root) => {
            const note = root.querySelector(".sr-only");
            const visible = note?.previousElementSibling;
            return `${visible?.textContent ?? ""}${note?.textContent ?? ""}`
              .replace(/\s+/g, " ")
              .trim();
          });
          const href =
            (await article
              .locator("h2")
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
          expect(cardText).toBe(postText);
          seen.set(href, cardText);
          await open(page, path);
        }
      });
    }
    expect(seen.size).toBeGreaterThan(0);
  });

  test("C9 capa só no destaque", async ({ page }) => {
    await open(page, "/");
    const destaque = page.getByRole("region", {
      name: "Destaque",
      exact: true,
    });
    await expect(destaque.locator("img")).toHaveCount(1);
    for (const article of await listArticles(page)) {
      await expect(article.locator("img")).toHaveCount(0);
    }

    await open(page, "/");
    const nav = page.getByRole("navigation", {
      name: "Filtrar por tag",
      exact: true,
    });
    const hrefs = await nav
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    const tags = hrefs.filter((href) => href?.startsWith("/tags/"));
    expect(tags.length).toBeGreaterThan(0);
    for (const path of tags) {
      await test.step(path ?? "", async () => {
        await open(page, path ?? "");
        for (const article of await listArticles(page)) {
          await expect(article.locator("img")).toHaveCount(0);
        }
      });
    }
  });

  test("C10 número do fólio em Cormorant 600", async ({ page }) => {
    for (const path of await listingSurfaces(page)) {
      await test.step(path, async () => {
        await open(page, path);
        const numbers = page
          .locator("article time")
          .locator("xpath=..")
          .getByText(/^\d+$/);
        const count = await numbers.count();
        expect(count).toBeGreaterThan(0);
        for (let index = 0; index < count; index += 1) {
          const measured = await numbers.nth(index).evaluate((element) => {
            const style = getComputedStyle(element);
            const variable = getComputedStyle(document.documentElement)
              .getPropertyValue("--font-cormorant")
              .trim();
            return {
              text: (element.textContent ?? "").trim(),
              family: style.fontFamily,
              variable,
              weight: style.fontWeight,
              fontSize: style.fontSize,
            };
          });
          expect(measured.text).toMatch(/^\d+$/);
          expect(familyPrefix(measured.family, measured.variable)).toBe(
            normalizeFamily(measured.variable),
          );
          expect(measured.weight).toBe("600");
          expect(fontSizePx(measured.fontSize)).toBeGreaterThanOrEqual(22);
        }
      });
    }
  });

  test("C11 faixa do fólio e Fól. 1000", async ({ page }) => {
    const paths = await listingSurfaces(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    for (const path of paths) {
      await test.step(`${path} 1280`, async () => {
        await open(page, path);
        for (const article of await listArticles(page)) {
          const placed = await article.evaluate((root) => {
            const folio = root.querySelector("time")?.parentElement;
            const heading = root.querySelector("h2");
            if (!folio || !heading) return null;
            const folioBox = folio.getBoundingClientRect();
            const headingBox = heading.getBoundingClientRect();
            const articleBox = root.getBoundingClientRect();
            return {
              folioRight: folioBox.right,
              headingLeft: headingBox.left,
              folioMid: (folioBox.top + folioBox.bottom) / 2,
              articleMid: (articleBox.top + articleBox.bottom) / 2,
            };
          });
          expect(placed).not.toBeNull();
          if (!placed) continue;
          expect(placed.folioRight).toBeLessThanOrEqual(placed.headingLeft);
          expect(
            Math.abs(placed.folioMid - placed.articleMid),
          ).toBeLessThanOrEqual(2);

          const fitted = await article
            .locator("time")
            .locator("xpath=..")
            .evaluate((column) => {
              const line = [...column.querySelectorAll("span")].find((span) =>
                [...span.childNodes].some(
                  (node) =>
                    node.nodeType === Node.TEXT_NODE &&
                    (node.textContent ?? "").includes("Fól."),
                ),
              );
              const number = line
                ? [...line.querySelectorAll("span")].find((span) =>
                    /^\d+$/.test((span.textContent ?? "").trim()),
                  )
                : undefined;
              if (!line || !number) {
                return {
                  ok: false,
                  reason: "sem linha",
                  scrollWidth: 0,
                  clientWidth: 0,
                  rects: 0,
                };
              }
              const clone = line.cloneNode(true) as HTMLElement;
              const clonedNumber = [...clone.querySelectorAll("span")].find(
                (span) => /^\d+$/.test((span.textContent ?? "").trim()),
              );
              if (!clonedNumber) {
                return {
                  ok: false,
                  reason: "sem número",
                  scrollWidth: 0,
                  clientWidth: 0,
                  rects: 0,
                };
              }
              clonedNumber.textContent = "1000";
              const clientWidth = column.clientWidth;
              const columnStyle = getComputedStyle(column);
              const holder = document.createElement("div");
              holder.style.cssText = `position:absolute;left:0;top:0;visibility:hidden;width:${clientWidth}px;`;
              holder.style.fontFamily = columnStyle.fontFamily;
              holder.style.fontSize = columnStyle.fontSize;
              holder.style.fontWeight = columnStyle.fontWeight;
              holder.style.letterSpacing = columnStyle.letterSpacing;
              holder.style.lineHeight = columnStyle.lineHeight;
              clone.style.display = "inline-block";
              holder.appendChild(clone);
              document.body.appendChild(holder);
              const scrollWidth = clone.scrollWidth;
              const rects = clone.getClientRects().length;
              holder.remove();
              return {
                ok:
                  scrollWidth > 0 && scrollWidth <= clientWidth && rects === 1,
                scrollWidth,
                clientWidth,
                rects,
              };
            });
          expect(fitted.ok, JSON.stringify(fitted)).toBe(true);
        }

        const featured = await featuredArticle(page);
        if (featured) {
          const above = await featured.evaluate((root) => {
            const folio = root.querySelector("time")?.parentElement;
            const heading = root.querySelector("h2");
            if (!folio || !heading) return null;
            const folioBox = folio.getBoundingClientRect();
            const headingBox = heading.getBoundingClientRect();
            return {
              folioTop: folioBox.top,
              folioBottom: folioBox.bottom,
              headingTop: headingBox.top,
            };
          });
          expect(above).not.toBeNull();
          if (!above) return;
          expect(above.folioTop).toBeLessThan(above.headingTop);
          expect(above.folioBottom).toBeLessThanOrEqual(above.headingTop + 1);
        }
      });
    }

    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of paths) {
      await test.step(`${path} 360`, async () => {
        await open(page, path);
        const featured = await featuredArticle(page);
        const articles = [
          ...(featured ? [featured] : []),
          ...(await listArticles(page)),
        ];
        for (const article of articles) {
          const above = await article.evaluate((root) => {
            const folio = root.querySelector("time")?.parentElement;
            const heading = root.querySelector("h2");
            if (!folio || !heading) return null;
            const folioBox = folio.getBoundingClientRect();
            const headingBox = heading.getBoundingClientRect();
            return {
              folioTop: folioBox.top,
              folioBottom: folioBox.bottom,
              headingTop: headingBox.top,
            };
          });
          expect(above).not.toBeNull();
          if (!above) continue;
          expect(above.folioTop).toBeLessThan(above.headingTop);
          expect(above.folioBottom).toBeLessThanOrEqual(above.headingTop + 1);
        }
      });
    }
  });

  test("C12 rodapé não abre nem fecha linha com pipe", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, "/");
    const widths = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth);

    const footer = page.locator("article p.footer");
    await expect(footer.first()).toBeVisible();
    const edges = await footer.first().evaluate((source) => {
      const clone = source.cloneNode(true) as HTMLElement;
      const width = source.getBoundingClientRect().width;
      const kind = [...clone.querySelectorAll("span")].find((span) =>
        /^(Conceito|Tutorial|Lab|Playbook)$/.test(
          (span.textContent ?? "").trim(),
        ),
      );
      if (kind) kind.textContent = "Playbook";
      const minutes = [...clone.querySelectorAll("span")].find((span) =>
        /^\d+\s+min$/.test(
          (span.textContent ?? "").replace(/\s+/g, " ").trim(),
        ),
      );
      if (minutes) minutes.textContent = "20 min";
      const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const value = walker.currentNode.textContent ?? "";
        if (/Iniciante|Intermediário|Avançado/.test(value)) {
          walker.currentNode.textContent = value.replace(
            /Iniciante|Intermediário|Avançado/,
            "Intermediário",
          );
        }
      }
      clone.style.position = "absolute";
      clone.style.left = "0";
      clone.style.top = "0";
      clone.style.width = `${width}px`;
      clone.style.boxSizing = "border-box";
      document.body.appendChild(clone);
      const clip = clone.getBoundingClientRect();
      const glyphs: { ch: string; left: number; top: number }[] = [];
      const texts = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
      while (texts.nextNode()) {
        const node = texts.currentNode;
        const parent = node.parentElement;
        if (!parent || parent.closest(".sr-only")) continue;
        const raw = node.textContent ?? "";
        for (let index = 0; index < raw.length; index += 1) {
          const ch = raw[index] ?? "";
          if (ch.trim() === "") continue;
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + 1);
          const rect = range.getBoundingClientRect();
          const visible =
            Math.min(rect.right, clip.right) - Math.max(rect.left, clip.left);
          if (rect.width <= 0 || rect.height <= 0 || visible <= 1) continue;
          if (rect.bottom <= clip.top || rect.top >= clip.bottom) continue;
          glyphs.push({ ch, left: rect.left, top: rect.top });
        }
      }
      clone.remove();
      glyphs.sort(
        (left, right) => left.top - right.top || left.left - right.left,
      );
      const lines: { ch: string; left: number; top: number }[][] = [];
      for (const glyph of glyphs) {
        const line = lines.find(
          (items) => Math.abs((items[0]?.top ?? 0) - glyph.top) < 4,
        );
        if (line) line.push(glyph);
        else lines.push([glyph]);
      }
      return lines
        .map((line) => {
          line.sort((left, right) => left.left - right.left);
          return {
            first: line[0]?.ch ?? "",
            last: line[line.length - 1]?.ch ?? "",
            text: line.map((glyph) => glyph.ch).join(""),
          };
        })
        .filter((line) => line.first === "|" || line.last === "|");
    });
    expect(edges).toEqual([]);
  });

  test("C13 vãos na linha do fólio", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of await listingSurfaces(page)) {
      await test.step(path, async () => {
        await open(page, path);
        const featured = await featuredArticle(page);
        const articles = [
          ...(featured ? [featured] : []),
          ...(await listArticles(page)),
        ];
        for (const article of articles) {
          const gaps = await article
            .locator("time")
            .locator("xpath=..")
            .evaluate((column) => {
              const number = [...column.querySelectorAll("span")].find(
                (span) =>
                  span.childElementCount === 0 &&
                  /^\d+$/.test((span.textContent ?? "").trim()),
              );
              const dot = [...column.querySelectorAll("span")].find(
                (span) => (span.textContent ?? "") === "·",
              );
              const time = column.querySelector("time");
              const folioNode = number
                ? [...(number.parentElement?.childNodes ?? [])].find(
                    (node) =>
                      node.nodeType === Node.TEXT_NODE &&
                      (node.textContent ?? "").includes("Fól."),
                  )
                : undefined;
              if (
                !number ||
                !dot ||
                !time ||
                !folioNode ||
                folioNode.nodeType !== Node.TEXT_NODE
              ) {
                return null;
              }
              const raw = folioNode.textContent ?? "";
              const start = raw.indexOf("Fól.");
              const range = document.createRange();
              range.setStart(folioNode, start);
              range.setEnd(folioNode, start + "Fól.".length);
              return [range.getBoundingClientRect(), number, dot, time].map(
                (box) => {
                  const rect =
                    box instanceof Element ? box.getBoundingClientRect() : box;
                  return { left: rect.left, right: rect.right };
                },
              );
            });
          expect(gaps).not.toBeNull();
          if (!gaps) continue;
          expect(gaps).toHaveLength(4);
          for (let index = 1; index < gaps.length; index += 1) {
            const previous = gaps[index - 1];
            const current = gaps[index];
            if (!previous || !current) continue;
            expect(current.left - previous.right).toBeGreaterThan(0);
          }
        }
      });
    }
  });

  test("C14 relógio parado e título sem sublinhado", async ({ page }) => {
    for (const path of await listingSurfaces(page)) {
      await test.step(path, async () => {
        await open(page, path);
        const featured = await featuredArticle(page);
        const articles = [
          ...(featured ? [featured] : []),
          ...(await listArticles(page)),
        ];
        for (const article of articles) {
          const clock = await article.evaluate((root) => {
            const note = root.querySelector(".sr-only");
            const span = note?.previousElementSibling;
            const svg = span?.querySelector(":scope > svg");
            if (!svg) return { ok: false, reason: "sem svg" };
            let after = "";
            for (let node = svg.nextSibling; node; node = node.nextSibling) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                return { ok: false, reason: "elemento depois do svg" };
              }
              after += node.textContent ?? "";
            }
            return {
              ok: /^\d+\s+min$/.test(after.replace(/\s+/g, " ").trim()),
              hidden: svg.getAttribute("aria-hidden"),
              after: after.replace(/\s+/g, " ").trim(),
            };
          });
          expect(clock.ok, JSON.stringify(clock)).toBe(true);
          expect(clock.hidden).toBe("true");

          const decoration = await article
            .locator("h2")
            .getByRole("link")
            .evaluate(
              (element) => getComputedStyle(element).textDecorationLine,
            );
          expect(decoration).toBe("none");
        }
      });
    }
  });

  test("C15 borda só no destaque", async ({ page }) => {
    await open(page, "/");
    const featured = await featuredArticle(page);
    expect(featured).not.toBeNull();
    if (!featured) return;
    const border = await featured.evaluate((article) => {
      const style = getComputedStyle(article);
      const probe = document.createElement("div");
      probe.style.borderBottomColor = "var(--color-line)";
      document.body.appendChild(probe);
      const line = getComputedStyle(probe).borderBottomColor;
      probe.remove();
      return {
        top: style.borderTopWidth,
        right: style.borderRightWidth,
        bottom: style.borderBottomWidth,
        left: style.borderLeftWidth,
        bottomStyle: style.borderBottomStyle,
        bottomColor: style.borderBottomColor,
        line,
        paddingTop: Number.parseFloat(style.paddingTop),
        paddingRight: Number.parseFloat(style.paddingRight),
        paddingBottom: Number.parseFloat(style.paddingBottom),
        paddingLeft: Number.parseFloat(style.paddingLeft),
      };
    });
    expect(border.bottom).toBe("1px");
    expect(border.top).toBe("0px");
    expect(border.left).toBe("0px");
    expect(border.right).toBe("0px");
    expect(border.bottomStyle).toBe("solid");
    expect(border.bottomColor).toBe(border.line);
    expect(border.paddingTop).toBeGreaterThanOrEqual(20);
    expect(border.paddingBottom).toBeGreaterThanOrEqual(20);

    for (const width of [1280, 360]) {
      await page.setViewportSize({ width, height: 800 });
      const spacing = await page.evaluate(() => {
        const featured = document.querySelector(
          'section[aria-label="Destaque"] article',
        );
        const item = document.querySelector('ul[aria-label="Posts"] > li');
        const card = item?.querySelector("article");
        const featuredTitle = featured?.querySelector("h2");
        const listTitle = card?.querySelector("h2");
        const cover = featured?.querySelector("img");
        if (
          !featured ||
          !item ||
          !card ||
          !featuredTitle ||
          !listTitle ||
          !cover
        )
          return null;
        const itemStyle = getComputedStyle(item);
        const featuredStyle = getComputedStyle(featured);
        const featuredTitleBox = featuredTitle.getBoundingClientRect();
        const listTitleBox = listTitle.getBoundingClientRect();
        const cardBox = card.getBoundingClientRect();
        const coverBox = cover.getBoundingClientRect();
        return {
          gap:
            card.getBoundingClientRect().top -
            featured.getBoundingClientRect().bottom,
          above: Number.parseFloat(featuredStyle.paddingBottom),
          below: Number.parseFloat(itemStyle.paddingTop),
          between: Number.parseFloat(itemStyle.paddingBottom),
          paddingTop: Number.parseFloat(featuredStyle.paddingTop),
          paddingBottom: Number.parseFloat(featuredStyle.paddingBottom),
          paddingLeft: Number.parseFloat(featuredStyle.paddingLeft),
          paddingRight: Number.parseFloat(featuredStyle.paddingRight),
          left: featuredTitleBox.left - cardBox.left,
          titleLeft: featuredTitleBox.left - listTitleBox.left,
          right: coverBox.right - cardBox.right,
        };
      });
      expect(spacing, `${width}`).not.toBeNull();
      if (!spacing) continue;
      expect(
        Math.abs(spacing.gap - spacing.below),
        `${width}`,
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(spacing.above - spacing.between),
        `${width}`,
      ).toBeLessThanOrEqual(1);
      if (width === 1280) {
        expect(spacing.paddingTop, `${width}`).toBe(32);
        expect(spacing.paddingBottom, `${width}`).toBe(32);
        expect(spacing.paddingLeft, `${width}`).toBe(0);
        expect(spacing.paddingRight, `${width}`).toBe(0);
        expect(Math.abs(spacing.left), `${width}`).toBeLessThanOrEqual(1);
        expect(Math.abs(spacing.right), `${width}`).toBeLessThanOrEqual(1);
      } else {
        expect(spacing.paddingLeft, `${width}`).toBe(0);
        expect(spacing.paddingRight, `${width}`).toBe(0);
        expect(Math.abs(spacing.titleLeft), `${width}`).toBeLessThanOrEqual(1);
      }
    }

    for (const article of await listArticles(page)) {
      const widths = await article.evaluate((root) => {
        const style = getComputedStyle(root);
        return [
          style.borderTopWidth,
          style.borderRightWidth,
          style.borderBottomWidth,
          style.borderLeftWidth,
        ].map((value) => Number.parseFloat(value));
      });
      expect(widths.every((width) => width === 0)).toBe(true);
    }
  });

  test("C16 capa centralizada sem abrir vão", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, "/");
    const featured = await featuredArticle(page);
    expect(featured).not.toBeNull();
    if (!featured) return;

    const measure = () =>
      featured.evaluate((root) => {
        const label = [...root.querySelectorAll("p")].find((paragraph) =>
          (paragraph.textContent ?? "").includes("Destaque"),
        );
        const folio = root.querySelector("time")?.parentElement;
        const heading = root.querySelector("h2");
        const footer = root.querySelector("p.footer");
        const cover = root.querySelector("img")?.parentElement;
        if (!label || !folio || !heading || !footer || !cover) return null;
        const labelBox = label.getBoundingClientRect();
        const footerBox = footer.getBoundingClientRect();
        const coverBox = cover.getBoundingClientRect();
        const folioBox = folio.getBoundingClientRect();
        const headingBox = heading.getBoundingClientRect();
        return {
          delta: Math.abs(
            (coverBox.top + coverBox.bottom) / 2 -
              (labelBox.top + footerBox.bottom) / 2,
          ),
          gap: headingBox.top - folioBox.bottom,
          coverHeight: coverBox.height,
          textHeight: footerBox.bottom - labelBox.top,
        };
      });

    const before = await measure();
    expect(before, "medição inicial").not.toBeNull();
    if (!before) return;
    expect(before.delta).toBeLessThanOrEqual(2);

    await featured.evaluate((root) => {
      const link = root.querySelector("h2 a");
      if (link) link.textContent = "Curto";
      root.querySelector("h2")?.nextElementSibling?.remove();
    });

    const after = await measure();
    expect(after, "medição com texto curto").not.toBeNull();
    if (!after) return;
    expect(after.coverHeight).toBeGreaterThan(after.textHeight);
    expect(after.delta).toBeLessThanOrEqual(2);
    expect(Math.abs(after.gap - before.gap)).toBeLessThanOrEqual(1);
  });

  test("C17 resumo em 17px com entrelinha de cerca de 28px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, "/");
    const featured = await featuredArticle(page);
    const articles = [
      ...(featured ? [featured] : []),
      ...(await listArticles(page)),
    ];
    expect(articles.length).toBeGreaterThan(1);
    for (const article of articles) {
      const summary = article.locator("h2 + p");
      await expect(summary).toHaveCount(1);
      const measured = await summary.evaluate((element) => {
        const style = getComputedStyle(element);
        return { fontSize: style.fontSize, lineHeight: style.lineHeight };
      });
      expect(fontSizePx(measured.fontSize)).toBe(17);
      const lineHeight = fontSizePx(measured.lineHeight);
      expect(lineHeight).toBeGreaterThanOrEqual(27.5);
      expect(lineHeight).toBeLessThanOrEqual(28.5);
    }
  });

  test("C18 título da lista em 26px abaixo de sm", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, "/");
    const narrow = await listArticles(page);
    expect(narrow.length).toBeGreaterThan(0);
    for (const article of narrow) {
      const size = fontSizePx(
        await article
          .locator("h2")
          .evaluate((element) => getComputedStyle(element).fontSize),
      );
      expect(size).toBe(26);
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    for (const article of await listArticles(page)) {
      const size = fontSizePx(
        await article
          .locator("h2")
          .evaluate((element) => getComputedStyle(element).fontSize),
      );
      expect(size).toBeGreaterThanOrEqual(22);
    }
  });

  test("C19 clique no resumo abre o post desse card", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, "/");
    const article = (await listArticles(page))[0];
    expect(article).toBeTruthy();
    if (!article) return;

    const link = article.locator("h2").getByRole("link");
    const href = (await link.getAttribute("href")) ?? "";
    expect(href).toMatch(/^\/blog\/[a-z0-9-]+\/$/);
    const linkBox = await link.boundingBox();
    const articleBox = await article.boundingBox();
    expect(linkBox).not.toBeNull();
    expect(articleBox).not.toBeNull();
    if (!linkBox || !articleBox) return;
    expect(linkBox.height).toBeLessThan(articleBox.height / 2);

    const level = article.getByText(LEVEL);
    const reading = article.locator("p.footer span.text-pencil", {
      hasText: /\d+\s+min/,
    });
    for (const piece of [level, reading]) {
      await piece.scrollIntoViewIfNeeded();
      const hit = await piece.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const target = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        const titleLink = element.closest("article")?.querySelector("h2 a");
        return {
          link: target === titleLink,
          tag: target?.tagName ?? "",
        };
      });
      expect(hit.link, hit.tag).toBe(true);
      const box = await piece.boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;
      await Promise.all([
        page.waitForURL((url) => url.pathname === href),
        page.mouse.click(box.x + box.width / 2, box.y + box.height / 2),
      ]);
      await page.setViewportSize({ width: 360, height: 800 });
      await open(page, "/");
    }

    const returned = page
      .locator('ul[aria-label="Posts"] > li article')
      .filter({ has: page.locator(`a[href="${href}"]`) });
    await expect(returned).toHaveCount(1);
    const returnedSummary = returned.locator("h2 + p");
    await returnedSummary.scrollIntoViewIfNeeded();
    await returned.locator("h2").getByRole("link").focus();
    await expect(returned.locator("h2").getByRole("link")).toBeFocused();
    const summaryBox = await returnedSummary.boundingBox();
    expect(summaryBox).not.toBeNull();
    if (!summaryBox) return;

    await Promise.all([
      page.waitForURL((url) => url.pathname === href),
      page.mouse.click(
        summaryBox.x + summaryBox.width / 2,
        summaryBox.y + summaryBox.height / 2,
      ),
    ]);

    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, "/");
    const featured = await featuredArticle(page);
    expect(featured).not.toBeNull();
    if (!featured) return;
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await featured.locator("img").scrollIntoViewIfNeeded();
      const hit = await featured.evaluate((root) => {
        const image = root.querySelector("img");
        const titleLink = root.querySelector("h2 a");
        if (!image || !titleLink) return null;
        const box = image.getBoundingClientRect();
        const target = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        );
        const titleBox = titleLink.getBoundingClientRect();
        const titleTarget = document.elementFromPoint(
          titleBox.left + titleBox.width / 2,
          titleBox.top + titleBox.height / 2,
        );
        return {
          cover: target === titleLink || titleLink.contains(target),
          title: titleTarget === titleLink || titleLink.contains(titleTarget),
          coverTag: target?.tagName ?? "",
        };
      });
      expect(hit, `${width}`).not.toBeNull();
      expect(hit?.cover, `${width} ${hit?.coverTag}`).toBe(true);
      expect(hit?.title, `${width}`).toBe(true);
    }
  });

  test("C20 vão vertical quando o rodapé quebra", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, "/");
    const footer = page.locator("article p.footer").first();
    await expect(footer).toBeVisible();
    const measured = await footer.evaluate((node) => {
      const block = node as HTMLElement;
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const value = walker.currentNode.textContent ?? "";
        if (/Iniciante|Intermediário|Avançado/.test(value)) {
          walker.currentNode.textContent = value.replace(
            /Iniciante|Intermediário|Avançado/,
            "Intermediário",
          );
        }
      }
      const wraps = () => {
        const tops = [...block.children].map(
          (child) => child.getBoundingClientRect().top,
        );
        return Math.max(...tops) - Math.min(...tops) > 8;
      };
      if (!wraps()) {
        let width = Math.floor(block.getBoundingClientRect().width);
        while (width > 120 && !wraps()) {
          width -= 16;
          block.style.width = `${width}px`;
        }
      }
      const boxes = [...block.children]
        .map((child) => {
          const rect = child.getBoundingClientRect();
          return { top: rect.top, bottom: rect.bottom };
        })
        .sort((left, right) => left.top - right.top);
      const lines: { top: number; bottom: number }[] = [];
      for (const box of boxes) {
        const line = lines.find((item) => box.top < item.bottom - 2);
        if (line) {
          line.top = Math.min(line.top, box.top);
          line.bottom = Math.max(line.bottom, box.bottom);
        } else {
          lines.push({ top: box.top, bottom: box.bottom });
        }
      }
      const gaps: number[] = [];
      for (let index = 1; index < lines.length; index += 1) {
        const previous = lines[index - 1];
        const current = lines[index];
        if (!previous || !current) continue;
        gaps.push(current.top - previous.bottom);
      }
      return {
        lines: lines.length,
        gaps,
        rowGap: getComputedStyle(block).rowGap,
      };
    });
    expect(measured.lines, JSON.stringify(measured)).toBeGreaterThan(1);
    expect(Number.parseFloat(measured.rowGap)).toBeCloseTo(6, 0);
    expect(measured.gaps.length).toBeGreaterThan(0);
    for (const gap of measured.gaps) {
      expect(gap).toBeGreaterThanOrEqual(5);
      expect(gap).toBeLessThanOrEqual(8);
    }
  });

  test("C21 capa do destaque entre o fólio e o título no mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, "/");
    const featured = await featuredArticle(page);
    expect(featured).not.toBeNull();
    if (!featured) return;

    const order = await featured.evaluate((root) => {
      const label = [...root.querySelectorAll("p")].find((paragraph) =>
        (paragraph.textContent ?? "").includes("Destaque"),
      );
      const folio = root.querySelector("time")?.parentElement;
      const image = root.querySelector("img");
      const heading = root.querySelector("h2");
      const summary = heading?.nextElementSibling;
      const footer = root.querySelector("p.footer");
      if (!label || !folio || !image || !heading || !summary || !footer) {
        return null;
      }
      const top = (element: Element) => element.getBoundingClientRect().top;
      return {
        label: top(label),
        folio: top(folio),
        image: top(image),
        heading: top(heading),
        summary: top(summary),
        footer: top(footer),
      };
    });
    expect(order).not.toBeNull();
    if (!order) return;
    expect(order.label).toBeLessThan(order.folio);
    expect(order.folio).toBeLessThan(order.image);
    expect(order.image).toBeLessThan(order.heading);
    expect(order.heading).toBeLessThan(order.summary);
    expect(order.summary).toBeLessThan(order.footer);

    await page.setViewportSize({ width: 1280, height: 800 });
    const beside = await featured.evaluate((root) => {
      const image = root.querySelector("img");
      const heading = root.querySelector("h2");
      if (!image || !heading) return null;
      const imageBox = image.getBoundingClientRect();
      const headingBox = heading.getBoundingClientRect();
      return { imageLeft: imageBox.left, headingRight: headingBox.right };
    });
    expect(beside).not.toBeNull();
    if (!beside) return;
    expect(beside.imageLeft).toBeGreaterThanOrEqual(beside.headingRight - 1);
  });
});
