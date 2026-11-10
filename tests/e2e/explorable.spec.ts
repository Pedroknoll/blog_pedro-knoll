import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  heatFigure,
  stepFigure,
  vizDataLabel,
  vizNext,
  vizPrevious,
} from "./site-literals";

const postB = "/blog/2026-10-como-o-blog-e-feito/";

type Framed = {
  name: string;
  title: string;
  summary: string;
  caption: string;
  columns: readonly string[];
  rows: readonly (readonly string[])[];
};

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

function imgNamed(page: Page, summary: string) {
  return page.getByRole("img", { name: summary, exact: true });
}

function islandWith(page: Page, summary: string) {
  return page.locator("astro-island").filter({
    has: imgNamed(page, summary),
  });
}

function stepLive(index: number): string {
  const text = stepFigure.live[index];
  if (text === undefined) throw new Error(`sem texto do passo ${index}`);
  return text;
}

async function expectIslandFigure(
  page: Page,
  spec: Framed,
  numberLabel: string,
) {
  const img = imgNamed(page, spec.summary);
  await expect(img).toHaveCount(1);
  expect(
    await img.evaluate((element) => {
      const island = element.closest("astro-island");
      const figure = element.closest("figure");
      return island !== null && figure !== null && figure.contains(island);
    }),
  ).toBe(true);
  expect(
    await img.evaluate((element) => element.firstElementChild?.localName),
  ).toBe("title");
  await expect(img.locator("title")).toHaveText(spec.title);
  await expect(img).toHaveAttribute("aria-label", spec.summary);
  await expect(img).toHaveAttribute("data-viz", spec.name);

  const figure = page.locator("figure").filter({ has: img });
  await expect(figure).toHaveCount(1);
  expect(
    await figure.evaluate((element) => element.lastElementChild?.localName),
  ).toBe("figcaption");
  await expect(figure.locator("figcaption span")).toHaveText(numberLabel);
  const caption = (await figure.locator("figcaption").textContent()) ?? "";
  expect(caption).toContain(spec.caption);
  expect(caption).not.toContain(vizDataLabel);

  const details = page.locator(
    `figure:has(svg[data-viz="${spec.name}"]) + details`,
  );
  await expect(details).toHaveCount(1);
  await expect(details).not.toHaveAttribute("open");
  await expect(details.locator("summary")).toHaveText(vizDataLabel);
  await expect(details.locator("table th")).toHaveText([...spec.columns]);
  await expect(details.locator("table td")).toHaveText(spec.rows.flat());

  await expect(img.locator("[data-highlight]")).toHaveCount(1);
  await expect(
    img.locator('[class~="fill-accent"], [class~="stroke-accent"]'),
  ).toHaveCount(1);
}

async function expectDistinctPatterns(page: Page) {
  const ids = await page
    .locator("pattern")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("id")));
  expect(ids).toHaveLength(4);
  for (const id of ids) expect(id).toBeTruthy();
  expect(new Set(ids).size).toBe(ids.length);
}

async function expectLabelScale(img: Locator) {
  const scales = await img.locator("css=text").evaluateAll((nodes) =>
    nodes.map((node) => {
      const size = Number.parseFloat(getComputedStyle(node).fontSize);
      const matrix = (node as SVGGraphicsElement).getScreenCTM();
      return size * Math.hypot(matrix?.a ?? 0, matrix?.b ?? 0);
    }),
  );
  expect(scales.length).toBeGreaterThan(0);
  for (const scale of scales) expect(scale).toBeGreaterThanOrEqual(10);
}

async function expectAspect(img: Locator) {
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
}

async function figureHeight(page: Page, summary: string) {
  await page.evaluate(() => document.fonts.ready);
  return (
    await box(page.locator("figure").filter({ has: imgNamed(page, summary) }))
  ).height;
}

