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
  await expect(time.locator("xpath=..")).toHaveText(dateFromDatetime(datetime));

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

function inRecentBand(root: Element) {
  const label = root.closest("section")?.querySelector("h2");
  return (
    (label?.textContent ?? "").replace(/\s+/g, " ").trim() === "/ RECENTES"
  );
}

function inPrototypeBand(root: Element) {
  const label = root.closest("section")?.querySelector("h2");
  return (
    (label?.textContent ?? "").replace(/\s+/g, " ").trim() === "/ PROTÓTIPOS"
  );
}

test.describe("card e cabeçalho [RF-01, RF-04]", () => {
  test("C1 data e tipo nos cards, sem fólio e sem nível", async ({ page }) => {
    for (const path of await listingPaths(page)) {
      await test.step(path, async () => {
        await open(page, path);
        for (const article of await cardsOn(page)) {
          if (await article.evaluate(inPrototypeBand)) {
            await expect(article.locator("time")).toHaveCount(0);
            await expect(article.locator("p.footer")).toHaveCount(0);
            continue;
          }
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
        await page.setViewportSize({ width: 1280, height: 800 });
        await expect(header.locator("svg:visible")).toHaveCount(0);

        await page.setViewportSize({ width: 360, height: 800 });
        const tipo = header
          .locator("[data-post-rail] > div")
          .nth(1)
          .locator("> div")
          .filter({ has: page.getByText("Tipo", { exact: true }) });
        const svg = tipo.locator("svg");
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
          if (await article.evaluate(inPrototypeBand)) {
            await expect(article.locator(".sr-only")).toHaveCount(0);
            await expect(article.locator("time")).toHaveCount(0);
            continue;
          }
          const hidden = article.locator(".sr-only");
          await expect(hidden).toHaveCount(2);
          const cardText = await article.evaluate((root) => {
            const note = root.querySelector(".sr-only");
            const visible = note?.previousElementSibling;
            return `${visible?.textContent ?? ""}${note?.textContent ?? ""}`
              .replace(/\s+/g, " ")
              .trim();
          });
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
          expect(cardText).toBe(postText);
          seen.set(href, cardText);
          await open(page, path);
        }
      });
    }
    expect(seen.size).toBeGreaterThan(0);
  });

  test("C9 nenhum card com capa", async ({ page }) => {
    const paths = ["/", ...(await tagHrefsFromPosts(page))];
    for (const path of paths) {
      await test.step(path, async () => {
        await open(page, path);
        await expect(page.locator("article img")).toHaveCount(0);
      });
    }
  });

  test("C11 faixa da data e a ordem a 360", async ({ page }) => {
    const paths = await listingSurfaces(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    for (const path of paths) {
      await test.step(`${path} 1280`, async () => {
        await open(page, path);
        for (const article of await listArticles(page)) {
          if (await article.evaluate(inPrototypeBand)) continue;
          const recent = await article.evaluate(inRecentBand);
          const placed = await article.evaluate((root) => {
            const date = root.querySelector("time")?.parentElement;
            const heading = root.querySelector(":is(h2, h3)");
            if (!date || !heading) return null;
            const dateBox = date.getBoundingClientRect();
            const headingBox = heading.getBoundingClientRect();
            const track = Number.parseFloat(
              getComputedStyle(root)
                .gridTemplateColumns.trim()
                .split(/\s+/)[0] ?? "",
            );
            const fontSize = Number.parseFloat(
              getComputedStyle(document.documentElement).fontSize,
            );
            const footer = root.querySelector("p.footer");
            const footerBox = footer?.getBoundingClientRect();
            return {
              dateRight: dateBox.right,
              headingLeft: headingBox.left,
              headingRight: headingBox.right,
              track,
              expectedTrack: 6.5 * fontSize,
              dateCenter: (dateBox.top + dateBox.bottom) / 2,
              textCenter: heading.parentElement
                ? (heading.parentElement.getBoundingClientRect().top +
                    heading.parentElement.getBoundingClientRect().bottom) /
                  2
                : Number.NaN,
              footerLeft: footerBox?.left ?? Number.NaN,
              footerCenter: footerBox
                ? (footerBox.top + footerBox.bottom) / 2
                : Number.NaN,
            };
          });
          expect(placed).not.toBeNull();
          if (!placed) continue;
          expect(placed.dateRight).toBeLessThanOrEqual(placed.headingLeft);
          expect(
            Math.abs(placed.track - placed.expectedTrack),
          ).toBeLessThanOrEqual(1);
          if (recent) {
            expect(placed.footerLeft).toBeGreaterThanOrEqual(
              placed.headingRight,
            );
            expect(
              Math.abs(placed.dateCenter - placed.footerCenter),
            ).toBeLessThanOrEqual(1);
            continue;
          }
          expect(
            Math.abs(placed.dateCenter - placed.textCenter),
            "data centrada no texto",
          ).toBeLessThanOrEqual(1);
        }
      });
    }

    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of paths) {
      await test.step(`${path} 360`, async () => {
        await open(page, path);
        for (const article of await listArticles(page)) {
          if (await article.evaluate(inPrototypeBand)) continue;
          const recent = await article.evaluate(inRecentBand);
          const above = await article.evaluate((root) => {
            const date = root.querySelector("time")?.parentElement;
            const heading = root.querySelector(":is(h2, h3)");
            if (!date || !heading) return null;
            const dateBox = date.getBoundingClientRect();
            const headingBox = heading.getBoundingClientRect();
            const footer = root
              .querySelector("p.footer")
              ?.getBoundingClientRect();
            return {
              dateTop: dateBox.top,
              dateBottom: dateBox.bottom,
              headingTop: headingBox.top,
              footerTop: footer?.top ?? Number.NaN,
              footerBottom: footer?.bottom ?? Number.NaN,
            };
          });
          expect(above).not.toBeNull();
          if (!above) continue;
          if (recent) {
            expect(above.headingTop).toBeLessThan(above.dateTop);
            expect(above.dateTop).toBeLessThan(above.footerBottom);
            expect(above.footerTop).toBeLessThan(above.dateBottom);
            continue;
          }
          expect(above.dateTop).toBeLessThan(above.headingTop);
          expect(above.dateBottom).toBeLessThanOrEqual(above.headingTop + 1);
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
        /^(Artigo|Protótipo)$/.test((span.textContent ?? "").trim()),
      );
      if (kind) kind.textContent = "Protótipo";
      const minutes = [...clone.querySelectorAll("span")].find((span) =>
        /^\d+\s+min$/.test(
          (span.textContent ?? "").replace(/\s+/g, " ").trim(),
        ),
      );
      if (minutes) minutes.textContent = "20 min";
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

  test("C14 relógio parado e título sem sublinhado", async ({ page }) => {
    for (const path of await listingSurfaces(page)) {
      await test.step(path, async () => {
        await open(page, path);
        for (const article of await listArticles(page)) {
          const titlesOnly = await article.evaluate(inPrototypeBand);
          if (!titlesOnly) {
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
          }

          const link = article.locator(titleHeading).getByRole("link");
          const rest = await link.evaluate((element) => {
            const style = getComputedStyle(element);
            return {
              color: style.color,
              decoration: style.textDecorationLine,
            };
          });
          expect(rest.decoration).toBe("none");
          await link.hover();
          await expect(link).toHaveCSS("color", rest.color);
          await expect(link).toHaveCSS("text-decoration-line", "none");
          await page.mouse.move(0, 0);
        }
      });
    }
  });

  test("C18 título em 22px abaixo de sm e 26px de sm em diante", async ({
    page,
  }) => {
    await open(page, "/blog/");
    const cases = [
      { width: 360, size: 22, line: 26.4 },
      { width: 1280, size: 26, line: 31.2 },
    ];
    for (const item of cases) {
      await page.setViewportSize({ width: item.width, height: 800 });
      const articles = await listArticles(page);
      expect(articles.length, String(item.width)).toBeGreaterThan(0);
      for (const article of articles) {
        const measured = await article
          .locator(titleHeading)
          .evaluate((element) => {
            const style = getComputedStyle(element);
            return { fontSize: style.fontSize, lineHeight: style.lineHeight };
          });
        expect(fontSizePx(measured.fontSize), String(item.width)).toBe(
          item.size,
        );
        const lineHeight = fontSizePx(measured.lineHeight);
        expect(
          Math.abs(lineHeight - item.line),
          String(item.width),
        ).toBeLessThanOrEqual(0.5);
      }
    }
  });

  test("linha de baixo com relógio, voto e vão de 3ch", async ({ page }) => {
    await open(page, "/blog/");
    const articles = await listArticles(page);
    expect(articles.length).toBeGreaterThan(0);
    for (const article of articles) {
      const footer = article.locator("p.footer");
      await expect(footer).toHaveCount(1);
      await expect(footer).toContainText("|");
      const clock = footer.locator("svg").first();
      await expect(clock).toHaveAttribute("aria-hidden", "true");
      await expect(clock).toHaveCSS("width", "12px");
      await expect(clock).toHaveCSS("height", "12px");
      await expect(footer).toContainText(/\d+\s+min/);
      const vote = footer.locator("svg").nth(1);
      await expect(vote).toHaveAttribute("aria-hidden", "true");
      await expect(vote).toHaveCSS("width", "10px");
      await expect(vote).toHaveCSS("height", "8px");
      const value = footer.locator("[data-vote-value]");
      await expect(value).toHaveText("–");
      const count = value.locator("xpath=..");
      await expect(count).toHaveAccessibleName(/ votos$/);
      const gap = await count.evaluate((element) => {
        const probe = document.createElement("span");
        const style = getComputedStyle(element);
        probe.style.font = style.font;
        probe.textContent = "000";
        probe.style.position = "absolute";
        probe.style.visibility = "hidden";
        document.body.append(probe);
        const expected = probe.getBoundingClientRect().width;
        probe.remove();
        return Math.abs(element.getBoundingClientRect().width - expected);
      });
      expect(gap).toBeLessThanOrEqual(1);
    }
  });

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

  test("C20 vão vertical quando o rodapé quebra", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, "/");
    const footer = page.locator("article p.footer").first();
    await expect(footer).toBeVisible();
    const measured = await footer.evaluate((node) => {
      const block = node as HTMLElement;
      const kind = [...block.querySelectorAll("span")].find((span) =>
        /^(Artigo|Protótipo)$/.test((span.textContent ?? "").trim()),
      );
      if (kind) kind.textContent = "Protótipo";
      const wraps = () => {
        const tops = [...block.children].map(
          (child) => child.getBoundingClientRect().top,
        );
        return Math.max(...tops) - Math.min(...tops) > 8;
      };
      if (!wraps()) {
        let width = Math.floor(block.getBoundingClientRect().width);
        while (width > 8 && !wraps()) {
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
});
