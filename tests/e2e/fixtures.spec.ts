import { expect, test, type Page } from "@playwright/test";

import { fixtureMd, fixtureMdx, fixtureSemTitulos } from "./fixtures";

async function openFixture(page: Page, href: string, title: string) {
  const response = await page.goto(href);
  expect(response?.status(), href).toBe(200);
  const heading = page.locator("article h1");
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText(title);
  const meta = page.locator("article header [data-post-meta]");
  await expect(meta).toBeVisible();
  return meta;
}

test.describe("fixtures [RF-04]", () => {
  test("fixture-md tem atualização, as duas datas e h2 antes de h3 antes de h4", async ({
    page,
  }) => {
    const meta = await openFixture(page, fixtureMd.href, fixtureMd.title);
    await expect(page.getByText("Atualizado em", { exact: true })).toHaveCount(
      0,
    );
    await expect(page.locator("article header time")).toHaveCount(1);
    await expect(meta.locator("time")).toHaveText(fixtureMd.published);
    await expect(
      page.locator('meta[property="article:published_time"]'),
    ).toHaveAttribute("content", /^2000-01-02/);
    await expect(
      page.locator('meta[property="article:modified_time"]'),
    ).toHaveAttribute("content", /^2000-01-09/);

    const prose = page.locator("article .prose");
    await expect(prose).toBeVisible();
    const h2 = prose.locator("h2");
    const h3 = prose.locator("h3");
    const h4 = prose.locator("h4");
    await expect(h2).toBeVisible();
    await expect(h3).toBeVisible();
    await expect(h4).toBeVisible();
    const tags = await prose.locator("h2, h3, h4").evaluateAll((nodes) => {
      return nodes.map((node) => node.tagName);
    });
    expect(tags).toEqual(["H2", "H3", "H4"]);
  });

  test("fixture-mdx não tem atualização e tem uma data", async ({ page }) => {
    const meta = await openFixture(page, fixtureMdx.href, fixtureMdx.title);
    await expect(meta.locator("time")).toBeVisible();
    await expect(page.locator("article header time")).toHaveCount(1);
    await expect(meta.locator("time")).toHaveText(fixtureMdx.published);
    await expect(page.getByText("Atualizado em", { exact: true })).toHaveCount(
      0,
    );
  });

  test("fixture-sem-titulos não tem atualização, tem uma data e não tem h2 nem h3", async ({
    page,
  }) => {
    const meta = await openFixture(
      page,
      fixtureSemTitulos.href,
      fixtureSemTitulos.title,
    );
    await expect(meta.locator("time")).toBeVisible();
    await expect(page.locator("article header time")).toHaveCount(1);
    await expect(meta.locator("time")).toHaveText(fixtureSemTitulos.published);
    await expect(page.getByText("Atualizado em", { exact: true })).toHaveCount(
      0,
    );

    const prose = page.locator("article .prose");
    await expect(prose).toBeVisible();
    await expect(prose.locator("p").first()).toBeVisible();
    await expect(prose.locator("h2")).toHaveCount(0);
    await expect(prose.locator("h3")).toHaveCount(0);
  });
});
