import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { fixtureFormulas } from "./fixtures";
import { pagesForTheme } from "./published-posts";

const variables = [
  "--font-plex-condensed",
  "--font-plex-sans",
  "--font-plex-mono",
  "--font-caveat",
] as const;

const allowed = [
  { variable: "--font-plex-sans", weight: "400", style: "normal" },
  { variable: "--font-plex-sans", weight: "600", style: "normal" },
  { variable: "--font-plex-sans", weight: "400", style: "italic" },
  { variable: "--font-plex-mono", weight: "400", style: "normal" },
  { variable: "--font-plex-condensed", weight: "600", style: "normal" },
] as const;

const generics = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong",
]);

type LiveFace = {
  family: string;
  weight: string;
  style: string;
  status: string;
};

type Stack = {
  variable: (typeof variables)[number];
  value: string;
  names: string[];
};

type FontCeiling = {
  files: number;
  bytes: number;
  katexFiles: number;
  katexBytes: number;
};

type RequestedFonts = {
  brand: string[];
  katex: string[];
  other: string[];
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

function distWoff2Bytes(): Map<string, number> {
  const sizes = new Map<string, number>();
  const fontsDir = join(process.cwd(), "dist/_astro/fonts");
  for (const name of readdirSync(fontsDir)) {
    if (!name.endsWith(".woff2")) continue;
    sizes.set(`/_astro/fonts/${name}`, statSync(join(fontsDir, name)).size);
  }
  const astroDir = join(process.cwd(), "dist/_astro");
  for (const name of readdirSync(astroDir)) {
    if (!name.startsWith("KaTeX_") || !name.endsWith(".woff2")) continue;
    sizes.set(`/_astro/${name}`, statSync(join(astroDir, name)).size);
  }
  return sizes;
}

function ceilingFor(path: string): FontCeiling {
  const katexFiles = 3;
  const katexBytes = 48_000;
  if (path.startsWith("/blog/")) {
    return { files: 5, bytes: 110_000, katexFiles, katexBytes };
  }
  return { files: 3, bytes: 61_000, katexFiles, katexBytes };
}

async function readStacks(page: Page): Promise<Stack[]> {
  const values = await page.evaluate(
    (names) => {
      const style = getComputedStyle(document.documentElement);
      return names.map((variable) => style.getPropertyValue(variable).trim());
    },
    [...variables],
  );

  return variables.map((variable, index) => {
    const value = values[index] ?? "";
    const names = familyNames(value).filter(
      (name) => !generics.has(name.toLowerCase()),
    );
    return { variable, value, names };
  });
}

async function loadedFaces(page: Page): Promise<LiveFace[]> {
  return page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((face) => face.status === "loaded")
      .map((face) => ({
        family: face.family,
        weight: face.weight,
        style: face.style,
        status: face.status,
      }));
  });
}

async function requestedFonts(page: Page): Promise<RequestedFonts> {
  return page.evaluate(() => {
    const brand = new Set<string>();
    const katex = new Set<string>();
    const other = new Set<string>();
    for (const entry of performance.getEntriesByType("resource")) {
      const url = new URL(entry.name);
      if (!url.pathname.endsWith(".woff2")) continue;
      const file = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
      const inAstroRoot =
        url.pathname.startsWith("/_astro/") &&
        !url.pathname.slice("/_astro/".length).includes("/");
      if (url.pathname.startsWith("/_astro/fonts/")) {
        brand.add(url.pathname);
        continue;
      }
      if (inAstroRoot && file.startsWith("KaTeX_")) {
        katex.add(url.pathname);
        continue;
      }
      other.add(url.pathname);
    }
    return {
      brand: [...brand],
      katex: [...katex],
      other: [...other],
    };
  });
}

function katexName(pathname: string): string {
  const file = pathname.slice(pathname.lastIndexOf("/") + 1);
  const stem = file.slice(0, file.lastIndexOf("."));
  const hashAt = stem.lastIndexOf(".");
  return hashAt === -1 ? stem : stem.slice(0, hashAt);
}

function classify(family: string, stacks: Stack[]) {
  const name = unquote(family);
  if (name.startsWith("KaTeX_")) return { kind: "katex" as const, name };
  for (const stack of stacks) {
    if (stack.names[0] === name) {
      return { kind: "brand" as const, name, variable: stack.variable };
    }
    if (stack.names.slice(1).includes(name)) {
      return { kind: "fallback" as const, name, variable: stack.variable };
    }
  }
  return { kind: "other" as const, name };
}

