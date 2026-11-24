import { expect, test, type Locator, type Page } from "@playwright/test";

import { fixtureMd } from "./fixtures";
import {
  authorGithub,
  authorLinkedin,
  authorName,
  siteTitle,
} from "./site-literals";

const articles = "/artigos/";
const prototypes = "/prototipos/";

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

async function tokenColor(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.color = `var(--color-${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
}

async function open(page: Page, path: string, width: number, height = 800) {
  await page.setViewportSize({ width, height });
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
}

function principal(page: Page) {
  return page
    .getByRole("banner")
    .getByRole("navigation", { name: "Principal", exact: true });
}

function signature(page: Page) {
  return page.getByRole("banner").getByRole("link", {
    name: siteTitle,
    exact: true,
  });
}

async function expectLinkStyle(link: Locator, mono: string, muted: string) {
  const family = firstFamily(
    await link.evaluate((node) => getComputedStyle(node).fontFamily),
  );
  expect(family).toBe(mono);
  await expect(link).toHaveCSS("font-size", "12px");
  await expect(link).toHaveCSS("text-transform", "uppercase");
  await expect(link).toHaveCSS("letter-spacing", "1.44px");
  const color = await link.evaluate((node) => getComputedStyle(node).color);
  expect(color).toBe(muted);
  const height = await link.evaluate(
    (node) => node.getBoundingClientRect().height,
  );
  expect(height).toBeGreaterThanOrEqual(44);
}

async function gapBetween(links: Locator): Promise<number> {
  const boxes = await links.evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { left: box.left, right: box.right };
    }),
  );
  expect(boxes.length).toBeGreaterThan(1);
  return boxes[1].left - boxes[0].right;
}

async function contentRight(node: Locator): Promise<number> {
  return node.evaluate((element) => {
    const container = element.parentElement;
    if (!container) throw new Error("sem contêiner");
    const box = container.getBoundingClientRect();
    const pad = Number.parseFloat(getComputedStyle(container).paddingRight);
    return box.right - pad;
  });
}

test.describe("header e footer", () => {
  test("HF1 nav Principal", async ({ page }) => {
    await open(page, "/", 1280);
    const nav = principal(page);
    await expect(nav).toHaveCount(1);
    const links = nav.getByRole("link");
    await expect(links).toHaveText(["Artigos", "Protótipos"]);
    await expect(links.nth(0)).toHaveAttribute("href", articles);
    await expect(links.nth(1)).toHaveAttribute("href", prototypes);
  });

  test("HF2 página atual", async ({ page }) => {
    const ink = { current: "" };

    async function expectCurrent(path: string, current: string | null) {
      await open(page, path, 1280);
      if (!ink.current) ink.current = await tokenColor(page, "ink");
      const links = principal(page).getByRole("link");
      const count = await links.count();
      expect(count).toBeGreaterThan(0);
      let marked = 0;
      for (let index = 0; index < count; index += 1) {
        const link = links.nth(index);
        const name = (await link.textContent())?.replace(/\s+/g, " ").trim();
        const onPage = current !== null && name === current;
        if (onPage) {
          marked += 1;
          await expect(link).toHaveAttribute("aria-current", "page");
          const color = await link.evaluate(
            (node) => getComputedStyle(node).color,
          );
          expect(color).toBe(ink.current);
          await expect(link).toHaveCSS("text-decoration-line", "underline");
          await expect(link).toHaveCSS("text-decoration-thickness", "2px");
        } else {
          expect(await link.getAttribute("aria-current")).toBeNull();
          await expect(link).toHaveCSS("text-decoration-line", "none");
        }
      }
      expect(marked).toBe(current === null ? 0 : 1);
    }

    await expectCurrent(articles, "Artigos");
    await expectCurrent(prototypes, "Protótipos");
    await expectCurrent("/", null);
    await expectCurrent(fixtureMd.href, null);
  });

  test("HF3 estilo dos links", async ({ page }) => {
    await open(page, "/", 1280);
    const mono = await variableFamily(page, "--font-plex-mono");
    const muted = await tokenColor(page, "muted");
    const links = principal(page).getByRole("link");
    const count = await links.count();
    expect(count).toBe(2);
    for (let index = 0; index < count; index += 1) {
      await expectLinkStyle(links.nth(index), mono, muted);
    }
    expect(await gapBetween(links)).toBeCloseTo(20, 0);
  });

  test("HF4 uma linha a partir de md", async ({ page }) => {
    for (const width of [768, 1280]) {
      await open(page, "/", width);
      const mark = await signature(page).boundingBox();
      const link = await principal(page)
        .getByRole("link")
        .first()
        .boundingBox();
      const nav = await principal(page).boundingBox();
      expect(mark, String(width)).not.toBeNull();
      expect(link, String(width)).not.toBeNull();
      expect(nav, String(width)).not.toBeNull();
      if (!mark || !link || !nav) return;
      const markCenter = mark.y + mark.height / 2;
      const linkCenter = link.y + link.height / 2;
      expect(Math.abs(linkCenter - markCenter), String(width)).toBeLessThan(1);
      const right = await contentRight(principal(page));
      expect(nav.x + nav.width, String(width)).toBeCloseTo(right, 0);
    }
  });

  test("HF5 duas linhas abaixo de md", async ({ page }) => {
    for (const width of [360, 767]) {
      await open(page, "/", width);
      const mark = await signature(page).boundingBox();
      const nav = principal(page);
      const navBox = await nav.boundingBox();
      expect(mark, String(width)).not.toBeNull();
      expect(navBox, String(width)).not.toBeNull();
      if (!mark || !navBox) return;
      expect(navBox.y, String(width)).toBeGreaterThanOrEqual(
        mark.y + mark.height - 1,
      );
      await expect(nav).toHaveCSS("overflow-x", "auto");
      await expect(nav).toHaveCSS("border-top-width", "1px");
      const line = await tokenColor(page, "line");
      const border = await nav.evaluate(
        (node) => getComputedStyle(node).borderTopColor,
      );
      expect(border, String(width)).toBe(line);
      const overflows = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(overflows, String(width)).toBe(false);
    }
  });

  test("HF6 rodapé", async ({ page }) => {
    const year = new Date().getFullYear();
    await open(page, "/", 1280);
    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveCount(1);
    await expect(footer).toHaveCSS("padding-top", "24px");
    await expect(footer).toHaveCSS("padding-bottom", "24px");
    await expect(footer).toHaveCSS("border-top-width", "1px");
    const line = await tokenColor(page, "line");
    const border = await footer.evaluate(
      (node) => getComputedStyle(node).borderTopColor,
    );
    expect(border).toBe(line);

    const name = footer.locator("p");
    await expect(name).toHaveCount(1);
    await expect(name).toHaveText(`${authorName} · ${year}`);
    const mono = await variableFamily(page, "--font-plex-mono");
    const muted = await tokenColor(page, "muted");
    const nameFamily = firstFamily(
      await name.evaluate((node) => getComputedStyle(node).fontFamily),
    );
    expect(nameFamily).toBe(mono);
    await expect(name).toHaveCSS("font-size", "12px");
    await expect(name).toHaveCSS("text-transform", "uppercase");
    const nameColor = await name.evaluate(
      (node) => getComputedStyle(node).color,
    );
    expect(nameColor).toBe(muted);

    const links = footer.getByRole("list").getByRole("link");
    await expect(links).toHaveText(["RSS", "GitHub", "LinkedIn"]);
    await expect(links.nth(0)).toHaveAttribute("href", "/rss.xml");
    await expect(links.nth(1)).toHaveAttribute("href", authorGithub);
    await expect(links.nth(2)).toHaveAttribute("href", authorLinkedin);
    const count = await links.count();
    for (let index = 0; index < count; index += 1) {
      await expectLinkStyle(links.nth(index), mono, muted);
    }
    expect(await gapBetween(links)).toBeCloseTo(20, 0);

    const nameBox = await name.boundingBox();
    const listBox = await footer.getByRole("list").boundingBox();
    expect(nameBox).not.toBeNull();
    expect(listBox).not.toBeNull();
    if (!nameBox || !listBox) return;
    const nameCenter = nameBox.y + nameBox.height / 2;
    const listCenter = listBox.y + listBox.height / 2;
    expect(Math.abs(listCenter - nameCenter)).toBeLessThan(1);
    expect(listBox.x).toBeGreaterThan(nameBox.x + nameBox.width);
    const right = await contentRight(footer.locator("p"));
    expect(listBox.x + listBox.width).toBeCloseTo(right, 0);

    await open(page, "/", 360);
    const narrowName = await page
      .getByRole("contentinfo")
      .locator("p")
      .boundingBox();
    const narrowList = await page
      .getByRole("contentinfo")
      .getByRole("list")
      .boundingBox();
    expect(narrowName).not.toBeNull();
    expect(narrowList).not.toBeNull();
    if (!narrowName || !narrowList) return;
    expect(narrowList.y).toBeGreaterThanOrEqual(
      narrowName.y + narrowName.height - 1,
    );
  });
});
