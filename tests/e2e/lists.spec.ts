import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { diskPosts } from "./disk-posts";
import { homeGreeting, notFoundHeading } from "./site-literals";

function hrefOf(slug: string) {
  return `/blog/${slug}/`;
}

async function open(page: Page, listPath: string) {
  const response = await page.goto(listPath);
  expect(response?.status(), listPath).toBe(200);
}

async function listedHrefs(page: Page) {
  return page
    .locator("[data-listing] article :is(h2, h3) a")
    .evaluateAll((nodes) => nodes.map((anchor) => anchor.getAttribute("href")));
}

async function expectListPage(
  page: Page,
  listPath: string,
  heading: string,
  slugs: string[],
  icon: boolean,
) {
  await open(page, listPath);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { level: 1, name: heading, exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("heading", { level: 1, name: homeGreeting, exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("list", { name: "Links do autor", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Filtrar por tipo", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Paginação", exact: true }),
  ).toHaveCount(0);
  // O h2 é o rótulo `/ LISTAGEM` e o h3, o título do post (T-131, Q24).
  await expect(page.locator("[data-listing] article h2")).toHaveCount(0);
  await expect(page.locator("[data-list-section] h2")).toHaveText("/ LISTAGEM");
  const headings = page.locator("[data-listing] article h3");
  await expect(headings).toHaveCount(slugs.length);
  expect(await listedHrefs(page)).toEqual(slugs.map(hrefOf));

  const h1 = page.getByRole("heading", { level: 1 });
  const iconSvg = h1.locator("svg");
  if (icon) {
    await expect(iconSvg).toHaveCount(1);
    await expect(iconSvg).toHaveAttribute("aria-hidden", "true");
    await expect(iconSvg).toHaveCSS("width", "24px");
    await expect(iconSvg).toHaveCSS("height", "24px");
  } else {
    await expect(iconSvg).toHaveCount(0);
  }

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(blocking.map((violation) => violation.id)).toEqual([]);
}

test("listas inteiras [RF-01, RF-02]", async ({ page }) => {
  const posts = diskPosts();
  expect(posts.length).toBeGreaterThan(0);
  const articles = posts.filter((post) => post.kind === "article");
  const prototypes = posts.filter((post) => post.kind === "prototype");
  expect(articles.length).toBeGreaterThan(0);
  expect(prototypes.length).toBeGreaterThan(0);

  await expectListPage(
    page,
    "/blog/",
    "Blog",
    posts.map((post) => post.slug),
    false,
  );
  await expectListPage(
    page,
    "/artigos/",
    "Artigos",
    articles.map((post) => post.slug),
    true,
  );
  await expectListPage(
    page,
    "/prototipos/",
    "Protótipos",
    prototypes.map((post) => post.slug),
    true,
  );
});

test("rotas mortas [RF-02]", async ({ page }) => {
  for (const listPath of [
    "/tipos/",
    "/tipos/artigos/",
    "/page/1/",
    "/page/2/",
  ]) {
    const response = await page.goto(listPath);
    expect(response?.status(), listPath).toBe(404);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: notFoundHeading,
        exact: true,
      }),
    ).toHaveCount(1);
  }
});

// O hover, o foco e o movimento reduzido do item estão no list-item.spec.ts
// (T-131): sem a queda para 0,35.
