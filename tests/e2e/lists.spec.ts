import fs from "node:fs";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { homeGreeting, notFoundHeading } from "./site-literals";

type DiskPost = {
  slug: string;
  kind: "article" | "prototype";
  date: string;
};

function diskPosts(): DiskPost[] {
  const root = path.resolve("src/content/posts");
  const posts: DiskPost[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = ["index.md", "index.mdx"]
      .map((name) => path.join(root, entry.name, name))
      .find((candidate) => fs.existsSync(candidate));
    if (!file) continue;
    const frontmatter = /^---\n([\s\S]*?\n)---/.exec(
      fs.readFileSync(file, "utf8"),
    )?.[1];
    if (!frontmatter) throw new Error(`${entry.name}: sem frontmatter`);
    if (/^draft:\s*true\s*$/m.test(frontmatter)) continue;
    const kind = /^kind:\s*(article|prototype)\s*$/m.exec(frontmatter)?.[1];
    const date = /^pubDate:\s*(\d{4}-\d{2}-\d{2})\s*$/m.exec(frontmatter)?.[1];
    if (kind !== "article" && kind !== "prototype") {
      throw new Error(`${entry.name}: kind ausente`);
    }
    if (!date) throw new Error(`${entry.name}: pubDate ausente`);
    posts.push({ slug: entry.name, kind, date });
  }
  return posts.sort((left, right) => {
    if (left.date !== right.date) return left.date < right.date ? 1 : -1;
    if (left.slug < right.slug) return -1;
    if (left.slug > right.slug) return 1;
    return 0;
  });
}

function hrefOf(slug: string) {
  return `/blog/${slug}/`;
}

async function open(page: Page, listPath: string) {
  const response = await page.goto(listPath);
  expect(response?.status(), listPath).toBe(200);
}

async function listedHrefs(page: Page) {
  return page
    .locator("[data-listing] :is(h2, h3) a")
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
  await expect(page.locator("[data-listing] h3")).toHaveCount(0);
  const headings = page.locator("[data-listing] h2");
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

async function dimmedOnHover(page: Page, listPath: string) {
  await open(page, listPath);
  const articles = page.locator("[data-listing] article");
  expect(await articles.count(), listPath).toBeGreaterThanOrEqual(2);
  const count = await articles.count();
  for (let index = 0; index < count; index += 1) {
    await expect(articles.nth(index)).toHaveCSS("opacity", "1");
  }
  const target = articles.nth(0);
  const link = target.locator("h2 a");
  const rest = await link.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, decoration: style.textDecorationLine };
  });
  await target.hover();
  await expect(target).toHaveCSS("opacity", "1");
  for (let index = 1; index < count; index += 1) {
    await expect(articles.nth(index)).toHaveCSS("opacity", "0.35");
  }
  await expect(link).toHaveCSS("color", rest.color);
  await expect(link).toHaveCSS("text-decoration-line", "none");
  await page.mouse.move(0, 0);
  for (let index = 0; index < count; index += 1) {
    await expect(articles.nth(index)).toHaveCSS("opacity", "1");
  }
}

test("hover dos itens [RF-01]", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const tagged = await page.goto("/blog/fixture-mdx/");
  expect(tagged?.status()).toBe(200);
  const href = await page
    .getByRole("list", { name: "Tags", exact: true })
    .getByRole("link")
    .first()
    .getAttribute("href");
  expect(href).toMatch(/^\/tags\/[a-z0-9-]+\/$/);
  for (const listPath of ["/blog/", "/artigos/", href ?? ""]) {
    await dimmedOnHover(page, listPath);
  }
});

test.describe("toque [RF-01]", () => {
  test.use({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });

  test("hover não esmaece", async ({ page }) => {
    await open(page, "/blog/");
    const articles = page.locator("[data-listing] article");
    expect(await articles.count()).toBeGreaterThanOrEqual(2);
    const property = await articles
      .first()
      .evaluate((element) => getComputedStyle(element).transitionProperty);
    expect(property.split(",").map((item) => item.trim())).toContain("opacity");
    const media = await page.evaluate(() => ({
      fine: matchMedia("(hover: hover) and (pointer: fine)").matches,
      none: matchMedia("(hover: none)").matches,
    }));
    expect(media.fine).toBe(false);
    expect(media.none).toBe(true);
    const placement = await page.evaluate(() => {
      const selector = "[data-listing]:has(article:hover) article:not(:hover)";
      const found: string[] = [];
      const visit = (rules: CSSRuleList, condition: string) => {
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSStyleRule && rule.selectorText === selector) {
            found.push(condition);
          } else if (rule instanceof CSSMediaRule) {
            visit(rule.cssRules, rule.conditionText);
          } else if (rule instanceof CSSGroupingRule) {
            visit(rule.cssRules, condition);
          }
        }
      };
      for (const sheet of Array.from(document.styleSheets)) {
        visit(sheet.cssRules, "");
      }
      return found;
    });
    expect(placement).toEqual(["(hover: hover) and (pointer: fine)"]);
    await articles.first().hover();
    const count = await articles.count();
    for (let index = 0; index < count; index += 1) {
      await expect(articles.nth(index)).toHaveCSS("opacity", "1");
    }
  });
});

test("foco do teclado [RF-01]", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page, "/blog/");
  const articles = page.locator("[data-listing] article");
  expect(await articles.count()).toBeGreaterThanOrEqual(2);
  const link = articles.nth(0).locator("h2 a");
  const rest = await link.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, decoration: style.textDecorationLine };
  });
  for (let step = 0; step < 40; step += 1) {
    const focused = await link.evaluate(
      (element) => element === document.activeElement,
    );
    if (focused) break;
    await page.keyboard.press("Tab");
  }
  await expect(link).toBeFocused();
  const count = await articles.count();
  for (let index = 0; index < count; index += 1) {
    const ownsFocus = await articles
      .nth(index)
      .locator("h2 a")
      .evaluate((element) => element === document.activeElement);
    await expect(articles.nth(index)).toHaveCSS(
      "opacity",
      ownsFocus ? "1" : "0.35",
    );
  }
  await expect(link).toHaveCSS("color", rest.color);
  await expect(link).toHaveCSS("text-decoration-line", "none");
});

test("movimento reduzido [RF-01]", async ({ page }) => {
  await open(page, "/blog/");
  const articles = page.locator("[data-listing] article");
  expect(await articles.count()).toBeGreaterThanOrEqual(2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(articles.first()).toHaveCSS("transition-duration", "0s");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(articles.first()).toHaveCSS("transition-property", "opacity");
  await expect(articles.first()).toHaveCSS("transition-duration", "0.15s");
});
