import { expect, test, type Page, type Response } from "@playwright/test";

import { fixtureMdx } from "./fixtures";
import { katexMetricFaces } from "./katex-metric";
import { pagesForTheme, publishedPosts } from "./published-posts";

// Família, peso e estilo da T-42. Uma linha por combinação.
const declared = [
  {
    family: "IBM Plex Sans",
    cssVariable: "--font-plex-sans",
    weight: 400,
    style: "normal",
  },
  {
    family: "IBM Plex Sans",
    cssVariable: "--font-plex-sans",
    weight: 600,
    style: "normal",
  },
  {
    family: "IBM Plex Sans",
    cssVariable: "--font-plex-sans",
    weight: 400,
    style: "italic",
  },
  {
    family: "IBM Plex Mono",
    cssVariable: "--font-plex-mono",
    weight: 400,
    style: "normal",
  },
  {
    family: "Caveat",
    cssVariable: "--font-caveat",
    weight: 500,
    style: "normal",
  },
  {
    family: "Caveat",
    cssVariable: "--font-caveat",
    weight: 600,
    style: "normal",
  },
  {
    family: "IBM Plex Sans Condensed",
    cssVariable: "--font-plex-condensed",
    weight: 600,
    style: "normal",
  },
] as const;

const adjustedStacks = [
  { variable: "--font-plex-sans", generic: "sans-serif" },
  { variable: "--font-plex-mono", generic: "monospace" },
  { variable: "--font-plex-condensed", generic: "sans-serif" },
] as const;

type Declared = (typeof declared)[number];

type LiveFace = {
  family: string;
  weight: string;
  style: string;
  status: string;
};

type FontRule = {
  family: string;
  weight: string;
  style: string;
  src: string;
  urls: string[];
  unicodeRange: string;
  sizeAdjust: string;
};

type FontHit = {
  url: string;
  status: number;
  contentType: string;
};

function originOf(baseURL: string | undefined): string {
  if (!baseURL) throw new Error("baseURL ausente");
  return new URL(baseURL).origin;
}

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

function weightMatches(actual: string, expected: number): boolean {
  const text = actual.trim();
  if (text === String(expected)) return true;
  const range = /^(\d+)\s+(\d+)$/.exec(text);
  if (!range) return false;
  const start = Number(range[1]);
  const end = Number(range[2]);
  return expected >= start && expected <= end;
}

function faceMatches(
  face: LiveFace,
  family: string,
  row: { weight: number; style: string },
): boolean {
  return (
    unquote(face.family) === family &&
    face.style === row.style &&
    weightMatches(face.weight, row.weight) &&
    face.status === "loaded"
  );
}

function rowFor(cssVariable: Declared["cssVariable"]): Declared {
  const row = declared.find((item) => item.cssVariable === cssVariable);
  if (!row) throw new Error(cssVariable);
  return row;
}

async function familyFromVariable(
  page: Page,
  cssVariable: string,
  name: string,
): Promise<string> {
  const value = await page.evaluate((variable) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
  }, cssVariable);
  expect(value, cssVariable).not.toBe("");
  const first = familyNames(value)[0] ?? "";
  expect(first.startsWith(`${name}-`), `${cssVariable}: ${first}`).toBe(true);
  return first;
}

const metricFallbacks = [
  {
    variable: "--font-plex-condensed",
    family: "Metric Sans",
    base: "Arial",
    locals: [
      "Liberation Sans",
      "LiberationSans",
      "Arimo Regular",
      "Arimo-Regular",
    ],
  },
  {
    variable: "--font-plex-mono",
    family: "Metric Mono",
    base: "Courier New",
    locals: [
      "Liberation Mono",
      "LiberationMono",
      "Cousine Regular",
      "Cousine-Regular",
    ],
  },
] as const;

