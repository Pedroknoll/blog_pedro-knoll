import { expect, test, type Locator, type Page } from "@playwright/test";

import { pagesForTheme } from "./published-posts";
import { authorName } from "./site-literals";

const mark = "pk.log";
const displayVariable = "--font-cormorant";
const monoVariable = "--font-plex-mono";
const iconHrefs = [
  "/favicon.svg",
  "/favicon.ico",
  "/apple-touch-icon.png",
] as const;

type IconLink = {
  href: string | null;
  type: string | null;
  sizes: string | null;
};

type Computed = {
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  fontSize: string;
  display: string;
  whiteSpace: string;
};

function unquote(name: string): string {
  const trimmed = name.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

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

async function familyFromVariable(
  page: Page,
  cssVariable: string,
): Promise<string> {
  const value = await page.evaluate((variable) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
  }, cssVariable);
  expect(value, cssVariable).not.toBe("");
  const first = familyNames(value)[0] ?? "";
  expect(first, cssVariable).not.toBe("");
  return first;
}

async function open(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
}

async function computed(locator: Locator): Promise<Computed> {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      fontSize: style.fontSize,
      display: style.display,
      whiteSpace: style.whiteSpace,
    };
  });
}

function firstFamily(stack: string): string {
  return familyNames(stack)[0] ?? "";
}

test.describe("assinatura [RF-12, RNF-04]", () => {
  test("W1 link no banner", async ({ page }) => {
    const pages = await pagesForTheme(page);

    for (const path of pages) {
      await test.step(path, async () => {
        await open(page, path);
        const named = page
          .getByRole("banner")
          .getByRole("link", { name: mark, exact: true });
        await expect(named, path).toHaveCount(1);
        await expect.soft(named, path).toHaveAttribute("href", "/");
        await expect.soft(named, path).toHaveText(mark);
      });
    }
  });

  test("W2 desenho", async ({ page }) => {
    const pages = await pagesForTheme(page);

    for (const path of pages) {
      await test.step(path, async () => {
        await open(page, path);
        const named = page
          .getByRole("banner")
          .getByRole("link", { name: mark, exact: true });
        const nome = named.locator(".nome");
        const em = nome.locator("em");
        const ponto = nome.locator(".ponto");
        const ext = nome.locator(".ext");
        await expect(nome, path).toHaveCount(1);
        await expect(em, path).toHaveCount(1);
        await expect(ponto, path).toHaveCount(1);
        await expect(ext, path).toHaveCount(1);

        const display = await familyFromVariable(page, displayVariable);
        const mono = await familyFromVariable(page, monoVariable);
        const emStyle = await computed(em);
        const nomeStyle = await computed(nome);

        expect
          .soft(firstFamily(emStyle.fontFamily), `${path} em`)
          .toBe(display);
        expect.soft(emStyle.fontWeight, `${path} em`).toBe("600");
        expect.soft(emStyle.fontStyle, `${path} em`).toBe("normal");
        expect.soft(nomeStyle.whiteSpace, `${path} nome`).toBe("nowrap");

        for (const part of [
          { locator: ponto, label: "ponto" },
          { locator: ext, label: "ext" },
        ]) {
          const style = await computed(part.locator);
          const where = `${path} ${part.label}`;
          expect.soft(firstFamily(style.fontFamily), where).toBe(mono);
          expect.soft(style.fontWeight, where).toBe("400");
          expect.soft(style.fontStyle, where).toBe("normal");
          const ratio =
            Number.parseFloat(style.fontSize) /
            Number.parseFloat(nomeStyle.fontSize);
          expect.soft(ratio, where).toBeCloseTo(0.8, 2);
        }

        const colors = await ponto.evaluate((el) => {
          const current = getComputedStyle(el).color;
          el.style.color = "var(--color-accent)";
          const probe = getComputedStyle(el).color;
          el.style.removeProperty("color");
          return { current, probe };
        });
        expect.soft(colors.current, `${path} ponto`).toBe(colors.probe);
        const extColor = await ext.evaluate((el) => getComputedStyle(el).color);
        expect.soft(colors.probe, `${path} ponto`).not.toBe(extColor);

        for (const part of [
          { locator: em, label: "em" },
          { locator: ponto, label: "ponto" },
          { locator: ext, label: "ext" },
        ]) {
          const style = await computed(part.locator);
          expect.soft(style.display, `${path} ${part.label}`).toBe("inline");
        }
      });
    }
  });

  test("W3 face 600 normal carregada", async ({ page }) => {
    const pages = await pagesForTheme(page);

    for (const path of pages) {
      await test.step(path, async () => {
        await open(page, path);
        const family = await familyFromVariable(page, displayVariable);
        const faces = await page.evaluate(async () => {
          await document.fonts.ready;
          return [...document.fonts].map((face) => ({
            family: face.family,
            weight: face.weight,
            style: face.style,
            status: face.status,
          }));
        });
        const loaded = faces.some(
          (face) =>
            unquote(face.family) === family &&
            face.weight.trim() === "600" &&
            face.style === "normal" &&
            face.status === "loaded",
        );
        expect.soft(loaded, path).toBe(true);
      });
    }
  });

  test("W4 favicons", async ({ page }) => {
    const pages = await pagesForTheme(page);

    for (const path of pages) {
      await test.step(path, async () => {
        await open(page, path);
        const icons: IconLink[] = await page
          .locator('link[rel="icon"]')
          .evaluateAll((nodes) =>
            nodes.map((node) => ({
              href: node.getAttribute("href"),
              type: node.getAttribute("type"),
              sizes: node.getAttribute("sizes"),
            })),
          );
        expect.soft(icons.length, `${path} icon`).toBe(2);
        if (icons.length === 2) {
          const svg = icons.find((icon) => icon.href === "/favicon.svg");
          const ico = icons.find((icon) => icon.href === "/favicon.ico");
          expect.soft(svg?.type ?? null, `${path} svg`).toBe("image/svg+xml");
          expect.soft(ico?.sizes ?? null, `${path} ico`).toBe("32x32");
        }

        const apples = await page
          .locator('link[rel="apple-touch-icon"]')
          .evaluateAll((nodes) =>
            nodes.map((node) => node.getAttribute("href")),
          );
        expect.soft(apples.length, `${path} apple-touch-icon`).toBe(1);
        if (apples.length === 1) {
          expect.soft(apples[0], path).toBe("/apple-touch-icon.png");
        }

        expect
          .soft(
            await page.locator('link[href="/favicon-16.png"]').count(),
            path,
          )
          .toBe(0);
        expect
          .soft(
            await page.locator('link[href="/favicon-32.png"]').count(),
            path,
          )
          .toBe(0);
      });
    }

    for (const href of iconHrefs) {
      const response = await page.request.get(href);
      const body = await response.body();
      expect.soft(response.status(), href).toBe(200);
      expect.soft(body.length, href).toBeGreaterThan(0);
      if (href === "/favicon.svg") {
        expect
          .soft(response.headers()["content-type"] ?? "", href)
          .toContain("image/svg+xml");
      }
    }
  });

  test("W5 rodapé", async ({ page }) => {
    const pages = await pagesForTheme(page);

    for (const path of pages) {
      await test.step(path, async () => {
        await open(page, path);
        const footer = page.getByRole("contentinfo");
        await expect(footer, path).toHaveCount(1);
        await expect
          .soft(footer.getByRole("link", { name: mark, exact: true }), path)
          .toHaveCount(0);
        await expect
          .soft(footer.getByText(authorName, { exact: true }), path)
          .toHaveText(authorName);
      });
    }
  });
});
