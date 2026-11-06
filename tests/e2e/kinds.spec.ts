import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { KIND_LABELS, KINDS, type Kind } from "../../src/lib/kind";
import { nextPageLink } from "./published-posts";
import { homeGreeting, kindPath, titled } from "./site-literals";

type CardRow = {
  href: string;
  datetime: string;
  slug: string;
  kind: Kind;
};

function kindOf(label: string): Kind | undefined {
  return KINDS.find((kind) => KIND_LABELS[kind] === label);
}

async function cardsHere(page: Page): Promise<CardRow[]> {
  const articles = page.locator("article");
  const count = await articles.count();
  const labels = Object.values(KIND_LABELS);
  const rows: CardRow[] = [];
  for (let index = 0; index < count; index += 1) {
    const article = articles.nth(index);
    const href = (await article.locator("h2 a").getAttribute("href")) ?? "";
    const datetime =
      (await article.locator("time").getAttribute("datetime")) ?? "";
    expect(href).toMatch(/^\/blog\/[a-z0-9-]+\/$/);
    expect(datetime).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const label = await article.evaluate((root, names) => {
      const hit = [...root.querySelectorAll("span")].find((span) =>
        names.includes((span.textContent ?? "").replace(/\s+/g, " ").trim()),
      );
      return (hit?.textContent ?? "").replace(/\s+/g, " ").trim();
    }, labels);
    const kind = kindOf(label);
    expect(kind, label).toBeTruthy();
    if (!kind) continue;
    rows.push({
      href,
      datetime,
      slug: href.slice("/blog/".length, -1),
      kind,
    });
  }
  return rows;
}

async function publishedCards(page: Page): Promise<CardRow[]> {
  const rows: CardRow[] = [];
  const seen = new Set<string>();
  await open(page, "/");
  for (;;) {
    for (const row of await cardsHere(page)) {
      if (seen.has(row.href)) continue;
      seen.add(row.href);
      rows.push(row);
    }
    const next = nextPageLink(page);
    if ((await next.count()) === 0) break;
    const href = await next.getAttribute("href");
    expect(href).toBeTruthy();
    await open(page, href ?? "");
  }
  expect(rows.length).toBeGreaterThan(0);
  return rows;
}

function byPublication(left: CardRow, right: CardRow) {
  if (left.datetime !== right.datetime) {
    return left.datetime < right.datetime ? 1 : -1;
  }
  if (left.slug < right.slug) return -1;
  if (left.slug > right.slug) return 1;
  return 0;
}

function countsOf(rows: readonly CardRow[]) {
  return KINDS.flatMap((kind) => {
    const count = rows.filter((row) => row.kind === kind).length;
    return count > 0 ? [{ kind, count }] : [];
  });
}

async function open(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
}

async function tagWithTwoPosts(page: Page, rows: readonly CardRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    await open(page, row.href);
    const links = page
      .getByRole("list", { name: "Tags", exact: true })
      .getByRole("link");
    const count = await links.count();
    for (let index = 0; index < count; index += 1) {
      const href = await links.nth(index).getAttribute("href");
      if (!href?.startsWith("/tags/")) continue;
      counts.set(href, (counts.get(href) ?? 0) + 1);
    }
  }
  const found = [...counts.entries()].find((entry) => entry[1] >= 2);
  expect(found, "nenhuma tag com dois posts").toBeTruthy();
  return found?.[0] ?? "";
}

async function iconPaint(icon: Locator, kind: Kind) {
  return icon.evaluate((element, token) => {
    const probe = document.createElement("span");
    probe.style.color = `var(--color-${token})`;
    document.body.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    const style = getComputedStyle(element);
    return { color: style.color, expected, opacity: style.opacity };
  }, `kind-${kind}`);
}

