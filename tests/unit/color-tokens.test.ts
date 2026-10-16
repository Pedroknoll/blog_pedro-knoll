import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../..", import.meta.url));

const palette =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|mauve|olive|mist|taupe|black|white";

const colorClass = new RegExp(
  `(?:^|[\\s"'\`])(?:[a-z0-9-]+:)*(?:bg|text|border-[trblxyse]|border|outline|ring-offset|ring|fill|stroke|decoration|divide|from|via|to|accent|caret|inset-shadow|shadow|placeholder)-(?:${palette})(?:-\\d{2,3})?(?:/\\d+)?\\b`,
  "g",
);

const patterns = [
  colorClass,
  /\bdark:/g,
  /\[#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\]/g,
  /(?:^|[^#\w])#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])/g,
];

function forbiddenColorUses(source: string): string[] {
  const hits: string[] = [];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      hits.push(match[0]);
    }
  }
  return hits;
}

function astroFiles(): string[] {
  const files: string[] = [];
  for (const dir of ["src/layouts", "src/components/ui"]) {
    const absolute = join(root, dir);
    if (!existsSync(absolute)) continue;
    for (const entry of readdirSync(absolute, { encoding: "utf8", recursive: true })) {
      if (entry.endsWith(".astro")) files.push(join(absolute, entry));
    }
  }
  return files;
}

describe("detector de cor", () => {
  it.each(["bg-white", "text-gray-900", "hover:border-red-500", "dark:bg-surface", "bg-[#fff]"])(
    "casa %s",
    (sample) => {
      expect(forbiddenColorUses(sample).length).toBeGreaterThan(0);
    },
  );

  it.each(["bg-surface", "text-ink", "font-black", 'href="#conteudo"'])("não casa %s", (sample) => {
    expect(forbiddenColorUses(sample)).toEqual([]);
  });
});

describe("arquivos de layout e ui", () => {
  it("há pelo menos um .astro e nenhum usa cor fora dos tokens", () => {
    const files = astroFiles();
    expect(files.length).toBeGreaterThan(0);
    const violations = files.flatMap((file) =>
      forbiddenColorUses(readFileSync(file, "utf8")).map((hit) => `${file}: ${hit}`),
    );
    expect(violations).toEqual([]);
  });
});