const plexSansMetricFaces = [
  {
    weight: "400",
    style: "normal",
    locals: [
      "Arial",
      "ArialMT",
      "Liberation Sans",
      "LiberationSans",
      "Arimo Regular",
      "Arimo-Regular",
    ],
  },
  {
    weight: "600",
    style: "normal",
    locals: [
      "Arial Bold",
      "Arial-BoldMT",
      "Liberation Sans Bold",
      "LiberationSans-Bold",
      "Arimo Bold",
      "Arimo-Bold",
    ],
  },
  {
    weight: "400",
    style: "italic",
    locals: [
      "Arial Italic",
      "Arial-ItalicMT",
      "Liberation Sans Italic",
      "LiberationSans-Italic",
      "Arimo Italic",
      "Arimo-Italic",
    ],
  },
] as const;

const plexSansSample =
  "A frase continua em peso regular, sem título e sem fórmula";

type MetricRule = {
  family: string;
  weight: string;
  style: string;
  src: string;
  sizeAdjust: string;
  ascentOverride: string;
  descentOverride: string;
  lineGapOverride: string;
};

function localSourcesInOrder(src: string, locals: readonly string[]): boolean {
  if (/url\s*\(/i.test(src)) return false;
  if (!/local\s*\(/i.test(src)) return false;
  let from = 0;
  for (const name of locals) {
    const at = src.indexOf(name, from);
    if (at < 0) return false;
    from = at + name.length;
  }
  return true;
}

function isLocalBase(src: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `local\\(\\s*(?:"${escaped}"|'${escaped}'|${escaped})\\s*\\)`,
  ).test(src);
}

function sameWeight(actual: string, expected: string): boolean {
  const text = expected.trim();
  if (/^\d+$/.test(text)) return weightMatches(actual, Number(text));
  return actual.trim() === text;
}

async function metricRules(page: Page): Promise<MetricRule[]> {
  return page.evaluate(() => {
    const found: MetricRule[] = [];
    const walk = (rules: CSSRuleList) => {
      for (const rule of rules) {
        if (rule instanceof CSSFontFaceRule) {
          const style = rule.style;
          found.push({
            family: style.getPropertyValue("font-family"),
            weight: style.getPropertyValue("font-weight"),
            style: style.getPropertyValue("font-style"),
            src: style.getPropertyValue("src"),
            sizeAdjust: style.getPropertyValue("size-adjust"),
            ascentOverride: style.getPropertyValue("ascent-override"),
            descentOverride: style.getPropertyValue("descent-override"),
            lineGapOverride: style.getPropertyValue("line-gap-override"),
          });
        } else if (rule instanceof CSSGroupingRule) {
          walk(rule.cssRules);
        }
      }
    };

    for (const sheet of document.styleSheets) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        throw new Error(`folha ilegível: ${sheet.href ?? "<style>"}`);
      }
      walk(rules);
    }
    return found;
  });
}

function inFontDir(url: string, origin: string): boolean {
  if (url.startsWith("data:")) return false;
  const parsed = new URL(url);
  return (
    parsed.origin === origin && parsed.pathname.startsWith("/_astro/fonts/")
  );
}

function watchFonts(page: Page) {
  const seen: FontHit[] = [];
  const onResponse = (response: Response) => {
    if (response.request().resourceType() !== "font") return;
    seen.push({
      url: response.url(),
      status: response.status(),
      contentType: response.headers()["content-type"] ?? "",
    });
  };
  page.on("response", onResponse);
  return {
    seen,
    stop() {
      page.off("response", onResponse);
    },
  };
}

async function liveFaces(page: Page): Promise<LiveFace[]> {
  return page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].map((face) => ({
      family: face.family,
      weight: face.weight,
      style: face.style,
      status: face.status,
    }));
  });
}

