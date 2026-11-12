import { expect, test, type Locator, type Page } from "@playwright/test";

import { fixtureMd, fixtureMdx, fixtureSemTitulos } from "./fixtures";

function row(page: Page, rail: Locator, label: string) {
  return rail
    .locator("> div")
    .nth(1)
    .locator("> div")
    .filter({ has: page.getByText(label, { exact: true }) });
}

async function openFixture(page: Page, href: string, title: string) {
  const response = await page.goto(href);
  expect(response?.status(), href).toBe(200);
  const heading = page.locator("article h1");
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText(title);
  const rail = page.locator("[data-post-rail]");
  await expect(rail).toBeVisible();
  return rail;
}

test.describe("fixtures [RF-04]", () => {
  test("fixture-md tem atualização, as duas datas e h2 antes de h3 antes de h4", async ({
    page,
  }) => {
    const rail = await openFixture(page, fixtureMd.href, fixtureMd.title);
    const published = row(page, rail, "Data");
    const updated = row(page, rail, "Atualizado em");
    await expect(published).toBeVisible();
    await expect(updated).toBeVisible();
    await expect(rail.locator("time").first()).toBeVisible();
    await expect(rail.locator("time")).toHaveCount(2);
    await expect(published.locator("time")).toHaveText(fixtureMd.published);
    await expect(updated.locator("time")).toHaveText(fixtureMd.updated);

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
    const rail = await openFixture(page, fixtureMdx.href, fixtureMdx.title);
    await expect(row(page, rail, "Data")).toBeVisible();
    await expect(rail.locator("time").first()).toBeVisible();
    await expect(rail.locator("time")).toHaveCount(1);
    await expect(row(page, rail, "Data").locator("time")).toHaveText(
      fixtureMdx.published,
    );
    await expect(row(page, rail, "Atualizado em")).toHaveCount(0);
  });

  test("fixture-sem-titulos não tem atualização, tem uma data e não tem h2 nem h3", async ({
    page,
  }) => {
    const rail = await openFixture(
      page,
      fixtureSemTitulos.href,
      fixtureSemTitulos.title,
    );
    await expect(row(page, rail, "Data")).toBeVisible();
    await expect(rail.locator("time").first()).toBeVisible();
    await expect(rail.locator("time")).toHaveCount(1);
    await expect(row(page, rail, "Data").locator("time")).toHaveText(
      fixtureSemTitulos.published,
    );
    await expect(row(page, rail, "Atualizado em")).toHaveCount(0);

    const prose = page.locator("article .prose");
    await expect(prose).toBeVisible();
    await expect(prose.locator("p").first()).toBeVisible();
    await expect(prose.locator("h2")).toHaveCount(0);
    await expect(prose.locator("h3")).toHaveCount(0);
  });
});