test.describe("orçamento de fontes [RNF-01]", () => {
  test("faces e tetos por página", async ({ page }) => {
    const pages = await pagesForTheme(page);
    const sizes = distWoff2Bytes();

    for (const path of pages) {
      await test.step(path, async () => {
        const response = await page.goto(path);
        expect(response?.status(), path).toBe(200);
        await page.evaluate(() => document.fonts.ready);

        const stacks = await readStacks(page);
        for (const stack of stacks) {
          expect(stack.value, `${path} ${stack.variable}`).not.toBe("");
          console.log(`${path} ${stack.variable}=${stack.value}`);
        }

        const faces = await loadedFaces(page);
        console.log(
          `${path} faces: ${
            faces
              .map(
                (face) =>
                  `${unquote(face.family)} ${face.weight} ${face.style}`,
              )
              .join("; ") || "(nenhuma)"
          }`,
        );

        const sans = stacks.find(
          (stack) => stack.variable === "--font-plex-sans",
        );
        const sans400 = faces.some((face) => {
          const hit = classify(face.family, stacks);
          return (
            hit.kind === "brand" &&
            hit.variable === "--font-plex-sans" &&
            face.weight.trim() === "400" &&
            face.style === "normal"
          );
        });
        expect
          .soft(
            sans400,
            `${path}: ${sans?.names[0] ?? "--font-plex-sans"} 400 normal ausente`,
          )
          .toBe(true);

        for (const face of faces) {
          const hit = classify(face.family, stacks);
          const label = `${path}: ${hit.name} ${face.weight} ${face.style}`;
          if (hit.kind === "katex" || hit.kind === "fallback") continue;
          if (hit.kind === "other") {
            expect.soft(false, `${label} fora do orçamento`).toBe(true);
            continue;
          }
          const permitted = allowed.some(
            (row) =>
              row.variable === hit.variable &&
              row.weight === face.weight.trim() &&
              row.style === face.style,
          );
          expect.soft(permitted, `${label} fora do orçamento`).toBe(true);
        }

        const requested = await requestedFonts(page);
        const pathnames = requested.brand;
        let bytes = 0;
        for (const pathname of pathnames) {
          const size = sizes.get(pathname);
          expect
            .soft(size, `${path}: ${pathname} sem arquivo em dist`)
            .toBeDefined();
          bytes += size ?? 0;
        }
        const ceiling = ceilingFor(path);
        console.log(
          `${path} arquivos: ${pathnames.length} ${bytes} bytes ${pathnames.join(" ")}`,
        );
        expect
          .soft(
            pathnames.length <= ceiling.files,
            `${path}: ${pathnames.length} arquivos, teto ${ceiling.files}`,
          )
          .toBe(true);
        expect
          .soft(
            bytes <= ceiling.bytes,
            `${path}: ${bytes} bytes, teto ${ceiling.bytes}`,
          )
          .toBe(true);

        let katexBytes = 0;
        for (const pathname of requested.katex) {
          katexBytes += sizes.get(pathname) ?? 0;
        }
        console.log(
          `${path} katex: ${requested.katex.length} arquivos ${katexBytes} bytes ${requested.katex.join(" ")}`,
        );
        expect
          .soft(
            requested.katex.length <= ceiling.katexFiles,
            `${path}: ${requested.katex.length} arquivos do KaTeX, teto ${ceiling.katexFiles}`,
          )
          .toBe(true);
        expect
          .soft(
            katexBytes <= ceiling.katexBytes,
            `${path}: ${katexBytes} bytes do KaTeX, teto ${ceiling.katexBytes}`,
          )
          .toBe(true);
        for (const pathname of requested.katex) {
          expect
            .soft(
              sizes.get(pathname),
              `${path}: ${pathname} sem arquivo do KaTeX em dist`,
            )
            .toBeDefined();
        }
        expect
          .soft(
            requested.other.length === 0,
            `${path}: ${requested.other.join(" ")} fora do orçamento`,
          )
          .toBe(true);
        const showsKatex = (await page.locator(".katex").count()) > 0;
        if (showsKatex) {
          expect
            .soft(
              requested.katex.length >= 1,
              `${path}: .katex sem arquivo do KaTeX`,
            )
            .toBe(true);
        }
      });
    }
  });

  test("fixture-formulas no teto da marca e do KaTeX [RNF-01]", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 412, height: 823 });
    const response = await page.goto(fixtureFormulas.href);
    expect(response?.status(), fixtureFormulas.href).toBe(200);
    await page.evaluate(() => document.fonts.ready);

    const counts = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll(".katex")];
      return {
        inline: nodes.filter((node) => node.closest(".katex-display") === null)
          .length,
        display: document.querySelectorAll(".katex-display").length,
        aboveFold: nodes
          .map((node) => node.getBoundingClientRect().top)
          .filter((top) => top < 823),
      };
    });
    expect(counts.display, fixtureFormulas.href).toBe(fixtureFormulas.display);
    expect(counts.inline, fixtureFormulas.href).toBe(fixtureFormulas.inline);
    expect(counts.aboveFold, fixtureFormulas.href).toEqual([]);

    const requested = await requestedFonts(page);
    expect(requested.katex.map(katexName).sort(), fixtureFormulas.href).toEqual(
      [...fixtureFormulas.katex].sort(),
    );
    expect(requested.brand.length, fixtureFormulas.href).toBe(
      fixtureFormulas.brandFiles,
    );
  });
});
