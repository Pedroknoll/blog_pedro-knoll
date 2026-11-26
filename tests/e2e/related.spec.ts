import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  fixtureFormulas,
  fixtureMd,
  fixtureMdx,
  fixtureSemTitulos,
} from "./fixtures";

// Posts relacionados pelas tags (RF-18, T-26, BRAND §9.14). As fixtures têm
// só a tag `fixture` em comum: a ordem é a da data, a mais recente primeiro.
// A contagem de tags em comum e a ausência da seção estão no Vitest
// (`tests/unit/related.test.ts`).

const WIDTHS = [360, 1280] as const;
// O terceiro na ordem, a `fixture-mdx`, fica de fora: o teto é 2.
const EXPECTED = [fixtureSemTitulos.title, fixtureFormulas.title];

function related(page: Page) {
  return page.locator("[data-post-related]");
}

async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: 800 });
  const response = await page.goto(fixtureMd.href);
  expect(response?.status()).toBe(200);
}

test.describe("posts relacionados [RF-18]", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/votes", (route) => route.abort());
  });

  test("até 2, nunca o próprio, por data no empate", async ({ page }) => {
    await open(page, 1280);
    const section = related(page);
    await expect(
      section.getByRole("heading", { level: 2, name: "/ POSTS RELACIONADOS" }),
    ).toBeVisible();
    const titles = section.getByRole("heading", { level: 3 });
    await expect(titles).toHaveText(EXPECTED);
    await expect(section.getByText(fixtureMd.title)).toHaveCount(0);
    await expect(section.getByText(fixtureMdx.title)).toHaveCount(0);
  });

  test("o item é o das listas inteiras", async ({ page }) => {
    await open(page, 1280);
    const items = related(page).locator("li");
    await expect(items).toHaveCount(2);
    for (let index = 0; index < 2; index += 1) {
      const item = items.nth(index);
      await expect(item.locator("time")).toHaveCount(1);
      await expect(item.locator("[data-description]")).not.toBeEmpty();
      await expect(item.locator("[data-reading]")).toContainText("minuto");
      await expect(item.getByRole("link")).toHaveAttribute(
        "href",
        /^\/blog\/fixture-[a-z-]+\/$/,
      );
    }
  });

  test("o rótulo em tinta sobre filete de 1 px em tinta", async ({ page }) => {
    for (const width of WIDTHS) {
      await test.step(`${width}px`, async () => {
        await open(page, width);
        const label = related(page).getByRole("heading", { level: 2 });
        await expect(label).toHaveCSS("font-size", "12px");
        await expect(label).toHaveCSS("text-transform", "uppercase");
        await expect(label).toHaveCSS("border-bottom-width", "1px");
        await expect(label).toHaveCSS("padding-bottom", "8px");
        const color = await label.evaluate(
          (element) => getComputedStyle(element).color,
        );
        await expect(label).toHaveCSS("border-bottom-color", color);
      });
    }
  });

  test("depois do apêndice e do bloco do fim do texto", async ({ page }) => {
    await open(page, 360);
    const order = await page.evaluate(() => {
      const after = (first: string, second: string) => {
        const a = document.querySelector(first);
        const b = document.querySelector(second);
        if (!a || !b) return false;
        return Boolean(
          a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING,
        );
      };
      return {
        actions: after('[data-post-actions="end"]', "[data-post-related]"),
        appendix: after("[data-appendix-body]", "[data-post-related]"),
      };
    });
    expect(order).toEqual({ actions: true, appendix: true });
  });

  test("na coluna do texto, alinhada à prosa", async ({ page }) => {
    for (const width of WIDTHS) {
      await test.step(`${width}px`, async () => {
        await open(page, width);
        const prose = await page.locator("[data-pagefind-body]").boundingBox();
        const label = await related(page)
          .getByRole("heading", { level: 2 })
          .boundingBox();
        expect(prose).not.toBeNull();
        expect(label).not.toBeNull();
        expect(Math.abs((label?.x ?? 0) - (prose?.x ?? 0))).toBeLessThan(1);
        const overflows = await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        );
        expect(overflows).toBe(false);
      });
    }
  });

  test("sem violação do axe na seção", async ({ page }) => {
    await open(page, 1280);
    const results = await new AxeBuilder({ page })
      .include("[data-post-related]")
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test("um só GET de votos preenche o botão e os itens [RF-18, RF-25]", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/votes", async (route) => {
    if (route.request().method() === "GET") requests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        votes: {
          "fixture-md": 5,
          "fixture-formulas": 0,
          "fixture-sem-titulos": 2,
        },
      }),
    });
  });
  await open(page, 360);

  const vote = page.locator("[data-post-vote]:visible");
  await expect(vote.locator("[data-vote-count]")).toContainText("5");

  const items = related(page).locator("li");
  const two = items.filter({ hasText: fixtureSemTitulos.title });
  await expect(two.locator("[data-votes]")).toBeVisible();
  await expect(two.locator("[data-votes]")).toContainText("2 votos");
  const zero = items.filter({ hasText: fixtureFormulas.title });
  await expect(zero.locator("[data-votes]")).toBeHidden();

  await page.waitForLoadState("networkidle");
  expect(requests).toBe(1);
});
