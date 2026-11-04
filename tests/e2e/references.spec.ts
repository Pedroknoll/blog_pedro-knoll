import { expect, test, type Locator, type Page } from "@playwright/test";

import { publishedPosts } from "./published-posts";

const postB = "/blog/2026-10-como-o-blog-e-feito/";

const distill =
  "Gabriel Goh, Nick Cammarata, Chelsea Voss, Shan Carter, Michael Petrov, Ludwig Schubert, Alec Radford e Chris Olah, 2021. Multimodal Neurons in Artificial Neural Networks. Distill.";

const astroDoc = "Astro, 2026. Unified API Reference. Documentação do Astro.";

function referenceItems(page: Page) {
  return page.locator("section:has(> h2#referencias) > ol > li");
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

        if (citations.length === 0 && appendixIds.length === 0) {
          await expect(page.locator("#referencias")).toHaveCount(0);
          await expect(page.locator('[id^="apendice-"]')).toHaveCount(0);
          await expect(page.locator('[id^="ref-"]')).toHaveCount(0);
        }
      });
    }
  });

  test("conteúdo de teste no post B, anotado para a T-39", async ({ page }) => {
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

    const response = await page.goto(postB);
    expect(response?.status()).toBe(200);

    const items = referenceItems(page);
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toHaveText(distill);
    await expect(items.nth(1)).toHaveText(astroDoc);
    await expect(page.locator("h2#apendice-a")).toHaveText(
      "Apêndice A · Como as referências funcionam",
    );
  });
});

test.describe("referências sem JavaScript [RF-04]", () => {
  test.use({ javaScriptEnabled: false });

  test("o primeiro [1] do post B leva a #ref-distill-multimodal", async ({
    page,
  }) => {
    const response = await page.goto(postB);
    expect(response?.status()).toBe(200);

    const citations = await citationLinks(page.locator("article .prose"));
    const first = citations.find((citation) => citation.n === 1);
    expect(first).toBeDefined();
    if (!first) return;

    await first.locator.click();
    await expect(page).toHaveURL(/#ref-distill-multimodal$/);
    await expect(page.locator("#ref-distill-multimodal")).toBeInViewport();
  });
});
