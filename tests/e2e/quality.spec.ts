import { createRequire } from "node:module";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { fixtureFormulas, fixtureMdx } from "./fixtures";
import { pagesForTheme, publishedPosts } from "./published-posts";

const loadConfig = createRequire(import.meta.url);
const lighthouseConfig = "../../lighthouserc.cjs";

type LighthouseConfig = {
  ci: {
    collect: {
      url: string[];
      numberOfRuns: number;
      staticDistDir: string;
    };
    assert: {
      assertions: unknown;
    };
  };
};

function loadLighthouseConfig() {
  const resolved = loadConfig.resolve(lighthouseConfig);
  delete loadConfig.cache[resolved];
  return loadConfig(lighthouseConfig) as LighthouseConfig;
}

function pathnameOf(url: string) {
  return new URL(url).pathname;
}

async function open(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
}

// Chrome conta o ponto se ele muda pelo menos 3 px (https://wicg.github.io/layout-instability).
const PIXELS_TO_SIGNIFICANCE = 3;

type VisibleBox = {
  index: number;
  tag: string;
  classes: string;
  top: number;
};

function holdsAstroWoff2(url: URL) {
  return url.pathname.startsWith("/_astro/") && url.pathname.endsWith(".woff2");
}

function clsAttachmentName(path: string) {
  const slug =
    path === "/" ? "home" : path.split("/").filter(Boolean).join("-");
  return `cls-${slug}.json`;
}

async function h1OffsetHeight(page: Page) {
  return page
    .locator("h1")
    .first()
    .evaluate((element) => (element as HTMLElement).offsetHeight);
}

async function visibleBoxes(page: Page) {
  return page.evaluate(() => {
    const elements = [...document.querySelectorAll("body *")];
    const boxes: VisibleBox[] = [];
    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (!(rect.bottom > 0 && rect.top < innerHeight)) continue;
      boxes.push({
        index,
        tag: element.tagName,
        classes: element.getAttribute("class") ?? "",
        top: rect.top,
      });
    }
    return { total: elements.length, boxes };
  });
}

async function topsAt(page: Page, indexes: number[]) {
  return page.evaluate((indexes) => {
    const elements = [...document.querySelectorAll("body *")];
    return {
      total: elements.length,
      tops: indexes.map((index) => {
        const element = elements[index];
        return element ? element.getBoundingClientRect().top : null;
      }),
      fallbackFaces: [...document.fonts]
        .filter((face) => face.family.includes("fallback:"))
        .map((face) => ({ family: face.family, status: face.status })),
    };
  }, indexes);
}

