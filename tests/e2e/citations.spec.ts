import { expect, test, type Locator, type Page } from "@playwright/test";

import { fixtureMd, fixtureMdx } from "./fixtures";
import { publishedPosts } from "./published-posts";

const gpt2Title = "openai-community/gpt2";

const gpt2Byline = "OpenAI, 2019. Hugging Face.";

const distillTitle = "Multimodal Neurons in Artificial Neural Networks";

const distillByline =
  "Gabriel Goh, Nick Cammarata, Chelsea Voss, Shan Carter, Michael Petrov, Ludwig Schubert, Alec Radford e Chris Olah, 2021. Distill.";

const astroTitle = "Unified API Reference";

const astroByline = "Astro, 2026. Documentação do Astro.";

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

function citationsSection(page: Page) {
  return page.locator("section:has(> h2#citacoes)");
}

function citationItems(page: Page) {
  return citationsSection(page).locator("ol > li");
}

function appendixRegion(page: Page) {
  return page.getByRole("region", { name: "Apêndice", exact: true });
}

async function box(locator: Locator) {
  const value = await locator.boundingBox();
  expect(value).not.toBeNull();
  if (!value) throw new Error("sem caixa");
  return value;
}

async function expectCopy(locator: Locator) {
  const count = await locator.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    await expect(item).toHaveCSS("font-size", "15px");
    await expect(item).toHaveCSS("line-height", "24px");
  }
}

async function citationLinks(prose: Locator) {
  const links = prose.locator("a");
  const found: { locator: Locator; n: number }[] = [];
  const count = await links.count();
  for (let index = 0; index < count; index += 1) {
    const locator = links.nth(index);
    const match = /^\[(\d+)\]$/.exec((await locator.textContent()) ?? "");
    if (!match?.[1]) continue;
    found.push({ locator, n: Number(match[1]) });
  }
  return found;
}

async function expectItems(
  page: Page,
  titles: readonly string[],
  bylines: readonly string[],
  keys: readonly string[],
) {
  const items = citationItems(page);
  await expect(items).toHaveCount(titles.length);
  for (let index = 0; index < titles.length; index += 1) {
    const item = items.nth(index);
    await expect(item).toHaveAttribute("id", `cit-${keys[index]}`);
    await expect(item.locator("[data-citation-n]")).toHaveText(
      `[${index + 1}]`,
    );
    await expect(item.locator("a")).toHaveText(titles[index] as string);
    await expect(item.locator("> p")).toHaveText(bylines[index] as string);
  }
}

