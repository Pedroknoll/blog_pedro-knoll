import { expect, test, type Page } from "@playwright/test";

import { fixtureMd, fixtureMdx } from "./fixtures";
import {
  authorGithub,
  authorLinkedin,
  homeGreeting,
  siteTitle,
} from "./site-literals";

const articles = "/artigos/";

type Rail = {
  columnWidth: number;
  gap: number;
  contentInset: number;
  listInset: number;
  handTop: number;
  listTop: number;
  greetingTop: number;
  greetingBottom: number;
  greetingHeight: number;
  barTop: number;
  barBottom: number;
  position: string;
  top: string;
  gridBottom: number;
};

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

async function open(page: Page, path: string, width: number, height = 800) {
  await page.setViewportSize({ width, height });
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
}

async function readRail(page: Page): Promise<Rail> {
  return page.evaluate(() => {
    const greeting = document.querySelector("h1")?.parentElement ?? null;
    const column = greeting?.parentElement ?? null;
    const grid = column?.parentElement ?? null;
    const hand = document.querySelector('img[src="/avatar.jpg"]');
    const right = column?.nextElementSibling ?? null;
    const band = right?.querySelector("section") ?? null;
    const list = band?.querySelector("h2") ?? null;
    const greetingBox = greeting?.getBoundingClientRect();
    const barBox = band?.getBoundingClientRect();
    const rightBox = right?.getBoundingClientRect();
    const columnStyle = column ? getComputedStyle(column) : null;
    return {
      columnWidth: greetingBox?.width ?? Number.NaN,
      gap: greetingBox && barBox ? barBox.left - greetingBox.right : Number.NaN,
      contentInset:
        (document.querySelector("h1")?.getBoundingClientRect().left ??
          Number.NaN) - (greetingBox?.left ?? Number.NaN),
      listInset:
        (list?.getBoundingClientRect().left ?? Number.NaN) -
        (rightBox?.left ?? Number.NaN),
      handTop: hand?.getBoundingClientRect().top ?? Number.NaN,
      listTop: list?.getBoundingClientRect().top ?? Number.NaN,
      greetingTop: greetingBox?.top ?? Number.NaN,
      greetingBottom: greetingBox?.bottom ?? Number.NaN,
      greetingHeight: greetingBox?.height ?? Number.NaN,
      barTop: barBox?.top ?? Number.NaN,
      barBottom: barBox?.bottom ?? Number.NaN,
      position: columnStyle?.position ?? "",
      top: columnStyle?.top ?? "",
      gridBottom: grid?.getBoundingClientRect().bottom ?? Number.NaN,
    };
  });
}

async function handBelowHeader(page: Page): Promise<number> {
  return page.evaluate(() => {
    const header = document.querySelector("header");
    const hand = document.querySelector('img[src="/avatar.jpg"]');
    if (!header || !hand) throw new Error("sem header ou foto");
    return (
      hand.getBoundingClientRect().top - header.getBoundingClientRect().bottom
    );
  });
}

async function greetingLeft(page: Page): Promise<number> {
  return page.evaluate(() => {
    const greeting = document.querySelector("h1")?.parentElement;
    if (!greeting) throw new Error("sem saudação");
    return greeting.getBoundingClientRect().left;
  });
}

function authorList(page: Page) {
  return page.getByRole("list", { name: "Links do autor", exact: true });
}

