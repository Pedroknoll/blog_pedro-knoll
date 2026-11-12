import { expect, test, type Locator, type Page } from "@playwright/test";

import { fixtureMd, fixtureMdx } from "./fixtures";
import { publishedPosts } from "./published-posts";

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

function referenceItems(page: Page) {
  return page.locator("section:has(> h2#referencias) > ol > li");
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

test.describe("referências e apêndices [RF-04]", () => {
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

        const items = referenceItems(page);
        const itemCount = await items.count();
        const itemIds: string[] = [];
        for (let index = 0; index < itemCount; index += 1) {
          const id = await items.nth(index).getAttribute("id");
          expect(id).toBeTruthy();
          itemIds.push(id as string);
        }

        const citations = await citationLinks(prose);
        const cited = new Set<string>();
        for (const citation of citations) {
          const id = itemIds[citation.n - 1];
          expect(id).toBeTruthy();
          await expect(citation.locator).toHaveAccessibleName(
            `Referência ${citation.n}`,
          );
          await expect(citation.locator).toHaveAttribute("href", `#${id}`);
          cited.add(id as string);
        }

        for (const id of itemIds) {
          expect(cited.has(id)).toBe(true);
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
        if (citations.length === 0 && appendixIds.length === 0) {
          await expect(page.locator("#referencias")).toHaveCount(0);
          await expect(page.locator('[id^="apendice-"]')).toHaveCount(0);
          await expect(page.locator('[id^="ref-"]')).toHaveCount(0);
          await expect(region).toHaveCount(0);
        } else {
          await expect(region).toHaveCount(1);
          for (const id of appendixIds) {
            await expect(region.locator(`h2#${id}`)).toHaveCount(1);
          }
          if ((await page.locator("#referencias").count()) > 0) {
            await expect(region.locator("#referencias")).toHaveCount(1);
          }
        }
      });
    }
  });

  test("conteúdo de teste na fixture-mdx", async ({ page }) => {
    const posts = await publishedPosts(page);
    const covered: boolean[] = [];

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);
        const hasReferences = (await page.locator("#referencias").count()) > 0;
        const hasAppendix =
          (await page.locator('h2[id^="apendice-"]').count()) > 0;
        covered.push(hasReferences && hasAppendix);
      });
    }

    expect(covered).toContain(true);

    const response = await page.goto(fixtureMdx.href);
    expect(response?.status()).toBe(200);

    const items = referenceItems(page);
    await expect(items).toHaveCount(2);
    await expect(items.nth(0).locator("a")).toHaveText(distillTitle);
    await expect(items.nth(0).locator("> p")).toHaveText(distillByline);
    await expect(items.nth(1).locator("a")).toHaveText(astroTitle);
    await expect(items.nth(1).locator("> p")).toHaveText(astroByline);
    await expect(page.locator("h2#apendice-a")).toHaveText(
      "Apêndice A · Como as referências funcionam",
    );

    const region = appendixRegion(page);
    await expect(region).toHaveCount(1);
    await expect(region.locator("#referencias")).toHaveCount(1);
    await expect(region.locator("#apendice-a")).toHaveCount(1);
    await expect(page.locator("article #referencias")).toHaveCount(0);
    await expect(page.locator("article .prose > hr")).toHaveCount(0);
  });

  test("faixa a 1280", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto(fixtureMdx.href);
    expect(response?.status()).toBe(200);

    const heading = page.locator("h2#referencias");
    await expect(heading).toHaveCSS("font-size", "12px");

    const mono = await variableFamily(page, "--font-plex-mono");
    const family = await heading.evaluate(
      (element) => getComputedStyle(element).fontFamily,
    );
    expect(firstFamily(family)).toBe(mono);
    await expect(heading).toHaveCSS("text-transform", "uppercase");

    const headingBox = await box(heading);
    expect(headingBox.width).toBeLessThanOrEqual(240);

    const railBox = await box(page.locator("[data-post-rail]"));
    expect(headingBox.x).toBeCloseTo(railBox.x, 0);

    const listBox = await box(
      page.locator("section:has(> h2#referencias) > ol"),
    );
    const proseBox = await box(page.locator("article > .prose"));
    expect(listBox.x).toBeCloseTo(proseBox.x, 0);

    await expectCopy(page.locator("section:has(> h2#apendice-a) p"));
    await expectCopy(referenceItems(page).locator("> p"));
  });

  test("faixa a 360", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const response = await page.goto(fixtureMdx.href);
    expect(response?.status()).toBe(200);

    const heading = page.locator("h2#referencias");
    await expect(heading).toHaveCSS("font-size", "12px");

    const headingBox = await box(heading);
    const listBox = await box(
      page.locator("section:has(> h2#referencias) > ol"),
    );
    expect(headingBox.y + headingBox.height).toBeLessThanOrEqual(listBox.y);
    expect(headingBox.x).toBeCloseTo(listBox.x, 0);
  });
});

test.describe("referências sem JavaScript [RF-04]", () => {
  test.use({ javaScriptEnabled: false });

  test("o primeiro [1] da fixture-mdx leva a #ref-distill-multimodal", async ({
    page,
  }) => {
    const response = await page.goto(fixtureMdx.href);
    expect(response?.status()).toBe(200);

    const citations = await citationLinks(page.locator("article .prose"));
    const first = citations.find((citation) => citation.n === 1);
    expect(first).toBeDefined();
    if (!first) return;

    await first.locator.click();
    await expect(page).toHaveURL(/#ref-distill-multimodal$/);
    await expect(page.locator("#ref-distill-multimodal")).toBeInViewport();
  });

  test("citação no Markdown da fixture-md", async ({ page }) => {
    const response = await page.goto(fixtureMd.href);
    expect(response?.status(), fixtureMd.href).toBe(200);

    const items = referenceItems(page);
    await expect(items).toHaveCount(2);
    await expect(items.nth(0).locator("a")).toHaveText(
      fixtureMd.referenceTitles[0],
    );
    await expect(items.nth(0).locator("> p")).toHaveText(
      fixtureMd.authorLines[0],
    );
    await expect(items.nth(1).locator("a")).toHaveText(
      fixtureMd.referenceTitles[1],
    );
    await expect(items.nth(1).locator("> p")).toHaveText(
      fixtureMd.authorLines[1],
    );
    await expect(page.locator("h2#apendice-a")).toHaveText(
      fixtureMd.appendixHeading,
    );

    const region = appendixRegion(page);
    await expect(region).toHaveCount(1);
    await expect(region.locator("#referencias")).toHaveCount(1);
    await expect(region.locator("#apendice-a")).toHaveCount(1);
    await expect(page.locator("article #referencias")).toHaveCount(0);
    await expect(page.locator("article .prose > hr")).toHaveCount(0);

    const citations = await citationLinks(page.locator("article .prose"));
    const first = citations.find((citation) => citation.n === 1);
    expect(first, fixtureMd.href).toBeDefined();
    if (!first) return;

    const target = `#ref-${fixtureMd.keys[0]}`;
    await expect(first.locator).toHaveAccessibleName("Referência 1");
    await expect(first.locator).toHaveAttribute("href", target);
    await first.locator.click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(page.locator(target)).toBeInViewport();
  });
});