test.describe("exploráveis sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("moldura, dados e controles no HTML [RF-09, RNF-04, RNF-13]", async ({
    page,
  }) => {
    await open(page, postB);
    await expectIslandFigure(page, stepFigure, "Figura 3");
    await expectIslandFigure(page, heatFigure, "Figura 4");

    const islands = page.locator("astro-island");
    await expect(islands).toHaveCount(3);
    for (const island of await islands.all()) {
      await expect(island).toHaveAttribute("client", "visible");
    }
    await expect(page.getByRole("button")).toHaveCount(4);

    const stepIsland = islandWith(page, stepFigure.summary);
    await expect(
      stepIsland.getByRole("button", { name: vizPrevious, exact: true }),
    ).toBeDisabled();
    await expect(
      stepIsland.getByRole("button", { name: vizNext, exact: true }),
    ).toBeDisabled();
    await expect(stepIsland.locator("[aria-live='polite']")).toHaveText(
      stepLive(0),
    );

    const heatIsland = islandWith(page, heatFigure.summary);
    await expect(
      heatIsland.getByRole("slider", {
        name: heatFigure.queryLabel,
        exact: true,
      }),
    ).toBeDisabled();
    await expect(heatIsland.locator("[aria-live='polite']")).toHaveText(
      heatFigure.liveFirst,
    );

    const opacities = await imgNamed(page, heatFigure.summary)
      .locator("[data-cell]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("fill-opacity")),
      );
    expect(opacities).toEqual(heatFigure.opacities);

    await expectDistinctPatterns(page);
  });

  test("rótulo a 360 [RF-09, RNF-02]", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, postB);
    const stepImg = imgNamed(page, stepFigure.summary);
    await expect(stepImg).toHaveCount(1);
    const heatImg = imgNamed(page, heatFigure.summary);
    await expect(heatImg).toHaveCount(1);
    await expectLabelScale(stepImg);
    await expectLabelScale(heatImg);
  });

  test("movimento reduzido tira a transição [RNF-02]", async ({ page }) => {
    await open(page, postB);
    const stepImg = imgNamed(page, stepFigure.summary);
    await expect(stepImg).toHaveCount(1);
    const index = await stepImg
      .locator("rect")
      .evaluateAll((nodes) =>
        nodes.findIndex((node) => node.classList.contains("transition-colors")),
      );
    expect(index).toBeGreaterThanOrEqual(0);
    const rect = stepImg.locator("rect").nth(index);
    expect(
      await rect.evaluate(
        (element) => getComputedStyle(element).transitionProperty,
      ),
    ).toContain("fill");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await rect.evaluate(
        (element) => getComputedStyle(element).transitionProperty,
      ),
    ).toBe("none");
  });

  test("alvos dos controles [RF-09]", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, postB);
    const stepImg = imgNamed(page, stepFigure.summary);
    await expect(stepImg).toHaveCount(1);
    const stepIsland = islandWith(page, stepFigure.summary);
    for (const name of [vizPrevious, vizNext]) {
      const button = stepIsland.getByRole("button", { name, exact: true });
      await expect(button).toHaveCount(1);
      expect((await box(button)).height).toBeGreaterThanOrEqual(32);
    }
    const range = islandWith(page, heatFigure.summary).getByRole("slider", {
      name: heatFigure.queryLabel,
      exact: true,
    });
    await expect(range).toHaveCount(1);
    expect((await box(range)).height).toBeGreaterThanOrEqual(24);
  });
});

