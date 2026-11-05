import { expect, test, type Page } from "@playwright/test";

import { pagesForTheme, publishedPosts } from "./published-posts";
import { notFoundHeading } from "./site-literals";

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

type HeadingSample = {
  text: string;
  fontSize: string;
  lineHeight: string;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textWrapStyle: string;
};

async function headingSample(page: Page): Promise<HeadingSample | null> {
  return page.locator("h1").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      textWrapStyle: style.textWrapStyle,
    };
  });
}

function expectHeading(
  sample: HeadingSample | null,
  where: string,
  size: string,
  family: string,
  floor?: number,
) {
  expect(sample, where).not.toBeNull();
  if (!sample) return;
  expect(sample.fontSize, where).toBe(size);
  if (floor !== undefined) {
    expect(Number.parseFloat(sample.fontSize), where).toBeGreaterThanOrEqual(
      floor,
    );
  }
  expect(firstFamily(sample.fontFamily), where).toBe(family);
  expect(sample.fontWeight, where).toBe("600");
  expect(sample.fontStyle, where).toBe("normal");
  expect(sample.textWrapStyle, where).toBe("balance");
}

type LabelSample = {
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  textTransform: string;
  fontVariantCaps: string;
  letterSpacing: string;
};

async function exactParagraph(
  page: Page,
  root: string,
  text: string,
): Promise<LabelSample | null> {
  return page.locator(root).evaluate((scope, expected) => {
    const found = [...scope.querySelectorAll("p")].find((paragraph) => {
      return (
        (paragraph.textContent ?? "").replace(/\s+/g, " ").trim() === expected
      );
    });
    if (!found) return null;
    const style = getComputedStyle(found);
    return {
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      textTransform: style.textTransform,
      fontVariantCaps: style.fontVariantCaps,
      letterSpacing: style.letterSpacing,
    };
  }, text);
}

function expectLabel(
  sample: LabelSample | null,
  where: string,
  family: string,
) {
  expect(sample, where).not.toBeNull();
  if (!sample) return;
  expect(sample.fontSize, where).toBe("12px");
  expect(firstFamily(sample.fontFamily), where).toBe(family);
  expect(sample.fontWeight, where).toBe("400");
  expect(sample.textTransform, where).toBe("uppercase");
  expect(sample.fontVariantCaps, where).toBe("normal");
  const spacing = Number.parseFloat(sample.letterSpacing);
  const size = Number.parseFloat(sample.fontSize);
  const ratio = spacing / size;
  expect(ratio, where).toBeGreaterThanOrEqual(0.08);
  expect(ratio, where).toBeLessThanOrEqual(0.14);
}

