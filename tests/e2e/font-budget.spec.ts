import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { pagesForTheme } from "./published-posts";

const variables = [
  "--font-cormorant",
  "--font-plex-sans",
  "--font-plex-mono",
  "--font-caveat",
] as const;

const allowed = [
  { variable: "--font-plex-sans", weight: "400", style: "normal" },
  { variable: "--font-plex-sans", weight: "600", style: "normal" },
  { variable: "--font-plex-sans", weight: "400", style: "italic" },
  { variable: "--font-plex-mono", weight: "400", style: "normal" },
  { variable: "--font-cormorant", weight: "600", style: "normal" },
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

function brandFontBytes(): Map<string, number> {
  const dir = join(process.cwd(), "dist/_astro/fonts");
  const sizes = new Map<string, number>();
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".woff2")) continue;
    sizes.set(`/_astro/fonts/${name}`, statSync(join(dir, name)).size);
  }
  return sizes;
}

function ceilingFor(path: string): { files: number; bytes: number } {
  if (path.startsWith("/blog/")) return { files: 5, bytes: 110_000 };
  return { files: 3, bytes: 61_000 };
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

async function requestedFonts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found = new Set<string>();
    for (const entry of performance.getEntriesByType("resource")) {
      const url = new URL(entry.name);
      if (!url.pathname.startsWith("/_astro/fonts/")) continue;
      if (!url.pathname.endsWith(".woff2")) continue;
      found.add(url.pathname);
    }
    return [...found];
  });
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
    const sizes = brandFontBytes();

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

        const pathnames = await requestedFonts(page);
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
      });
    }
  });
});