async function fontFaceRules(page: Page): Promise<FontRule[]> {
  return page.evaluate(() => {
    const found: FontRule[] = [];
    const urlsOf = (src: string, base: string) => {
      const urls: string[] = [];
      const pattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]+))\s*\)/gi;
      for (const match of src.matchAll(pattern)) {
        const url = match[1] ?? match[2] ?? match[3];
        if (url === undefined) continue;
        urls.push(url.startsWith("data:") ? url : new URL(url, base).href);
      }
      return urls;
    };
    const walk = (rules: CSSRuleList, base: string) => {
      for (const rule of rules) {
        if (rule instanceof CSSFontFaceRule) {
          const src = rule.style.getPropertyValue("src");
          found.push({
            family: rule.style.getPropertyValue("font-family"),
            weight: rule.style.getPropertyValue("font-weight"),
            style: rule.style.getPropertyValue("font-style"),
            src,
            urls: urlsOf(src, base),
            unicodeRange: rule.style.getPropertyValue("unicode-range"),
            sizeAdjust: rule.style.getPropertyValue("size-adjust"),
          });
        } else if (rule instanceof CSSGroupingRule) {
          walk(rule.cssRules, base);
        }
      }
    };

    for (const sheet of document.styleSheets) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        throw new Error(`folha ilegível: ${sheet.href ?? "<style>"}`);
      }
      walk(rules, sheet.href ?? location.href);
    }
    return found;
  });
}

async function loadDeclared(
  page: Page,
  row: { family: string; weight: number; style: string },
): Promise<LiveFace[]> {
  return page.evaluate(
    async ({ family, weight, style }) => {
      const found = await document.fonts.load(
        `${style} ${weight} 32px "${family}"`,
      );
      return found.map((face) => ({
        family: face.family,
        weight: face.weight,
        style: face.style,
        status: face.status,
      }));
    },
    { family: row.family, weight: row.weight, style: row.style },
  );
}

