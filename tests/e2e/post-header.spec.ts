import { expect, test, type Locator, type Page } from "@playwright/test";

import { fixtureMd, fixtureSemTitulos } from "./fixtures";
import { publishedPosts } from "./published-posts";

const LABELS = ["Tipo", "Data", "Leitura", "Autor", "Tags"] as const;

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

async function readThinLine(page: Page) {
  return page.evaluate(() => {
    const line = document.querySelector("article header > p");
    if (!(line instanceof HTMLElement)) return null;
    return {
      end: line.getBoundingClientRect().bottom + window.scrollY,
      room: document.documentElement.scrollHeight - window.innerHeight,
    };
  });
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
        const label = cell.locator("> div").first();
        const bar = cell.locator("> span");
        const table = rail.locator("> div").nth(1);
        expect(text(await label.textContent())).toBe("METADADOS");
        await expect(cell.locator("svg")).toHaveCount(0);
        await expect(label).toHaveCSS("font-size", "12px");
        await expect(label).toHaveCSS("text-transform", "uppercase");
        await expect(label).toHaveCSS("letter-spacing", "1.2px");
        const family = await label.evaluate(
          (element) => getComputedStyle(element).fontFamily,
        );
        expect(firstFamily(family)).toBe(mono);
        const labelColor = await label.evaluate(
          (element) => getComputedStyle(element).color,
        );
        expect(channels(labelColor)).toEqual(channels(ink));

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
        await expect(first).toHaveCSS("text-transform", "uppercase");
        const tipoText = text(
          await table
            .getByText(/^(Artigo|Protótipo)$/)
            .first()
            .textContent(),
        );
        expect(["Artigo", "Protótipo"]).toContain(tipoText);
        expect(text(await first.textContent())).toBe(`/ ${tipoText}`);
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
        const visible: number[] = [];
        for (let index = 0; index < rowCount; index += 1) {
          rowLabels.push(
            text(await rows.nth(index).locator("p").first().textContent()),
          );
          if (await rows.nth(index).isVisible()) visible.push(index);
        }
        expect(rowLabels).toContain("Tipo");
        const tipoRow = rowLabels.indexOf("Tipo");
        await expect(rows.nth(tipoRow)).toHaveClass(/sr-only/);
        expect(visible.every((index) => rowLabels[index] !== "Tipo")).toBe(
          true,
        );
        expect(visible.length).toBeGreaterThan(0);
        for (const index of visible) {
          if (rowLabels[index] === "Tags") continue;
          const row = rows.nth(index);
          const tracks = await columnTracks(row);
          expect(Number.parseFloat(tracks[0] ?? "")).toBeCloseTo(112, 0);
          await expect(row).toHaveCSS("padding-top", "9px");
          await expect(row).toHaveCSS("padding-bottom", "9px");
        }
        for (let position = 0; position < visible.length; position += 1) {
          const index = visible[position] ?? 0;
          const row = rows.nth(index);
          if (position === visible.length - 1) {
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
        expect(found).toEqual([...LABELS]);

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
        const deck = header.locator("> p");
        const table = rail.locator("> div").nth(1);
        const articleBox = await box(page.getByRole("article"));
        const h1Box = await box(header.locator("h1"));
        expect(h1Box.y - articleBox.y).toBeCloseTo(56, 0);
        await expect(cell).toBeHidden();
        await expect(
          page.locator("article > .prose > [data-prose-mark]"),
        ).toBeHidden();

        const deckTop = (await box(deck)).y;
        const tableTop = (await box(table)).y;
        expect(h1Box.y).toBeLessThan(deckTop);
        expect(deckTop).toBeLessThan(tableTop);

        const rows = table.locator("> div");
        expect(text(await rows.nth(0).locator("p").first().textContent())).toBe(
          "Tipo",
        );
        const icon = rows.nth(0).locator("svg");
        await expect(icon).toHaveCount(1);
        await expect(icon).toHaveCSS("width", "12px");
        await expect(icon).toHaveCSS("height", "12px");
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
      });
    }

    const response = await page.goto(fixtureMd.href);
    expect(response?.status()).toBe(200);
    const rail = page.locator("[data-post-rail]");
    await expect(rail).toHaveCount(1);
    await expect(rail).not.toHaveAttribute("data-title-out");

    const before = await railMetrics(rail);
    expect(before).not.toBeNull();
    if (!before) return;

    const line = await readThinLine(page);
    expect(line, fixtureMd.href).not.toBeNull();
    if (!line) return;
    expect(line.room, fixtureMd.href).toBeGreaterThan(line.end);

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
    const label = rail.locator("> div").first().locator("> div").first();
    await expect(title).toHaveCSS("opacity", "1");
    await expect(label).toHaveCSS("opacity", "1");

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
        await expect(rail).not.toHaveAttribute("data-title-out");
        const title = rail.locator("p[aria-hidden='true']");
        await expect(title).toHaveCSS("transition-duration", "0s");
      });
    }

    const response = await page.goto(fixtureMd.href);
    expect(response?.status()).toBe(200);
    const rail = page.locator("[data-post-rail]");
    await expect(rail).toHaveCount(1);
    const title = rail.locator("p[aria-hidden='true']");
    const label = rail.locator("> div").first().locator("> div").first();
    await expect(title).toHaveCSS("transition-duration", "0s");

    const line = await readThinLine(page);
    expect(line, fixtureMd.href).not.toBeNull();
    if (!line) return;
    expect(line.room, fixtureMd.href).toBeGreaterThan(line.end);

    await page
      .locator("article > .prose p")
      .last()
      .evaluate((element) => {
        element.scrollIntoView();
      });
    await expect(rail).toHaveAttribute("data-title-out", "");
    await expect(title).toHaveCSS("opacity", "1");
    await expect(label).toHaveCSS("opacity", "1");
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
        await expect(rail).not.toHaveAttribute("data-title-out");
      });
    }

    const response = await page.goto(fixtureMd.href);
    expect(response?.status()).toBe(200);
    const rail = page.locator("[data-post-rail]");
    await expect(rail).toHaveCount(1);

    const line = await readThinLine(page);
    expect(line, fixtureMd.href).not.toBeNull();
    if (!line) return;
    expect(line.room, fixtureMd.href).toBeGreaterThan(line.end);

    await page.locator("article > .prose").evaluate((element) => {
      element.scrollIntoView({ block: "end" });
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
        const value = (element.textContent ?? "").replace(/\s+/g, " ").trim();
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
          element.textContent = `${before} ${word}`.replace(/\s+/g, " ").trim();
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

  test("linha fina que não sai deixa a lateral sem data-title-out", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto(fixtureSemTitulos.href);
    expect(response?.status()).toBe(200);
    const rail = page.locator("[data-post-rail]");
    await expect(rail).toHaveCount(1);

    const line = await readThinLine(page);
    expect(line, fixtureSemTitulos.href).not.toBeNull();
    if (!line) return;
    expect(line.room, fixtureSemTitulos.href).toBeLessThanOrEqual(line.end);

    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const line = document.querySelector("article header > p");
          if (!(line instanceof HTMLElement)) {
            resolve();
            return;
          }
          const observer = new IntersectionObserver(() => {
            observer.disconnect();
            resolve();
          });
          observer.observe(line);
        }),
    );
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        }),
    );
    await expect(rail).not.toHaveAttribute("data-title-out");
  });
});

test.describe("cabeçalho do post sem JavaScript [RF-04]", () => {
  test.use({ javaScriptEnabled: false });

  test("H5 sem JavaScript fica / METADADOS", async ({ page }) => {
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
        const label = rail.locator("> div").first().locator("> div").first();
        expect(text(await label.textContent())).toBe("METADADOS");
        await expect(label).toHaveCSS("opacity", "1");
      });
    }
  });
});