test("hidrata ao rolar até a figura [RF-09, RNF-02]", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const requested: string[] = [];
  page.on("request", (request) => {
    requested.push(new URL(request.url()).pathname);
  });
  await open(page, postB);

  const stepImg = imgNamed(page, stepFigure.summary);
  await expect(stepImg).toHaveCount(1);
  const heatImg = imgNamed(page, heatFigure.summary);
  await expect(heatImg).toHaveCount(1);

  const stepIsland = islandWith(page, stepFigure.summary);
  const heatIsland = islandWith(page, heatFigure.summary);
  const stepUrl = await stepIsland.getAttribute("component-url");
  const heatUrl = await heatIsland.getAttribute("component-url");
  expect(stepUrl).toBeTruthy();
  expect(heatUrl).toBeTruthy();
  if (!stepUrl || !heatUrl) return;
  const stepPath = new URL(stepUrl, page.url()).pathname;
  const heatPath = new URL(heatUrl, page.url()).pathname;
  expect(requested.includes(stepPath)).toBe(false);
  expect(requested.includes(heatPath)).toBe(false);

  async function reveal(img: Locator, componentPath: string) {
    const pending = requested.includes(componentPath)
      ? null
      : page.waitForRequest(
          (request) => new URL(request.url()).pathname === componentPath,
        );
    await img.scrollIntoViewIfNeeded();
    if (pending) await pending;
  }

  await reveal(stepImg, stepPath);
  const stepMark = stepImg.locator("[data-highlight]");
  await expect(stepMark).toHaveCount(1);
  await expect(stepMark).toHaveAttribute("x", "0");
  await expect(stepMark).toHaveAttribute("y", "0");
  const previous = stepIsland.getByRole("button", {
    name: vizPrevious,
    exact: true,
  });
  const next = stepIsland.getByRole("button", { name: vizNext, exact: true });
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  const live = stepIsland.locator("[aria-live='polite']");
  await expect(live).toHaveText(stepLive(0));
  await next.click();
  await expect(live).toHaveText(stepLive(1));
  await expect(stepMark).toHaveAttribute("x", "28");
  await expect(stepMark).toHaveAttribute("y", "0");
  await next.click();
  await expect(live).toHaveText(stepLive(2));
  await expect(stepMark).toHaveAttribute("x", "28");
  await expect(stepMark).toHaveAttribute("y", "28");
  await expect(next).toBeDisabled();
  await previous.click();
  await expect(live).toHaveText(stepLive(1));
  await expect(stepMark).toHaveAttribute("x", "28");
  await expect(stepMark).toHaveAttribute("y", "0");
  await previous.click();
  await expect(live).toHaveText(stepLive(0));
  await expect(stepMark).toHaveAttribute("x", "0");
  await expect(stepMark).toHaveAttribute("y", "0");
  await expect(previous).toBeDisabled();

  await reveal(heatImg, heatPath);
  const range = heatIsland.getByRole("slider", {
    name: heatFigure.queryLabel,
    exact: true,
  });
  await expect(range).toBeEnabled();
  const highlight = heatImg.locator("[data-highlight]");
  await expect(highlight).toHaveAttribute("y", "71");
  await range.focus();
  await page.keyboard.press("ArrowRight");
  await expect(highlight).toHaveAttribute("y", "99");
  await expect(heatIsland.locator("[aria-live='polite']")).toHaveText(
    heatFigure.liveSecond,
  );

  await expectDistinctPatterns(page);
});

test("altura estável ao hidratar [RNF-02]", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page, postB);
  const stepImg = imgNamed(page, stepFigure.summary);
  await expect(stepImg).toHaveCount(1);

  expect(baseURL).toBeTruthy();
  if (!baseURL) return;

  const noJs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 360, height: 800 },
    baseURL,
  });
  try {
    const plain = await noJs.newPage();
    await open(plain, postB);

    const cases = [
      {
        summary: stepFigure.summary,
        ready: islandWith(page, stepFigure.summary).getByRole("button", {
          name: vizNext,
          exact: true,
        }),
        width: stepFigure.width,
      },
      {
        summary: heatFigure.summary,
        ready: islandWith(page, heatFigure.summary).getByRole("slider", {
          name: heatFigure.queryLabel,
          exact: true,
        }),
        width: heatFigure.width,
      },
    ];

    for (const item of cases) {
      await imgNamed(page, item.summary).scrollIntoViewIfNeeded();
      await expect(item.ready).toBeEnabled();
      const withJs = await figureHeight(page, item.summary);
      const withoutJs = await figureHeight(plain, item.summary);
      expect(Math.abs(withJs - withoutJs)).toBeLessThanOrEqual(0.5);
    }

    for (const target of [page, plain]) {
      for (const item of cases) {
        await expectAspect(imgNamed(target, item.summary));
      }
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    await plain.setViewportSize({ width: 1280, height: 800 });
    for (const target of [page, plain]) {
      for (const item of cases) {
        const rendered = await box(imgNamed(target, item.summary));
        expect(Math.abs(rendered.width - item.width)).toBeLessThanOrEqual(1);
      }
    }
  } finally {
    await noJs.close();
  }
});
