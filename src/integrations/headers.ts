import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

const MAX_RULES = 100;
const MAX_LINE_LENGTH = 2000;

const JAVASCRIPT_TYPES = new Set([
  "module",
  "text/javascript",
  "application/javascript",
  "text/ecmascript",
  "application/ecmascript",
]);

type Hashes = {
  scripts: string[];
  styles: string[];
};

type HeaderLine =
  | { remove: true; name: string }
  | { remove: false; name: string; value: string };

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function hashToken(content: string): string {
  const digest = createHash("sha256").update(content).digest("base64");
  return `'sha256-${digest}'`;
}

function attributes(source: string): Map<string, string> {
  const found = new Map<string, string>();
  const pattern =
    /([^\s"'=<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    const name = match[1]?.toLowerCase();
    if (!name) continue;
    found.set(name, (match[2] ?? match[3] ?? match[4] ?? "").trim());
  }
  return found;
}

function scriptIncluded(source: string): boolean {
  const attrs = attributes(source);
  if (attrs.has("src")) return false;
  if (!attrs.has("type")) return true;
  const type = attrs.get("type") ?? "";
  if (type === "") return true;
  return JAVASCRIPT_TYPES.has(type.toLowerCase());
}

function grouped(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function matchesPattern(pattern: string, pathname: string): boolean {
  let source = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern.charAt(index);
    if (character === "*") {
      source += ".*";
      continue;
    }
    if (character === ":") {
      const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(pattern.slice(index + 1));
      const placeholder = name?.[0];
      if (placeholder) {
        source += "[^/]+";
        index += placeholder.length;
        continue;
      }
    }
    source += character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}$`).test(pathname);
}

function headerLine(line: string): HeaderLine | undefined {
  const trimmed = line.trim();
  if (trimmed.startsWith("!")) {
    const name = trimmed.slice(1).trim().toLowerCase();
    if (name === "") return undefined;
    return { remove: true, name };
  }
  const separator = trimmed.indexOf(":");
  if (separator === -1) return undefined;
  const name = trimmed.slice(0, separator).trim().toLowerCase();
  if (name === "") return undefined;
  return {
    remove: false,
    name,
    value: trimmed.slice(separator + 1).trim(),
  };
}

async function markupFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await markupFiles(fullPath)));
      continue;
    }
    if (!entry.isFile()) continue;
    const extension = extname(entry.name).toLowerCase();
    if (extension === ".html" || extension === ".svg") files.push(fullPath);
  }
  return files;
}

export function extractHashes(text: string): Hashes {
  const scripts: string[] = [];
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of text.matchAll(scriptPattern)) {
    if (!scriptIncluded(match[1] ?? "")) continue;
    scripts.push(hashToken(match[2] ?? ""));
  }
  const styles: string[] = [];
  const stylePattern = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
  for (const match of text.matchAll(stylePattern)) {
    styles.push(hashToken(match[2] ?? ""));
  }
  return {
    scripts: uniqueSorted(scripts),
    styles: uniqueSorted(styles),
  };
}

export function buildHeaders(hashes: Hashes): string {
  const scripts = uniqueSorted(hashes.scripts);
  const styles = uniqueSorted(hashes.styles);
  const csp = [
    "default-src 'none'",
    `script-src ${["'self'", ...scripts].join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `style-src-elem ${["'self'", ...styles].join(" ")}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self'",
    "font-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'self'",
  ].join("; ");
  return `${[
    "/*",
    "  Strict-Transport-Security: max-age=63072000; includeSubDomains",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    `  Content-Security-Policy: ${csp}`,
  ].join("\n")}\n`;
}

export function cacheHeaders(): string {
  return `${[
    "/_astro/:file",
    "  Cache-Control: public, max-age=31536000, immutable",
  ].join("\n")}\n`;
}

export function validateHeaders(text: string): void {
  const lines = text.split(/\r?\n/);
  let rules = 0;
  for (const line of lines) {
    if (line.length > MAX_LINE_LENGTH) {
      throw new Error(
        `A linha tem mais de ${grouped(MAX_LINE_LENGTH)} caracteres.`,
      );
    }
    if (line.length > 0 && !/^\s/.test(line)) rules += 1;
  }
  if (rules > MAX_RULES) {
    throw new Error(`O _headers tem mais de ${MAX_RULES} regras.`);
  }
}

export function effectiveHeaders(
  text: string,
  pathname: string,
): Map<string, string[]> {
  const applied = new Map<string, string[]>();
  let matched = false;
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "") continue;
    if (!/^\s/.test(line)) {
      matched = matchesPattern(line.trim(), pathname);
      continue;
    }
    if (!matched) continue;
    const header = headerLine(line);
    if (!header) continue;
    if (header.remove) {
      applied.delete(header.name);
      continue;
    }
    const values = applied.get(header.name);
    if (values) values.push(header.value);
    else applied.set(header.name, [header.value]);
  }
  return applied;
}

export function headersIntegration(): AstroIntegration {
  return {
    name: "headers",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const scripts: string[] = [];
        const styles: string[] = [];
        for (const file of await markupFiles(fileURLToPath(dir))) {
          const text = await readFile(file, "utf8");
          const hashes = extractHashes(text);
          scripts.push(...hashes.scripts);
          styles.push(...hashes.styles);
        }
        const headers = buildHeaders({ scripts, styles }) + cacheHeaders();
        validateHeaders(headers);
        await writeFile(fileURLToPath(new URL("./_headers", dir)), headers);
      },
    },
  };
}
