import { createRequire } from "node:module";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { pagesForTheme, publishedPosts } from "./published-posts";

const loadConfig = createRequire(import.meta.url);

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
    const config = loadConfig("../../lighthouserc.cjs") as {
      ci: {
        collect: {
          url: string[];
          numberOfRuns: number;
          staticDistDir: string;
        };
      };
    };
    const posts = await publishedPosts(page);
    const fromConfig = config.ci.collect.url.map(pathnameOf);
    const fromSite = ["/", ...posts.map((post) => post.href)];

    expect([...fromConfig].sort()).toEqual([...fromSite].sort());
    expect(fromConfig[0]).toBe("/");
    expect(fromConfig.slice(1)).toEqual([...fromConfig.slice(1)].sort());
    expect(config.ci.collect.numberOfRuns).toBe(5);
    expect(config.ci.collect.staticDistDir).toBe("./dist");
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
  });
});