test.describe("escala tipográfica [RNF-01]", () => {
  test("T1 h1", async ({ page }) => {
    const posts = await publishedPosts(page);
    const themePages = await pagesForTheme(page);
    const tag = themePages.find((path) => path.startsWith("/tags/"));
    expect(tag, "pagesForTheme sem página de tag").toBeTruthy();
    if (!tag) return;

    await page.setViewportSize({ width: 1280, height: 800 });
    const missing = await page.goto("/blog/nao-existe/");
    expect(missing?.status()).toBe(404);
    const gate = await headingSample(page);
    expect(gate?.text, "404").toBe(notFoundHeading);
    expect(gate?.textWrapStyle, "404").toBe("balance");

    const display = await variableFamily(page, "--font-plex-condensed");

    for (const post of posts) {
      const response = await page.goto(post.href);
      expect(response?.status(), post.href).toBe(200);
      const sample = await headingSample(page);
      expectHeading(sample, post.href, "80px", display);
      const lineHeight = Number.parseFloat(sample?.lineHeight ?? "");
      expect(Math.abs(lineHeight - 81.6), post.href).toBeLessThanOrEqual(0.5);
    }

    const tagResponse = await page.goto(tag);
    expect(tagResponse?.status(), tag).toBe(200);
    expectHeading(await headingSample(page), tag, "44px", display);

    const again = await page.goto("/blog/nao-existe/");
    expect(again?.status()).toBe(404);
    expectHeading(await headingSample(page), "404", "44px", display);

    await page.setViewportSize({ width: 800, height: 800 });
    for (const post of posts) {
      const response = await page.goto(post.href);
      expect(response?.status(), post.href).toBe(200);
      expectHeading(await headingSample(page), post.href, "44px", display);
    }

    await page.setViewportSize({ width: 360, height: 800 });
    for (const post of posts) {
      const response = await page.goto(post.href);
      expect(response?.status(), post.href).toBe(200);
      expectHeading(await headingSample(page), post.href, "36px", display, 28);
    }
    const tagNarrow = await page.goto(tag);
    expect(tagNarrow?.status(), tag).toBe(200);
    expectHeading(await headingSample(page), tag, "36px", display, 28);
    const missingNarrow = await page.goto("/blog/nao-existe/");
    expect(missingNarrow?.status()).toBe(404);
    expectHeading(await headingSample(page), "404", "36px", display, 28);
  });

  test("T2 rótulos", async ({ page }) => {
    const posts = await publishedPosts(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    const mono = await variableFamily(page, "--font-plex-mono");
    const names = ["Autor", "Leitura", "Tags"] as const;

    for (const post of posts) {
      const response = await page.goto(post.href);
      expect(response?.status(), post.href).toBe(200);
      for (const name of names) {
        expectLabel(
          await exactParagraph(page, "article header", name),
          `${post.href} ${name}`,
          mono,
        );
      }
    }

    const home = await page.goto("/");
    expect(home?.status()).toBe(200);
    expectLabel(
      await exactParagraph(page, "body", "Destaque"),
      "home Destaque",
      mono,
    );
  });

  test("T3 prosa", async ({ page }) => {
    const posts = await publishedPosts(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    const display = await variableFamily(page, "--font-plex-condensed");
    const sans = await variableFamily(page, "--font-plex-sans");
    let h3Count = 0;

    for (const post of posts) {
      const response = await page.goto(post.href);
      expect(response?.status(), post.href).toBe(200);
      await page.evaluate(() => document.fonts.ready);

      const measured = await page.locator(".prose").evaluate((prose) => {
        const style = getComputedStyle(prose);
        const paragraph = prose.querySelector("p");
        const paragraphStyle = paragraph ? getComputedStyle(paragraph) : null;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        let zero = 0;
        if (context) {
          context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          zero = context.measureText("0").width;
        }
        const maxWidth = Number.parseFloat(style.maxWidth);
        const headings = [...prose.querySelectorAll("h2, h3")].map((node) => {
          const headingStyle = getComputedStyle(node);
          return {
            tag: node.tagName,
            fontSize: headingStyle.fontSize,
            fontFamily: headingStyle.fontFamily,
            fontWeight: headingStyle.fontWeight,
            fontStyle: headingStyle.fontStyle,
            textWrapStyle: headingStyle.textWrapStyle,
          };
        });
        return {
          fontSize: style.fontSize,
          lineHeight: Number.parseFloat(style.lineHeight),
          paragraphFontSize: paragraphStyle?.fontSize ?? "",
          paragraphLineHeight: paragraphStyle
            ? Number.parseFloat(paragraphStyle.lineHeight)
            : Number.NaN,
          column: zero > 0 ? maxWidth / zero : Number.NaN,
          headings,
        };
      });

      const where = post.href;
      expect(measured.fontSize, where).toBe("18px");
      expect(Math.abs(measured.lineHeight - 29.7), where).toBeLessThanOrEqual(
        0.5,
      );
      expect(measured.paragraphFontSize, where).toBe("18px");
      expect(
        Math.abs(measured.paragraphLineHeight - 29.7),
        where,
      ).toBeLessThanOrEqual(0.5);
      expect(measured.column, where).toBeGreaterThanOrEqual(60);
      expect(measured.column, where).toBeLessThanOrEqual(70);

      const h2 = measured.headings.filter((heading) => heading.tag === "H2");
      expect(h2.length, where).toBeGreaterThanOrEqual(1);
      for (const heading of h2) {
        expect(heading.fontSize, where).toBe("30px");
        expect(firstFamily(heading.fontFamily), where).toBe(display);
        expect(heading.fontWeight, where).toBe("600");
        expect(heading.fontStyle, where).toBe("normal");
        expect(heading.textWrapStyle, where).toBe("balance");
      }

      for (const heading of measured.headings.filter(
        (item) => item.tag === "H3",
      )) {
        h3Count += 1;
        expect(heading.fontSize, where).toBe("22px");
        expect(firstFamily(heading.fontFamily), where).toBe(sans);
        expect(heading.fontWeight, where).toBe("600");
        expect(heading.textWrapStyle, where).toBe("balance");
      }
    }

    expect(h3Count).toBeGreaterThanOrEqual(1);
  });
});
