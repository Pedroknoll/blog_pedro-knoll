import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  figureMatrixVector,
  figureTensor,
  figureWidth,
  vizDataLabel,
} from "./site-literals";

const postB = "/blog/2026-10-como-o-blog-e-feito/";

const figures = [figureMatrixVector, figureTensor];

async function open(page: Page, href: string) {
  const response = await page.goto(href);
  expect(response?.status(), href).toBe(200);
}

async function box(locator: Locator) {
  const value = await locator.boundingBox();
  expect(value).not.toBeNull();
  if (!value) throw new Error("sem caixa");
  return value;
}

test.describe("figuras com moldura sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("moldura com legenda e dados [RF-09, RNF-04]", async ({ page }) => {
    await open(page, postB);

    const first = page.getByRole("img", {
      name: figureMatrixVector.summary,
      exact: true,
    });
    await expect(first).toHaveCount(1);

    for (const figure of figures) {
      const img = page.getByRole("img", {
        name: figure.summary,
        exact: true,
      });
      await expect(img).toHaveCount(1);
      expect(
        await img.evaluate(
          (element) => element.closest("astro-island") !== null,
        ),
      ).toBe(false);
      expect(
        await img.evaluate((element) => element.firstElementChild?.localName),
      ).toBe("title");
      await expect(img.locator("title")).toHaveText(figure.title);
      await expect(img).toHaveAttribute("data-viz", figure.name);
      await expect(img.locator("[data-grid]")).toHaveCount(1);
      expect(
        await img.locator("[data-dimension]").count(),
      ).toBeGreaterThanOrEqual(1);
      await expect(
        img.locator('[class~="fill-accent"], [class~="stroke-accent"]'),
      ).toHaveCount(1);
    }

    const captions = page.locator("figure:has(svg[data-viz]) > figcaption");
    await expect(captions).toHaveCount(2);
    await expect(captions.nth(0).locator("span")).toHaveText("Figura 1");
    await expect(captions.nth(1).locator("span")).toHaveText("Figura 2");
    for (const [index, figure] of figures.entries()) {
      const text = (await captions.nth(index).textContent()) ?? "";
      expect(text).toContain(figure.caption);
      expect(text).not.toContain(vizDataLabel);
    }

    const details = page.locator("figure:has(svg[data-viz]) + details");
    await expect(details).toHaveCount(2);
    for (const [index, figure] of figures.entries()) {
      const item = details.nth(index);
      await expect(item).not.toHaveAttribute("open");
      await expect(item.locator("summary")).toHaveText(vizDataLabel);
      await expect(item.locator("table th")).toHaveText([...figure.columns]);
      await expect(item.locator("table td")).toHaveText(figure.rows.flat());
    }
  });

  test("proporção e rótulo a 1280 e 360 [RF-09, RNF-02]", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, postB);

    const first = page.getByRole("img", {
      name: figureMatrixVector.summary,
      exact: true,
    });
    await expect(first).toHaveCount(1);

    const imgs = figures.map((figure) =>
      page.getByRole("img", { name: figure.summary, exact: true }),
    );
    for (const img of imgs) {
      await expect(img).toHaveCount(1);
      const rendered = await box(img);
      expect(Math.abs(rendered.width - figureWidth)).toBeLessThanOrEqual(1);
    }

    await page.setViewportSize({ width: 360, height: 800 });
    for (const img of imgs) {
      const ratio = await img.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const parts = (element.getAttribute("viewBox") ?? "")
          .trim()
          .split(/[\s,]+/)
          .map(Number);
        const vbWidth = parts[2] ?? 0;
        const vbHeight = parts[3] ?? 0;
        return Math.abs(rect.height - (rect.width * vbHeight) / vbWidth);
      });
      expect(ratio).toBeLessThanOrEqual(1);

      const scales = await img.locator("css=text").evaluateAll((nodes) =>
        nodes.map((node) => {
          const size = Number.parseFloat(getComputedStyle(node).fontSize);
          const matrix = (node as SVGGraphicsElement).getScreenCTM();
          return size * (matrix?.a ?? 0);
        }),
      );
      expect(scales.length).toBeGreaterThan(0);
      for (const scale of scales) expect(scale).toBeGreaterThanOrEqual(10);
    }

    const summaries = page.locator("figure + details > summary");
    await expect(summaries).toHaveCount(2);
    await expect(summaries.nth(0)).toHaveText(vizDataLabel);
    for (const index of [0, 1]) {
      const summary = await box(summaries.nth(index));
      expect(summary.height).toBeGreaterThanOrEqual(24);
    }
    await expect(
      page.locator("figure:has(svg[data-viz]) > figcaption span").nth(0),
    ).toHaveText("Figura 1");
  });
});
