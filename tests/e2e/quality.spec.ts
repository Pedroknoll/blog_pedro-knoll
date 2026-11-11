import { createRequire } from "node:module";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { pagesForTheme, publishedPosts } from "./published-posts";

type ClsShift = PerformanceEntry & {
  value: number;
  hadRecentInput: boolean;
  sources?: Array<{
    node?: Node | null;
    previousRect: DOMRectReadOnly;
    currentRect: DOMRectReadOnly;
  }>;
};

type ClsWindow = Window & {
  __clsShifts?: ClsShift[];
  __clsObserver?: PerformanceObserver;
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

async function readCls(page: Page) {
  return page.evaluate(() => {
    const view = window as ClsWindow;
    const shifts = view.__clsShifts ?? [];
    for (const entry of view.__clsObserver?.takeRecords() ?? []) {
      const shift = entry as ClsShift;
      if (!shift.hadRecentInput) shifts.push(shift);
    }
    const sum = shifts.reduce((total, entry) => total + entry.value, 0);
    const fallbackFaces = [...document.fonts]
      .filter((face) => face.family.includes("fallback:"))
      .map((face) => ({ family: face.family, status: face.status }));
    const layoutShifts = shifts.map((entry) => ({
      value: entry.value,
      sources: (entry.sources ?? []).map((source) => {
        const node = source.node;
        const element = node instanceof Element ? node : null;
        return {
          tag: element?.tagName ?? "",
          classes: element?.getAttribute("class") ?? "",
          previousRect: {
            y: source.previousRect.y,
            height: source.previousRect.height,
          },
          currentRect: {
            y: source.currentRect.y,
            height: source.currentRect.height,
          },
        };
      }),
    }));
    return { sum, fallbackFaces, layoutShifts };
  });
}

const loadConfig = createRequire(import.meta.url);

function pathnameOf(url: string) {
  return new URL(url).pathname;
}

async function open(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
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

    test("a soma de layout-shift sem input recente é 0", async ({
      page,
    }, testInfo) => {
      const posts = await publishedPosts(page);
      const paths = ["/", ...posts.map((post) => post.href)];

      await page.addInitScript(() => {
        const shifts: ClsShift[] = [];
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as ClsShift;
            if (!shift.hadRecentInput) shifts.push(shift);
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
        (window as ClsWindow).__clsShifts = shifts;
        (window as ClsWindow).__clsObserver = observer;
      });

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
          const reading = await readCls(page);
          await testInfo.attach(clsAttachmentName(path), {
            body: JSON.stringify(
              {
                path,
                h1Before,
                h1After,
                sum: reading.sum,
                heldWoff2,
                fallbackFaces: reading.fallbackFaces,
                layoutShifts: reading.layoutShifts,
              },
              null,
              2,
            ),
            contentType: "application/json",
          });
          expect.soft(reading.sum, `${path} soma`).toBe(0);
        });
      }
    });
  });
});