test.describe("citações e apêndices [RF-04]", () => {
  test("invariantes de cada post publicado", async ({ page }) => {
    const posts = await publishedPosts(page);

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);

        const prose = page.locator("article .prose");
        await expect(prose).toHaveCount(1);
        const proseText = await prose.evaluate(
          (element) => element.textContent ?? "",
        );
        expect(proseText).not.toContain("[@");

        const items = citationItems(page);
        const itemIds: string[] = [];
        for (let index = 0; index < (await items.count()); index += 1) {
          const id = await items.nth(index).getAttribute("id");
          expect(id).toMatch(/^cit-[a-z0-9-]+$/);
          itemIds.push(id as string);
        }

        // Cada [n] do texto leva ao n-ésimo item; um item pode não ter
        // marcador (citação indireta).
        for (const citation of await citationLinks(prose)) {
          const id = itemIds[citation.n - 1];
          expect(id).toBeTruthy();
          await expect(citation.locator).toHaveAccessibleName(
            `Citação ${citation.n}`,
          );
          await expect(citation.locator).toHaveAttribute("href", `#${id}`);
        }

        // O start de cada grupo continua a numeração do anterior.
        const starts = await citationsSection(page)
          .locator("ol")
          .evaluateAll((lists) =>
            lists.map((list) => ({
              start: Number(list.getAttribute("start")),
              count: list.children.length,
            })),
          );
        let next = 1;
        for (const group of starts) {
          expect(group.start).toBe(next);
          next += group.count;
        }

        const appendixIds = await page
          .locator('h2[id^="apendice-"]')
          .evaluateAll((elements) => elements.map((element) => element.id));
        expect(appendixIds).toEqual(
          appendixIds.map(
            (_, index) => `apendice-${String.fromCharCode(97 + index)}`,
          ),
        );

        const region = appendixRegion(page);
        if (itemIds.length === 0 && appendixIds.length === 0) {
          await expect(page.locator("#citacoes")).toHaveCount(0);
          await expect(page.locator('[id^="cit-"]')).toHaveCount(0);
          await expect(region).toHaveCount(0);
        } else {
          await expect(region).toHaveCount(1);
          await expect(page.locator("article [id^='apendice-']")).toHaveCount(
            0,
          );
          await expect(page.locator("article #citacoes")).toHaveCount(0);
        }
      });
    }
  });

  test("conteúdo de teste na fixture-mdx", async ({ page }) => {
    const response = await page.goto(fixtureMdx.href);
    expect(response?.status()).toBe(200);

    await expect(
      citationsSection(page).getByRole("heading", { level: 3 }),
    ).toHaveText([...fixtureMdx.groups]);
    await expect(citationsSection(page).locator("ol")).toHaveCount(3);
    await expectItems(
      page,
      [gpt2Title, distillTitle, astroTitle],
      [gpt2Byline, distillByline, astroByline],
      fixtureMdx.keys,
    );

    // O gpt2 não tem marcador: os números do texto são 2 e 3.
    const citations = await citationLinks(page.locator("article .prose"));
    expect(citations.map((citation) => citation.n).sort()).toEqual([2, 3]);

    await expect(page.locator("h2#apendice-a")).toHaveAccessibleName(
      fixtureMdx.appendixHeading,
    );
    await expect(page.locator("h2#citacoes")).toHaveAccessibleName("Citações");

    const region = appendixRegion(page);
    await expect(region).toHaveCount(1);
    await expect(region.locator("#citacoes")).toHaveCount(1);
    await expect(region.locator("#apendice-a")).toHaveCount(1);
    await expect(page.locator("article .prose > hr")).toHaveCount(0);
  });

  test("disposição a 1280: abaixo do corpo, na coluna do texto", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto(fixtureMdx.href);
    expect(response?.status()).toBe(200);

    const proseBox = await box(page.locator("article > .prose"));
    const regionBox = await box(appendixRegion(page));
    expect(regionBox.y).toBeGreaterThanOrEqual(proseBox.y + proseBox.height);

    for (const id of ["apendice-a", "citacoes"]) {
      const heading = page.locator(`h2#${id}`);
      const label = heading.locator("[data-appendix-label]");
      await expect(label).toHaveCSS("font-size", "12px");
      await expect(label).toHaveCSS("text-transform", "uppercase");
      await expect(label).toHaveCSS("border-bottom-width", "1px");
      const mono = await variableFamily(page, "--font-plex-mono");
      const family = await label.evaluate(
        (element) => getComputedStyle(element).fontFamily,
      );
      expect(firstFamily(family)).toBe(mono);

      const labelBox = await box(label);
      expect(labelBox.x).toBeCloseTo(proseBox.x, 0);
      expect(labelBox.width).toBeLessThanOrEqual(proseBox.width + 1);
    }

    const items = citationItems(page);
    for (let index = 0; index < (await items.count()); index += 1) {
      const item = items.nth(index);
      await expect(item).toHaveCSS("border-bottom-style", "dashed");
      const numberBox = await box(item.locator("[data-citation-n]"));
      // O [n] começa na borda do texto do post, e o título vem depois dele.
      expect(numberBox.x).toBeCloseTo(proseBox.x, 0);
      const linkBox = await box(item.locator("a"));
      expect(linkBox.x).toBeGreaterThanOrEqual(numberBox.x + numberBox.width);
    }

    await expectCopy(page.locator("section:has(> h2#apendice-a) > div > p"));
    await expectCopy(citationItems(page).locator("> p"));

    // Fora da faixa antiga: sem fundo sheet de largura inteira.
    await expect(appendixRegion(page)).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
  });

  test("disposição a 360", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const response = await page.goto(fixtureMdx.href);
    expect(response?.status()).toBe(200);

    const label = page.locator("h2#citacoes [data-appendix-label]");
    await expect(label).toHaveCSS("font-size", "12px");

    const proseBox = await box(page.locator("article > .prose"));
    const items = citationItems(page);
    for (let index = 0; index < (await items.count()); index += 1) {
      const numberBox = await box(
        items.nth(index).locator("[data-citation-n]"),
      );
      expect(numberBox.x).toBeGreaterThanOrEqual(proseBox.x - 1);
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(overflow).toBeLessThanOrEqual(360);
  });
});

test.describe("citações sem JavaScript [RF-04]", () => {
  test.use({ javaScriptEnabled: false });

  test("o [2] da fixture-mdx leva a #cit-distill-multimodal", async ({
    page,
  }) => {
    const response = await page.goto(fixtureMdx.href);
    expect(response?.status()).toBe(200);

    const citations = await citationLinks(page.locator("article .prose"));
    const second = citations.find((citation) => citation.n === 2);
    expect(second).toBeDefined();
    if (!second) return;

    await second.locator.click();
    await expect(page).toHaveURL(/#cit-distill-multimodal$/);
    await expect(page.locator("#cit-distill-multimodal")).toBeInViewport();
  });

  test("citação no Markdown da fixture-md", async ({ page }) => {
    const response = await page.goto(fixtureMd.href);
    expect(response?.status(), fixtureMd.href).toBe(200);

    await expect(
      citationsSection(page).getByRole("heading", { level: 3 }),
    ).toHaveText([...fixtureMd.groups]);
    await expectItems(
      page,
      fixtureMd.citationTitles,
      fixtureMd.authorLines,
      fixtureMd.keys,
    );
    await expect(page.locator("h2#apendice-a")).toHaveAccessibleName(
      fixtureMd.appendixHeading,
    );

    const region = appendixRegion(page);
    await expect(region).toHaveCount(1);
    await expect(region.locator("#citacoes")).toHaveCount(1);
    await expect(region.locator("#apendice-a")).toHaveCount(1);
    await expect(page.locator("article .prose > hr")).toHaveCount(0);

    const citations = await citationLinks(page.locator("article .prose"));
    const first = citations.find((citation) => citation.n === 1);
    expect(first, fixtureMd.href).toBeDefined();
    if (!first) return;

    const target = `#cit-${fixtureMd.keys[0]}`;
    await expect(first.locator).toHaveAccessibleName("Citação 1");
    await expect(first.locator).toHaveAttribute("href", target);
    await first.locator.click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(page.locator(target)).toBeInViewport();
  });
});
