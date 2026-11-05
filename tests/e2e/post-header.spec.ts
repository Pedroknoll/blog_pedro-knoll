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
    const cell = element.querySelector(":scope > div");
    const meta = element.lastElementChild;
    if (!(cell instanceof HTMLElement) || !(meta instanceof HTMLElement)) {
      return null;
    }
    const railBox = element.getBoundingClientRect();
    const cellBox = cell.getBoundingClientRect();
    const metaBox = meta.getBoundingClientRect();
    return {
      cellHeight: cellBox.height,
      metaTop: metaBox.top - railBox.top,
      railHeight: railBox.height,
    };
  });
}

async function columnTracks(row: Locator): Promise<string[]> {
  return row.evaluate((element) =>
    getComputedStyle(element)
      .gridTemplateColumns.split(" ")
      .filter((part) => part.length > 0),
  );
}

test.describe("cabeçalho do post [RF-04]", () => {
  test("H1 lateral a 1280", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const posts = await publishedPosts(page);
    const mono = await variableFamily(page, "--font-plex-mono");

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);
        const article = page.getByRole("article");
        const header = article.locator("header");
        const rail = header.locator("[data-post-rail]");
        await expect(rail).toHaveCount(1);

        const railBox = await box(rail);
        expect(railBox.width).toBeCloseTo(240, 0);
        await expect(rail).toHaveCSS("position", "sticky");

        const prose = page.locator("article > .prose");
        const proseBox = await box(prose);
        expect(proseBox.x - (railBox.x + railBox.width)).toBeCloseTo(64, 0);

        await expect(rail).toHaveCSS("top", "120px");

        const articleBox = await box(article);
        const h1Box = await box(header.locator("h1"));
        expect(h1Box.y - articleBox.y).toBeCloseTo(56, 0);

        const deck = header.locator("> p");
        await expect(deck).toHaveCount(1);
        await expect(deck).toHaveCSS("font-size", "20px");
        const [ink, muted] = await page.evaluate(() => {
          const style = getComputedStyle(document.documentElement);
          return [
            style.getPropertyValue("--color-ink").trim(),
            style.getPropertyValue("--color-muted").trim(),
          ];
        });
        const deckColor = await deck.evaluate(
          (element) => getComputedStyle(element).color,
        );
        expect(channels(deckColor)).toEqual(channels(muted));

        const cell = rail.locator("> div").first();
        const folio = cell.locator("> div").first();
        const bar = cell.locator("> span");
        const table = rail.locator("> div").nth(1);
        await expect(folio).toHaveCSS("font-size", "12px");
        await expect(folio).toHaveCSS("text-transform", "uppercase");
        await expect(folio).toHaveCSS("letter-spacing", "1.2px");
        const family = await folio.evaluate(
          (element) => getComputedStyle(element).fontFamily,
        );
        expect(firstFamily(family)).toBe(mono);
        const folioColor = await folio.evaluate(
          (element) => getComputedStyle(element).color,
        );
        expect(channels(folioColor)).toEqual(channels(ink));

        const mark = page.locator("article > .prose > [data-prose-mark]");
        await expect(mark).toHaveCSS("letter-spacing", "1.2px");

        await expect(bar).toHaveCount(1);
        await expect(bar).toHaveAttribute("aria-hidden", "true");

        await expect(cell).toHaveCSS("border-bottom-width", "1px");
        await expect(cell).toHaveCSS("border-bottom-style", "solid");
        await expect(cell).toHaveCSS("padding-bottom", "8px");
        const cellBorder = await cell.evaluate(
          (element) => getComputedStyle(element).borderBottomColor,
        );
        expect(channels(cellBorder)).toEqual(channels(ink));

        const first = page.locator("article > .prose > :first-child");
        await expect(first).toHaveAttribute("data-prose-mark", "");
        await expect(first).toHaveAttribute("aria-hidden", "true");
        expect(await first.evaluate((element) => element.tagName)).not.toBe(
          "P",
        );
        await expect(first).toHaveCSS("border-bottom-width", "1px");
        await expect(first).toHaveCSS("border-bottom-style", "solid");
        await expect(first).toHaveCSS("padding-bottom", "8px");
        const markBorder = await first.evaluate(
          (element) => getComputedStyle(element).borderBottomColor,
        );
        expect(channels(markBorder)).toEqual(channels(ink));

        const markBox = await box(first);
        const cellBox = await box(cell);
        expect(Math.abs(cellBox.y - markBox.y)).toBeLessThanOrEqual(1);
        expect(
          Math.abs(cellBox.y + cellBox.height - (markBox.y + markBox.height)),
        ).toBeLessThanOrEqual(1);

        const tableBox = await box(table);
        expect(
          Math.abs(tableBox.y - (cellBox.y + cellBox.height)),
        ).toBeLessThanOrEqual(1);
        await expect(table).toHaveCSS("border-top-width", "0px");

        const rows = table.locator("> div");
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);
        const rowLabels: string[] = [];
        for (let index = 0; index < rowCount; index += 1) {
          rowLabels.push(
            text(await rows.nth(index).locator("p").first().textContent()),
          );
        }
        for (let index = 0; index < rowCount; index += 1) {
          if (rowLabels[index] === "Tags") continue;
          const row = rows.nth(index);
          const tracks = await columnTracks(row);
          expect(Number.parseFloat(tracks[0] ?? "")).toBeCloseTo(112, 0);
          await expect(row).toHaveCSS("padding-top", "9px");
          await expect(row).toHaveCSS("padding-bottom", "9px");
        }
        for (let index = 0; index < rowCount; index += 1) {
          const row = rows.nth(index);
          if (index === rowCount - 1) {
            await expect(row).toHaveCSS("border-bottom-width", "0px");
          } else {
            await expect(row).toHaveCSS("border-bottom-width", "1px");
            await expect(row).toHaveCSS("border-bottom-style", "dotted");
          }
        }
        await expect(table).toHaveCSS("border-bottom-style", "solid");
        await expect(table).toHaveCSS("border-bottom-width", "1px");

        const tagsIndex = rowLabels.indexOf("Tags");
        expect(tagsIndex).toBeGreaterThanOrEqual(0);
        const tagsRow = rows.nth(tagsIndex);
        const labelBox = await box(tagsRow.locator("p").first());
        const listBox = await box(tagsRow.locator("ul"));
        expect(labelBox.y + labelBox.height).toBeLessThanOrEqual(listBox.y + 1);
        expect(await columnTracks(tagsRow)).toHaveLength(1);

        const found = await table
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

        const title = rail.locator("p[aria-hidden='true']");
        await expect(title).toHaveCount(1);
        await expect(title).toHaveAttribute("aria-hidden", "true");
        expect(text(await title.textContent())).toBe(post.title);
        await expect(title).toHaveCSS("position", "absolute");
        await expect(
          page.getByRole("heading", { name: post.title, exact: true }),
        ).toHaveCount(1);
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
        const folio = cell.locator("> div").first();
        const deck = header.locator("> p");
        const table = rail.locator("> div").nth(1);
        const articleBox = await box(page.getByRole("article"));
        const cellBox = await box(cell);
        expect(cellBox.y - articleBox.y).toBeCloseTo(56, 0);

        const folioBox = await box(folio);
        const titleTop = (await box(header.locator("h1"))).y;
        const deckTop = (await box(deck)).y;
        const tableTop = (await box(table)).y;
        expect(folioBox.y).toBeLessThan(titleTop);
        expect(titleTop).toBeLessThan(deckTop);
        expect(deckTop).toBeLessThan(tableTop);

        await expect(
          page.locator("article > .prose > [data-prose-mark]"),
        ).toHaveCSS("display", "none");
        await expect(cell.locator("> span")).toBeVisible();
        await expect(cell).toHaveCSS("border-bottom-width", "0px");

        const rows = table.locator("> div");
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(1);
        let previousBottom = Number.NEGATIVE_INFINITY;
        for (let index = 0; index < rowCount; index += 1) {
          const row = rows.nth(index);
          const rowBox = await box(row);
          if (index > 0) {
            expect(rowBox.y).toBeGreaterThanOrEqual(previousBottom - 1);
          }
          previousBottom = rowBox.y + rowBox.height;
          const label = text(await row.locator("p").first().textContent());
          if (label === "Tags") continue;
          const tracks = await columnTracks(row);
          expect(Number.parseFloat(tracks[0] ?? "")).toBeCloseTo(112, 0);
        }

        await expect(table).toHaveCSS("border-top-width", "1px");
        await expect(table).toHaveCSS("border-top-style", "solid");
        await expect(table).toHaveCSS("margin-top", "32px");

        const paragraph = page.locator("article > .prose > p").first();
        const paragraphBox = await box(paragraph);
        const tableBox = await box(table);
        expect(paragraphBox.y - (tableBox.y + tableBox.height)).toBeCloseTo(
          40,
          0,
        );

        await expect(deck).toHaveCSS("font-size", "18px");
        await expect(rail.locator("p[aria-hidden='true']")).toHaveCSS(
          "display",
          "none",
        );
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

        await page.evaluate(() => {
          const heading = document.querySelector("article h1");
          if (!heading) return;
          const bottom = heading.getBoundingClientRect().bottom;
          window.scrollTo(0, bottom + window.scrollY + 1);
        });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              const heading = document.querySelector("article h1");
              if (!heading) {
                resolve();
                return;
              }
              const observer = new IntersectionObserver(([entry]) => {
                if (entry && !entry.isIntersecting) {
                  observer.disconnect();
                  resolve();
                }
              });
              observer.observe(heading);
            }),
        );
        const thin = await box(page.locator("article header > p"));
        expect(thin.y + thin.height).toBeGreaterThan(0);
        await expect(rail).not.toHaveAttribute("data-title-out");
        await page.evaluate(() => {
          const line = document.querySelector("article header > p");
          if (!line) return;
          const bottom = line.getBoundingClientRect().bottom;
          window.scrollTo(0, bottom + window.scrollY + 1);
        });
        await expect(rail).toHaveAttribute("data-title-out", "");

        await page
          .locator("article > .prose p")
          .last()
          .evaluate((element) => {
            element.scrollIntoView();
          });
        await expect(rail).toHaveAttribute("data-title-out", "");

        const title = rail.locator("p[aria-hidden='true']");
        const folio = rail.locator("> div").first().locator("> div").first();
        await expect(title).toHaveCSS("opacity", "1");
        await expect(folio).toHaveCSS("opacity", "1");

        const titleBox = await box(title);
        const railBox = await box(rail);
        expect(titleBox.y + titleBox.height).toBeLessThan(railBox.y);

        const after = await railMetrics(rail);
        expect(after).not.toBeNull();
        if (!after) return;
        expect(after.cellHeight).toBeCloseTo(before.cellHeight, 0);
        expect(after.metaTop).toBeCloseTo(before.metaTop, 0);
        expect(after.railHeight).toBeCloseTo(before.railHeight, 0);

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
        const title = rail.locator("p[aria-hidden='true']");
        const folio = rail.locator("> div").first().locator("> div").first();
        await expect(title).toHaveCSS("transition-duration", "0s");

        await page
          .locator("article > .prose p")
          .last()
          .evaluate((element) => {
            element.scrollIntoView();
          });
        await expect(rail).toHaveAttribute("data-title-out", "");
        await expect(title).toHaveCSS("opacity", "1");
        await expect(folio).toHaveCSS("opacity", "1");
      });
    }
  });

  test("H6 título de três linhas acima da lateral", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const posts = await publishedPosts(page);

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);
        const rail = page.locator("[data-post-rail]");
        await expect(rail).toHaveCount(1);
        await page.locator("article > .prose").evaluate((element) => {
          const target = element.lastElementChild ?? element;
          target.scrollIntoView({ block: "end" });
        });
        await expect(rail).toHaveAttribute("data-title-out", "");

        const title = rail.locator("p[aria-hidden='true']");
        const fitted = await title.evaluate((element) => {
          const words = [
            "para",
            "com",
            "que",
            "por",
            "uma",
            "em",
            "de",
            "ou",
            "na",
            "no",
            "um",
            "os",
            "as",
            "e",
            "a",
            "o",
          ];
          const measure = () => {
            const style = getComputedStyle(element);
            const height = element.getBoundingClientRect().height;
            const lineHeight = Number.parseFloat(style.lineHeight);
            const value = (element.textContent ?? "")
              .replace(/\s+/g, " ")
              .trim();
            return {
              height,
              lineHeight,
              ratio: height / lineHeight,
              text: value,
            };
          };
          let state = measure();
          for (
            let step = 0;
            step < 80 && Math.abs(state.ratio - 3) >= 0.05;
            step += 1
          ) {
            const before = element.textContent ?? "";
            let placed = false;
            for (const word of words) {
              element.textContent = `${before} ${word}`
                .replace(/\s+/g, " ")
                .trim();
              const next = measure();
              if (Math.abs(next.ratio - 3) < 0.05) return next;
              if (next.ratio > 3) {
                element.textContent = before;
                continue;
              }
              state = next;
              placed = true;
              break;
            }
            if (!placed) break;
          }
          return state;
        });
        expect(
          Math.abs(fitted.ratio - 3),
          `altura ${fitted.height} entrelinha ${fitted.lineHeight} texto ${fitted.text}`,
        ).toBeLessThan(0.05);

        const titleBox = await box(title);
        const railBox = await box(rail);
        expect(titleBox.y).toBeGreaterThanOrEqual(0);
        expect(titleBox.y + titleBox.height).toBeLessThan(railBox.y);
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
        await expect(rail.locator("p[aria-hidden='true']")).toHaveCSS(
          "opacity",
          "0",
        );
        await expect(
          rail.locator("> div").first().locator("> div").first(),
        ).toHaveCSS("opacity", "1");
      });
    }
  });
});