test.describe("lateral da home [RF-01]", () => {
  test("H1 links do autor na home", async ({ page }) => {
    await open(page, "/", 1280);
    const authorLinks = authorList(page);
    await expect(authorLinks).toHaveCount(1);

    const links = authorLinks.getByRole("link");
    await expect(links.nth(0)).toHaveAccessibleName("GitHub");
    await expect(links.nth(1)).toHaveAccessibleName("LinkedIn");
    const arrows = await links.evaluateAll((nodes) =>
      nodes.map(
        (node) =>
          node.querySelector('[aria-hidden="true"]')?.textContent?.trim() ?? "",
      ),
    );
    expect(arrows).toEqual(["↗", "↗"]);
    await expect(links.nth(0)).toHaveAttribute("href", authorGithub);
    await expect(links.nth(1)).toHaveAttribute("href", authorLinkedin);
    await expect(authorLinks.locator('a[href="/rss.xml"]')).toHaveCount(0);

    const mono = await variableFamily(page, "--font-plex-mono");
    const ink = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.color = "var(--color-ink)";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    const count = await links.count();
    for (let index = 0; index < count; index += 1) {
      const link = links.nth(index);
      const family = firstFamily(
        await link.evaluate((node) => getComputedStyle(node).fontFamily),
      );
      expect(family).toBe(mono);
      await expect(link).toHaveCSS("font-size", "14px");
      const color = await link.evaluate((node) => getComputedStyle(node).color);
      expect(color).toBe(ink);
      await expect(link).toHaveCSS("text-transform", "none");
      const height = await link.evaluate(
        (node) => node.getBoundingClientRect().height,
      );
      expect(height).toBeGreaterThanOrEqual(44);
      expect(await link.getAttribute("target")).toBeNull();
    }
  });

  test("H12 Assinar via RSS com contorno", async ({ page }) => {
    await open(page, "/", 1280);
    const main = page.getByRole("main");
    const rss = main.getByRole("link", {
      name: "Assinar via RSS",
      exact: true,
    });
    await expect(rss).toHaveCount(1);
    await expect(rss).toHaveAttribute("href", "/rss.xml");
    expect(await rss.getAttribute("target")).toBeNull();
    const rssBox = await rss.boundingBox();
    const listBox = await authorList(page).boundingBox();
    expect(
      rssBox && listBox ? rssBox.y + rssBox.height : NaN,
    ).toBeLessThanOrEqual(listBox?.y ?? NaN);

    const mono = await variableFamily(page, "--font-plex-mono");
    for (const width of [1280, 360] as const) {
      await page.setViewportSize({ width, height: 800 });
      const measured = await rss.evaluate((node) => {
        const style = getComputedStyle(node);
        const probe = document.createElement("span");
        probe.style.color = "var(--color-ink)";
        document.body.append(probe);
        const ink = getComputedStyle(probe).color;
        probe.remove();
        return {
          family: style.fontFamily,
          weight: style.fontWeight,
          color: style.color,
          borderWidth: style.borderTopWidth,
          borderStyle: style.borderTopStyle,
          borderColor: style.borderTopColor,
          background: style.backgroundColor,
          radius: style.borderTopLeftRadius,
          height: node.getBoundingClientRect().height,
          decoration: style.textDecorationLine,
          ink,
        };
      });
      const where = String(width);
      expect.soft(firstFamily(measured.family), where).toBe(mono);
      expect.soft(measured.weight, where).toBe("400");
      expect.soft(measured.color, where).toBe(measured.ink);
      expect.soft(measured.borderWidth, where).toBe("1px");
      expect.soft(measured.borderStyle, where).toBe("solid");
      expect.soft(measured.borderColor, where).toBe(measured.ink);
      expect.soft(measured.background, where).toBe("rgba(0, 0, 0, 0)");
      expect.soft(measured.radius, where).toBe("6px");
      expect.soft(measured.height, where).toBeGreaterThanOrEqual(44);
      expect.soft(measured.decoration, where).toBe("none");
    }
    const icon = rss.locator("svg");
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    const iconBox = await icon.boundingBox();
    expect(iconBox?.width).toBe(12);
    expect(iconBox?.height).toBe(12);
    await rss.hover();
    await expect(rss).toHaveCSS("text-decoration-line", "underline");
  });

  test("H2 artigos sem saudação", async ({ page }) => {
    await open(page, articles, 1280);
    await expect(authorList(page)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: homeGreeting, exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: "Artigos", exact: true }),
    ).toHaveCount(1);
  });

  test("H3 grade da home", async ({ page }) => {
    await open(page, "/", 1280);
    const at1280 = await readRail(page);
    expect.soft(at1280.columnWidth, "1280 coluna").toBeCloseTo(240, 0);
    expect.soft(at1280.gap, "1280 vão").toBeCloseTo(96, 0);
    expect
      .soft(at1280.contentInset, "1280 saudacao encostada")
      .toBeCloseTo(0, 0);
    expect.soft(at1280.listInset, "1280 barra encostada").toBeCloseTo(0, 0);
    expect
      .soft(Math.abs(at1280.handTop - at1280.listTop), "1280 foto")
      .toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 1024, height: 800 });
    const at1024 = await readRail(page);
    expect
      .soft(at1024.columnWidth, "1024 coluna")
      .toBeCloseTo(at1280.columnWidth, 0);
  });

  test("H4 artigos sem saudação e sem barra", async ({ page }) => {
    await open(page, articles, 1280);
    await expect(
      page.getByRole("heading", { name: homeGreeting, exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "Filtrar por tipo", exact: true }),
    ).toHaveCount(0);
  });

  test("H5 saudação gruda ao rolar", async ({ page }) => {
    await open(page, "/", 1280, 400);
    const before = await readRail(page);
    expect.soft(before.position, "position").toBe("sticky");
    expect.soft(before.top, "top").toBe("0px");
    if (before.position !== "sticky" || before.top !== "0px") return;

    const requested = before.greetingTop + 40;
    expect(
      before.gridBottom - before.greetingHeight,
      "a página é curta demais",
    ).toBeGreaterThan(requested);

    const scrollY = await page.evaluate((y) => {
      window.scrollTo(0, y);
      return window.scrollY;
    }, requested);
    expect(scrollY, "a página é curta demais").toBe(requested);

    const after = await readRail(page);
    const rise = before.barTop - after.barTop;
    expect({
      saudacao: Math.abs(after.greetingTop) <= 1 ? 0 : after.greetingTop,
      subida: Math.abs(rise - scrollY) <= 1 ? scrollY : rise,
    }).toEqual({ saudacao: 0, subida: scrollY });
  });

  test("H6 abaixo de lg", async ({ page }) => {
    for (const width of [1023, 360] as const) {
      await test.step(String(width), async () => {
        await open(page, "/", width);
        await expect.soft(authorList(page), String(width)).toHaveCount(1);

        const rail = await readRail(page);
        if (width === 1023) {
          expect(rail.position, String(width)).not.toBe("sticky");
        }
        if (width === 360) {
          expect(rail.greetingBottom <= rail.barTop + 1, String(width)).toBe(
            true,
          );
        }
      });
    }
  });

  test("H11 respiro acima da lateral", async ({ page }) => {
    await open(page, "/", 1023);
    const below = await handBelowHeader(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    const above = await handBelowHeader(page);
    expect.soft(above - below, "foto").toBeCloseTo(56, 0);
  });

  test("H7a header alinhado à saudação a 1440", async ({ page }) => {
    await open(page, "/", 1440);
    const greeting = await greetingLeft(page);
    const link = page.getByRole("banner").getByRole("link", {
      name: siteTitle,
      exact: true,
    });
    await expect(link).toHaveCount(1);
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    expect(box.x).toBeCloseTo(greeting, 0);
  });

  test("H7b footer alinhado à saudação a 1440", async ({ page }) => {
    await open(page, "/", 1440);
    const greeting = await greetingLeft(page);
    const paragraph = page.getByRole("contentinfo").locator("p").first();
    await expect(paragraph).toHaveCount(1);
    const box = await paragraph.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    expect(box.x).toBeCloseTo(greeting, 0);
  });

  test("H7c lateral do post alinhada à saudação a 1440", async ({ page }) => {
    await open(page, "/", 1440);
    const greeting = await greetingLeft(page);
    await open(page, fixtureMd.href, 1440);
    const rail = page.locator("[data-post-rail]");
    await expect(rail).toHaveCount(1);
    const box = await rail.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    expect(box.x).toBeCloseTo(greeting, 0);
  });

  test("H8 header e footer a 16 px no celular", async ({ page }) => {
    await open(page, "/", 360);
    const edges = await page.evaluate(() => {
      const link = document.querySelector("header a");
      const paragraph = document.querySelector("footer p");
      if (!link || !paragraph) throw new Error("sem header ou footer");
      return {
        link: link.getBoundingClientRect().left,
        paragraph: paragraph.getBoundingClientRect().left,
      };
    });
    expect(edges.link).toBeCloseTo(16, 0);
    expect(edges.paragraph).toBeCloseTo(16, 0);
  });

  test("H10 largura do apêndice a 1440", async ({ page }) => {
    await open(page, fixtureMdx.href, 1440);
    const inner = page
      .getByRole("region", { name: "Apêndice", exact: true })
      .locator(":scope > div");
    await expect(inner).toHaveCount(1);
    await expect(inner).toHaveCSS("max-width", "1152px");
  });
});