test.describe("fontes da marca [RNF-01]", () => {
  test("F1 Plex Sans no texto", async ({ page }) => {
    const pages = await pagesForTheme(page);

    for (const path of pages) {
      await test.step(path, async () => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);

        const sans = rowFor("--font-plex-sans");
        const family = await familyFromVariable(
          page,
          sans.cssVariable,
          sans.family,
        );
        const body = await page.evaluate(
          () => getComputedStyle(document.body).fontFamily,
        );
        const faces = await liveFaces(page);
        const first = familyNames(body)[0] ?? "";
        const loaded = faces.some((face) =>
          faceMatches(face, family, { weight: 400, style: "normal" }),
        );

        expect.soft(first, path).toBe(family);
        expect.soft(loaded, `${path}: face 400 normal carregada`).toBe(true);
      });
    }
  });

  test("F2 Plex Mono no código", async ({ page }) => {
    const posts = await publishedPosts(page);
    let withPre = 0;

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);

        const pres = page.getByRole("article").locator("pre");
        const count = await pres.count();
        if (count === 0) return;
        withPre += 1;

        const mono = rowFor("--font-plex-mono");
        const family = await familyFromVariable(
          page,
          mono.cssVariable,
          mono.family,
        );
        await page.evaluate(() => document.fonts.ready);
        const families = await pres.evaluateAll((nodes) =>
          nodes.map((node) => getComputedStyle(node).fontFamily),
        );
        const faces = await liveFaces(page);
        const loaded = faces.some((face) =>
          faceMatches(face, family, { weight: 400, style: "normal" }),
        );

        expect
          .soft(loaded, `${post.href}: face 400 normal carregada`)
          .toBe(true);
        for (const stack of families) {
          expect.soft(familyNames(stack)[0] ?? "", post.href).toBe(family);
        }
      });
    }

    expect(withPre).toBeGreaterThan(0);
  });

  test("F3 combinações declaradas carregam da origem", async ({
    page,
    baseURL,
  }) => {
    const origin = originOf(baseURL);
    const watch = watchFonts(page);
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await page.evaluate(() => document.fonts.ready);

    for (const row of declared) {
      const family = await familyFromVariable(
        page,
        row.cssVariable,
        row.family,
      );
      const found = await loadDeclared(page, { ...row, family });
      const label = `${row.family} ${row.style} ${row.weight}`;
      const summary =
        found
          .map(
            (face) =>
              `${unquote(face.family)} ${face.style} ${face.weight} ${face.status}`,
          )
          .join(", ") || "lista vazia";
      expect
        .soft(
          found.some((face) => faceMatches(face, family, row)),
          `${label}: ${summary}`,
        )
        .toBe(true);
    }

    watch.stop();
    expect.soft(watch.seen.length, "/").toBeGreaterThan(0);
    for (const hit of watch.seen) {
      const url = new URL(hit.url);
      const where = hit.url;
      expect.soft(hit.status, where).toBe(200);
      expect.soft(url.origin, where).toBe(origin);
      expect.soft(url.pathname.startsWith("/_astro/fonts/"), where).toBe(true);
      expect.soft(url.pathname.endsWith(".woff2"), where).toBe(true);
      expect.soft(hit.contentType, where).toBe("font/woff2");
    }
  });

  test("F4 nenhuma fonte de fora e só woff2", async ({ page, baseURL }) => {
    const origin = originOf(baseURL);
    const pages = await pagesForTheme(page);

    for (const path of pages) {
      await test.step(path, async () => {
        const watch = watchFonts(page);
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await page.evaluate(() => document.fonts.ready);
        const hits = watch.seen.slice();
        watch.stop();

        const brand = hits.filter((hit) => inFontDir(hit.url, origin));
        expect.soft(brand.length, path).toBeGreaterThan(0);

        for (const hit of hits) {
          expect
            .soft(new URL(hit.url).origin, `${path} ${hit.url}`)
            .toBe(origin);
        }

        const rules = await fontFaceRules(page);
        for (const rule of rules) {
          for (const url of rule.urls) {
            if (url.startsWith("data:")) continue;
            expect.soft(new URL(url).origin, `${path} ${url}`).toBe(origin);
          }
          if (!rule.urls.some((url) => inFontDir(url, origin))) continue;
          for (const url of rule.urls) {
            expect.soft(url.endsWith(".woff2"), `${path} ${url}`).toBe(true);
          }
        }
      });
    }
  });

  test("F5 subset latin", async ({ page, baseURL }) => {
    const origin = originOf(baseURL);
    const pages = await pagesForTheme(page);

    for (const path of pages) {
      await test.step(path, async () => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);

        const rules = (await fontFaceRules(page)).filter((rule) =>
          rule.urls.some((url) => inFontDir(url, origin)),
        );
        expect.soft(rules.length, path).toBeGreaterThan(0);
        if (rules.length === 0) return;

        const ranges = new Set(rules.map((rule) => rule.unicodeRange.trim()));
        expect.soft(ranges.size, path).toBe(1);
      });
    }
  });

  test("F6 preload", async ({ page, baseURL }) => {
    const origin = originOf(baseURL);
    const pages = await pagesForTheme(page);

    for (const path of pages) {
      await test.step(path, async () => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);

        const links = page.locator('head link[rel="preload"][as="font"]');
        const count = await links.count();
        expect.soft(count, path).toBe(1);
        if (count !== 1) return;

        const link = links.first();
        const href = await link.getAttribute("href");
        const preload = href === null ? null : new URL(href, page.url()).href;
        const preloadUrl = preload === null ? null : new URL(preload);
        expect.soft(await link.getAttribute("type"), path).toBe("font/woff2");
        expect
          .soft(await link.getAttribute("crossorigin"), path)
          .not.toBeNull();
        expect.soft(preloadUrl?.origin ?? "", path).toBe(origin);
        expect
          .soft(
            preloadUrl?.pathname.startsWith("/_astro/fonts/") ?? false,
            path,
          )
          .toBe(true);
        expect
          .soft(preloadUrl?.pathname.endsWith(".woff2") ?? false, path)
          .toBe(true);

        const sans = rowFor("--font-plex-sans");
        const family = await familyFromVariable(
          page,
          sans.cssVariable,
          sans.family,
        );
        const matches = (await fontFaceRules(page)).filter(
          (rule) =>
            unquote(rule.family) === family &&
            rule.style === "normal" &&
            weightMatches(rule.weight, 400),
        );
        expect
          .soft(matches.length, `${path}: @font-face 400 normal`)
          .toBeGreaterThan(0);
        if (matches.length === 0 || preload === null) return;

        const urls = matches.flatMap((rule) =>
          rule.urls.filter((url) => inFontDir(url, origin)),
        );
        expect.soft(urls, path).toEqual([preload]);
      });
    }
  });

  test("F7 fallback ajustado", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    const values = await page.evaluate(
      (names) => {
        const style = getComputedStyle(document.documentElement);
        return Object.fromEntries(
          names.map((name) => [name, style.getPropertyValue(name).trim()]),
        );
      },
      adjustedStacks.map((stack) => stack.variable),
    );
    const rules = await fontFaceRules(page);

    for (const { variable: name, generic } of adjustedStacks) {
      const value = values[name] ?? "";
      expect.soft(value, name).not.toBe("");
      if (value === "") continue;

      const families = familyNames(value);
      expect.soft(families.at(-1), `${name}: genérica`).toBe(generic);

      const second = families[1];
      expect.soft(second, name).toBeTruthy();
      if (!second) continue;

      const fallback = rules.some(
        (rule) =>
          unquote(rule.family) === second &&
          rule.src.includes("local(") &&
          rule.sizeAdjust.trim() !== "",
      );
      expect.soft(fallback, `${name}: ${second}`).toBe(true);
    }
  });

  test("F8 fallback métrico da Plex Condensed e da Plex Mono", async ({
    page,
  }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    const values = await page.evaluate(
      (names) => {
        const style = getComputedStyle(document.documentElement);
        return Object.fromEntries(
          names.map((name) => [name, style.getPropertyValue(name).trim()]),
        );
      },
      metricFallbacks.map((entry) => entry.variable),
    );
    const rules = await metricRules(page);

    for (const entry of metricFallbacks) {
      const value = values[entry.variable] ?? "";
      const metricSrc = rules
        .filter((rule) => unquote(rule.family) === entry.family)
        .map((rule) => rule.src);

      expect.soft(familyNames(value), entry.variable).toContain(entry.family);
      expect
        .soft(
          metricSrc.some((src) => localSourcesInOrder(src, entry.locals)),
          `${entry.family}: ${metricSrc.join(" | ") || "nenhuma @font-face"}`,
        )
        .toBe(true);

      if (!familyNames(value).includes(entry.family)) continue;

      const families = new Set(familyNames(value));
      const base = rules.find(
        (rule) =>
          families.has(unquote(rule.family)) &&
          isLocalBase(rule.src, entry.base) &&
          rule.sizeAdjust.trim() !== "",
      );
      expect.soft(base, `${entry.variable}: face ${entry.base}`).toBeTruthy();
      if (!base) continue;

      const metric = rules.find(
        (rule) =>
          unquote(rule.family) === entry.family &&
          sameWeight(rule.weight, base.weight) &&
          rule.style.trim() === base.style.trim(),
      );
      expect
        .soft(
          metric,
          `${entry.variable}: ${entry.family} ${base.weight} ${base.style}`,
        )
        .toBeTruthy();
      if (!metric) continue;

      expect
        .soft(metric.sizeAdjust.trim(), `${entry.variable}: size-adjust`)
        .toBe(base.sizeAdjust.trim());
      expect
        .soft(
          metric.ascentOverride.trim(),
          `${entry.variable}: ascent-override`,
        )
        .toBe(base.ascentOverride.trim());
      expect
        .soft(
          metric.descentOverride.trim(),
          `${entry.variable}: descent-override`,
        )
        .toBe(base.descentOverride.trim());
      expect
        .soft(
          metric.lineGapOverride.trim(),
          `${entry.variable}: line-gap-override`,
        )
        .toBe(base.lineGapOverride.trim());
    }
  });

  test("fallback métrico da Plex Sans por face", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    const stack = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue("--font-plex-sans")
        .trim();
    });
    const families = familyNames(stack);
    const plex = families[0] ?? "";
    const reserve = families[1] ?? "";
    expect.soft(reserve, "--font-plex-sans").toBe("Metric Plex Sans");

    const rules = await metricRules(page);
    for (const face of plexSansMetricFaces) {
      const label = `Metric Plex Sans ${face.weight} ${face.style}`;
      const rule = rules.find(
        (item) =>
          unquote(item.family) === "Metric Plex Sans" &&
          sameWeight(item.weight, face.weight) &&
          item.style.trim() === face.style,
      );
      expect.soft(rule, label).toBeTruthy();
      expect
        .soft(
          rule ? localSourcesInOrder(rule.src, face.locals) : false,
          `${label}: ${rule?.src ?? "nenhuma @font-face"}`,
        )
        .toBe(true);
    }

    const faces = plexSansMetricFaces.map((face) => ({
      weight: face.weight,
      style: face.style,
    }));
    await page.evaluate(
      async ({ plexFamily, reserveFamily, requested }) => {
        const familiesToLoad = [plexFamily, reserveFamily].filter(Boolean);
        await Promise.all(
          familiesToLoad.flatMap((family) =>
            requested.map((face) =>
              document.fonts
                .load(`${face.style} ${face.weight} 100px "${family}"`)
                .catch(() => []),
            ),
          ),
        );
        await document.fonts.ready;
      },
      { plexFamily: plex, reserveFamily: reserve, requested: faces },
    );

    const widths = await page.evaluate(
      ({ plexFamily, reserveFamily, requested, sample }) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return null;
        const measure = (
          family: string,
          face: { style: string; weight: string },
        ) => {
          context.font = `${face.style} ${face.weight} 100px "${family}"`;
          return context.measureText(sample).width;
        };
        return requested.map((face) => ({
          weight: face.weight,
          style: face.style,
          reserve: reserveFamily ? measure(reserveFamily, face) : null,
          plex: plexFamily ? measure(plexFamily, face) : null,
        }));
      },
      {
        plexFamily: plex,
        reserveFamily: reserve,
        requested: faces,
        sample: plexSansSample,
      },
    );
    expect.soft(widths, "canvas").not.toBeNull();
    if (!widths) return;

    for (const row of widths) {
      const label = `${row.weight} ${row.style}`;
      expect.soft(row.plex, `${label}: plex`).toBeGreaterThan(0);
      expect.soft(row.reserve, `${label}: reserva`).toBeGreaterThan(0);
      if (!row.plex || !row.reserve) continue;
      const delta = (row.reserve - row.plex) / row.plex;
      const percent = delta * 100;
      const signed = `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
      console.log(`${label}: ${signed}`);
      expect
        .soft(Math.abs(delta), `${label}: ${signed}`)
        .toBeLessThanOrEqual(0.015);
    }
  });

  test("fallback métrico do KaTeX na fixture-mdx", async ({ page }) => {
    const response = await page.goto(fixtureMdx.href);
    expect(response?.status()).toBe(200);

    await page.evaluate(
      async (entries) => {
        for (const entry of entries) {
          await document.fonts
            .load(`${entry.style} 100px "${entry.family}"`)
            .catch(() => []);
        }
      },
      [...katexMetricFaces],
    );

    const faces = await liveFaces(page);

    for (const entry of katexMetricFaces) {
      const loaded = faces.some(
        (face) =>
          unquote(face.family) === entry.family && face.status === "loaded",
      );
      expect.soft(loaded, `${entry.family} face ausente`).toBe(true);
      if (!loaded) continue;

      const boxes = await page.evaluate(
        async ({ family, katex, style }) => {
          await document.fonts.ready;
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) return null;
          const measure = (name: string) => {
            context.font = `${style} 100px "${name}"`;
            const metrics = context.measureText("x");
            return {
              ascent: metrics.fontBoundingBoxAscent,
              descent: metrics.fontBoundingBoxDescent,
            };
          };
          return { metric: measure(family), katex: measure(katex) };
        },
        { family: entry.family, katex: entry.katex, style: entry.style },
      );
      expect(boxes, entry.family).not.toBeNull();
      if (!boxes) continue;

      expect
        .soft(
          Math.abs(boxes.metric.ascent - boxes.katex.ascent),
          `${entry.family}: ascent`,
        )
        .toBeLessThanOrEqual(1);
      expect
        .soft(
          Math.abs(boxes.metric.descent - boxes.katex.descent),
          `${entry.family}: descent`,
        )
        .toBeLessThanOrEqual(1);
    }
  });
});