test.describe("qualidade por post [RNF-01, RNF-04, RNF-14]", () => {
  test("a lista do Lighthouse é a home e cada post publicado", async ({
    page,
  }) => {
    const config = loadLighthouseConfig();
    const posts = await publishedPosts(page);
    const fromConfig = config.ci.collect.url.map(pathnameOf);
    const fromSite = ["/", ...posts.map((post) => post.href)];

    expect([...fromConfig].sort()).toEqual([...fromSite].sort());
    expect(fromConfig[0]).toBe("/");
    expect(fromConfig.slice(1)).toEqual([...fromConfig.slice(1)].sort());
    expect(config.ci.collect.numberOfRuns).toBe(5);
    expect(config.ci.collect.staticDistDir).toBe("./dist");
  });

  test("a lista do Lighthouse no escopo fixtures é cada post fixture", async ({
    page,
  }) => {
    const previousScope = process.env.LIGHTHOUSE_SCOPE;
    const previousDist = process.env.LIGHTHOUSE_DIST;
    try {
      delete process.env.LIGHTHOUSE_SCOPE;
      delete process.env.LIGHTHOUSE_DIST;
      const plain = loadLighthouseConfig();

      process.env.LIGHTHOUSE_SCOPE = "fixtures";
      process.env.LIGHTHOUSE_DIST = "dist";
      const config = loadLighthouseConfig();
      const posts = await publishedPosts(page);
      const fixtures = posts
        .map((post) => post.href)
        .filter((href) => href.startsWith("/blog/fixture-"))
        .sort();
      const fromConfig = config.ci.collect.url.map(pathnameOf);

      expect(fromConfig).toEqual(fixtures);
      expect(fromConfig).not.toContain("/");
      expect(fromConfig).toEqual([...fromConfig].sort());
      expect(config.ci.collect.numberOfRuns).toBe(5);
      expect(config.ci.collect.staticDistDir).toBe("./dist");
      expect(config.ci.assert.assertions).toEqual(plain.ci.assert.assertions);
    } finally {
      if (previousScope === undefined) delete process.env.LIGHTHOUSE_SCOPE;
      else process.env.LIGHTHOUSE_SCOPE = previousScope;
      if (previousDist === undefined) delete process.env.LIGHTHOUSE_DIST;
      else process.env.LIGHTHOUSE_DIST = previousDist;
    }
  });

  test("axe sem violações serious nem critical em cada página publicada", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const paths = await pagesForTheme(page);
    test.setTimeout(60_000 + paths.length * 30_000);

    for (const path of paths) {
      await test.step(path, async () => {
        await open(page, path);
        const results = await new AxeBuilder({ page }).analyze();
        const blocking = results.violations.filter(
          (violation) =>
            violation.impact === "serious" || violation.impact === "critical",
        );
        expect(blocking.map((violation) => violation.id)).toEqual([]);
      });
    }
  });

  test.describe("CLS com a fonte web atrasada [RNF-01]", () => {
    test.use({
      viewport: { width: 412, height: 823 },
      deviceScaleFactor: 1.75,
      isMobile: true,
    });

    test("nenhum elemento visível muda de posição vertical quando as fontes chegam", async ({
      page,
    }, testInfo) => {
      const posts = await publishedPosts(page);
      const paths = ["/", ...posts.map((post) => post.href)];

      let gateOpen = false;
      const held: Array<{ resume: () => void }> = [];

      await page.route(holdsAstroWoff2, async (route) => {
        if (gateOpen) {
          await route.continue();
          return;
        }
        await new Promise<void>((resolve) => {
          held.push({ resume: resolve });
        });
        try {
          await route.continue();
        } catch {
          // A navegação cancelou o pedido.
        }
      });

      const releaseHeld = () => {
        const batch = held.splice(0);
        for (const font of batch) font.resume();
      };
      const closeGate = () => {
        gateOpen = false;
        releaseHeld();
      };
      const openGate = () => {
        gateOpen = true;
        releaseHeld();
      };

      for (const path of paths) {
        await test.step(path, async () => {
          closeGate();
          const response = await page.goto(path, {
            waitUntil: "domcontentloaded",
          });
          expect(response?.status()).toBe(200);
          await page.waitForFunction(
            () =>
              performance.getEntriesByName("first-contentful-paint").length > 0,
          );

          const heldWoff2 = held.length;
          expect.soft(heldWoff2, `${path} .woff2 presos`).toBeGreaterThan(0);
          const h1Before = await h1OffsetHeight(page);
          const before = await visibleBoxes(page);

          openGate();
          await page.evaluate(() => document.fonts.ready);
          await page.evaluate(
            () =>
              new Promise<void>((resolve) => {
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => resolve());
                });
              }),
          );

          const h1After = await h1OffsetHeight(page);
          const after = await topsAt(
            page,
            before.boxes.map((box) => box.index),
          );
          expect.soft(after.total, `${path} body *`).toBe(before.total);

          const deltas = [];
          for (let index = 0; index < before.boxes.length; index += 1) {
            const box = before.boxes[index];
            const topAfter = after.tops[index];
            if (!box || typeof topAfter !== "number" || topAfter === box.top) {
              continue;
            }
            deltas.push({
              tag: box.tag,
              classes: box.classes,
              topBefore: box.top,
              topAfter,
              delta: topAfter - box.top,
            });
          }
          const moved = deltas.filter(
            (entry) => Math.abs(entry.delta) >= PIXELS_TO_SIGNIFICANCE,
          );

          await testInfo.attach(clsAttachmentName(path), {
            body: JSON.stringify(
              {
                path,
                heldWoff2,
                h1Before,
                h1After,
                fallbackFaces: after.fallbackFaces,
                deltas,
                moved,
              },
              null,
              2,
            ),
            contentType: "application/json",
          });
          expect.soft(moved, `${path} movidos`).toEqual([]);
        });
      }
    });

    test("a fixture-mdx mostra KaTeX inline e display no primeiro viewport", async ({
      page,
    }) => {
      const response = await page.goto(fixtureMdx.href);
      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);

      const counts = await page.evaluate(() => {
        const inFirstViewport = (element: Element) =>
          element.getBoundingClientRect().top < 823;
        const inline = [...document.querySelectorAll(".katex")].filter(
          (element) =>
            element.closest(".katex-display") === null &&
            inFirstViewport(element),
        ).length;
        const display = [...document.querySelectorAll(".katex-display")].filter(
          inFirstViewport,
        ).length;
        return { inline, display };
      });

      expect
        .soft(counts.inline, "katex fora de katex-display")
        .toBeGreaterThan(0);
      expect.soft(counts.display, "katex-display").toBeGreaterThan(0);
    });

    test("a fixture-formulas mostra ênfase, negrito e código no primeiro viewport", async ({
      page,
    }) => {
      const response = await page.goto(fixtureFormulas.href);
      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);

      const counts = await page.evaluate(() => {
        const inFirstViewport = (element: Element) =>
          element.getBoundingClientRect().top < 823;
        const count = (selector: string) =>
          [
            ...document.querySelectorAll(
              `.prose > p:first-of-type ${selector}`,
            ),
          ].filter(inFirstViewport).length;
        return {
          em: count("em"),
          strong: count("strong"),
          code: count("code"),
        };
      });

      expect.soft(counts.em, "em").toBeGreaterThan(0);
      expect.soft(counts.strong, "strong").toBeGreaterThan(0);
      expect.soft(counts.code, "code").toBeGreaterThan(0);
    });
  });
});