test("barra na home [RF-02]", async ({ page }) => {
  const rows = await publishedCards(page);
  const counts = countsOf(rows);
  expect(counts.length).toBeGreaterThan(0);

  await open(page, "/");
  const nav = page.getByRole("navigation", {
    name: "Filtrar por tipo",
    exact: true,
  });
  await expect(nav).toHaveCount(1);
  await expect(
    page.getByRole("navigation", { name: "Filtrar por tag", exact: true }),
  ).toHaveCount(0);

  const links = nav.getByRole("link");
  await expect(links).toHaveCount(counts.length + 1);
  const todos = links.nth(0);
  await expect(todos).toHaveText("Todos");
  await expect(todos).toHaveAttribute("href", "/");
  await expect(todos).toHaveAttribute("aria-current", "true");

  for (const [index, entry] of counts.entries()) {
    const link = links.nth(index + 1);
    const label = KIND_LABELS[entry.kind];
    const word = entry.count === 1 ? "post" : "posts";
    await expect(link).toHaveAccessibleName(`${label} ${entry.count} ${word}`);
    await expect(link).toHaveAttribute("href", kindPath(entry.kind));
    await expect(link).not.toHaveAttribute("aria-current");
    await expect(link.locator("sup")).toHaveText(String(entry.count));
    const icon = link.locator("svg");
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon).toHaveAttribute("width", "12");
    await expect(icon).toHaveAttribute("height", "12");
    const paint = await iconPaint(icon, entry.kind);
    expect(paint.color).toBe(paint.expected);
    expect(paint.opacity).toBe("0.55");
  }
});

test("páginas de tipo [RF-02, RF-11, RF-12]", async ({ page }) => {
  const rows = await publishedCards(page);
  const counts = countsOf(rows);
  expect(counts.length).toBeGreaterThan(0);
  const ordered = [...rows].sort(byPublication);

  for (const entry of counts) {
    const path = kindPath(entry.kind);
    const label = KIND_LABELS[entry.kind];
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: homeGreeting,
        exact: true,
      }),
    ).toHaveCount(1);
    await expect(page).toHaveTitle(titled(`Tipo: ${label}`));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      `Posts do tipo ${label}.`,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      `Tipo: ${label}`,
    );
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    expect(new URL((await canonical.getAttribute("href")) ?? "").pathname).toBe(
      path,
    );
    const list = page.getByRole("list", {
      name: `Posts do tipo ${label}`,
      exact: true,
    });
    await expect(list).toHaveCount(1);
    const hrefs = await list
      .locator(":scope > li h2 a")
      .evaluateAll((nodes) =>
        nodes.map((anchor) => anchor.getAttribute("href")),
      );
    const expected = ordered
      .filter((row) => row.kind === entry.kind)
      .map((row) => row.href);
    expect(hrefs).toEqual(expected);
    await expect(
      page.getByRole("region", { name: "Destaque", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "Paginação", exact: true }),
    ).toHaveCount(0);
    const current = page.locator('[aria-current="true"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("href", path);
    await expect(
      page.locator('script:not([type="application/ld+json"])'),
    ).toHaveCount(0);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );
    expect(blocking.map((violation) => violation.id)).toEqual([]);
  }

  const missing = KINDS.filter(
    (kind) => !counts.some((entry) => entry.kind === kind),
  );
  expect(missing.length).toBeGreaterThan(0);
  for (const kind of missing) {
    const path = kindPath(kind);
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
  const index = await page.goto("/tipos/");
  expect(index?.status()).toBe(404);
});

async function dimmedOnHover(page: Page, path: string) {
  await open(page, path);
  const articles = page.locator("[data-listing] article");
  expect(await articles.count(), path).toBeGreaterThanOrEqual(2);
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

test("hover dos cards [RF-01]", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const rows = await publishedCards(page);
  const counts = countsOf(rows);
  const kind = counts[0]?.kind;
  expect(kind).toBeTruthy();
  if (!kind) return;
  const tag = await tagWithTwoPosts(page, rows);
  for (const path of ["/", kindPath(kind), tag]) {
    await dimmedOnHover(page, path);
  }
});

test.describe("toque [RF-01]", () => {
  test.use({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });

  test("hover não esmaece", async ({ page }) => {
    await open(page, "/");
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
  await open(page, "/");
  const articles = page.locator("article");
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
  await open(page, "/");
  const articles = page.locator("article");
  expect(await articles.count()).toBeGreaterThanOrEqual(2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(articles.first()).toHaveCSS("transition-duration", "0s");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(articles.first()).toHaveCSS("transition-property", "opacity");
  await expect(articles.first()).toHaveCSS("transition-duration", "0.15s");
});
