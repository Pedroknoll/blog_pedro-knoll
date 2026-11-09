import { gzipSync } from "node:zlib";
import path from "node:path";

export type PageJsItem = {
  origin: string;
  gzipBytes: number;
};

export type PageJsIsland = {
  component: string;
  items: PageJsItem[];
  total: number;
};

export type PageJsResult = {
  items: PageJsItem[];
  total: number;
  islands: PageJsIsland[];
};

export type ReadDist = (path: string) => string | undefined;

const executableTypes = new Set([
  "module",
  "text/javascript",
  "application/javascript",
]);

const tagPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>|<link\b([^>]*)\/?>/gi;
const islandPattern = /<astro-island\b([^>]*)>/gi;

// import() dinâmico carrega depois e não entra neste budget.
const sideEffectImport = /\bimport\s*(['"])([^'"]+)\1/g;
const fromImport = /\b(?:import|export)\b[^'"\n;]*?\bfrom\s*(['"])([^'"]+)\1/g;

function gzipSize(content: string): number {
  return gzipSync(Buffer.from(content)).length;
}

function attr(source: string, name: string): string | undefined {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`,
    "i",
  ).exec(source);
  if (!match) return undefined;
  return match[1] ?? match[2] ?? match[3];
}

function isExecutable(type: string | undefined): boolean {
  if (type === undefined) return true;
  return executableTypes.has(type.trim().toLowerCase());
}

function isModulePreload(rel: string | undefined): boolean {
  if (rel === undefined) return false;
  return rel.toLowerCase().split(/\s+/).includes("modulepreload");
}

function isExternal(ref: string): boolean {
  return /^https?:/i.test(ref) || ref.startsWith("//");
}

function directoryOf(file: string): string {
  const slash = file.lastIndexOf("/");
  return slash === -1 ? "" : file.slice(0, slash);
}

function resolveDist(baseFile: string, ref: string): string {
  if (isExternal(ref)) {
    throw new Error(`referência externa: ${ref}`);
  }
  const joined = ref.startsWith("/")
    ? ref.slice(1)
    : directoryOf(baseFile) === ""
      ? ref
      : `${directoryOf(baseFile)}/${ref}`;
  const normalized = path.posix.normalize(joined);
  if (
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.startsWith("/")
  ) {
    throw new Error(`arquivo inexistente: ${normalized}`);
  }
  return normalized;
}

function staticSpecifiers(source: string): string[] {
  const found: { index: number; spec: string }[] = [];
  for (const match of source.matchAll(sideEffectImport)) {
    const spec = match[2];
    if (spec !== undefined) {
      found.push({ index: match.index, spec });
    }
  }
  for (const match of source.matchAll(fromImport)) {
    const spec = match[2];
    if (spec !== undefined) {
      found.push({ index: match.index, spec });
    }
  }
  found.sort((left, right) => left.index - right.index);
  return found.map((item) => item.spec);
}

function shouldFollow(spec: string): boolean {
  return spec.startsWith(".") || spec.startsWith("/") || isExternal(spec);
}

function sumBytes(items: PageJsItem[]): number {
  return items.reduce((sum, item) => sum + item.gzipBytes, 0);
}

export function countPageJs(
  html: string,
  pagePath: string,
  readFile: ReadDist,
): PageJsResult {
  function walkFile(
    resolved: string,
    items: PageJsItem[],
    seen: Set<string>,
  ): void {
    if (seen.has(resolved)) return;
    const content = readFile(resolved);
    if (content === undefined) {
      throw new Error(`arquivo inexistente: ${resolved}`);
    }
    seen.add(resolved);
    items.push({ origin: resolved, gzipBytes: gzipSize(content) });
    for (const spec of staticSpecifiers(content)) {
      if (!shouldFollow(spec)) continue;
      walkFile(resolveDist(resolved, spec), items, seen);
    }
  }

  const islands: PageJsIsland[] = [];
  const seenComponents = new Set<string>();

  for (const match of html.matchAll(islandPattern)) {
    const attrs = match[1] ?? "";
    const componentUrl = attr(attrs, "component-url");
    const rendererUrl = attr(attrs, "renderer-url");
    if (!componentUrl) throw new Error("astro-island sem component-url");
    if (!rendererUrl) throw new Error("astro-island sem renderer-url");
    if (seenComponents.has(componentUrl)) continue;
    seenComponents.add(componentUrl);

    const items: PageJsItem[] = [];
    const seen = new Set<string>();
    const addUrl = (url: string) => {
      walkFile(resolveDist(pagePath, url), items, seen);
    };
    addUrl(componentUrl);
    addUrl(rendererUrl);
    const before = attr(attrs, "before-hydration-url");
    if (before) addUrl(before);
    islands.push({ component: componentUrl, items, total: sumBytes(items) });
  }

  const items: PageJsItem[] = [];
  const seen = new Set<string>();
  let inlineIndex = 0;

  function addFile(resolved: string): void {
    walkFile(resolved, items, seen);
  }

  function follow(baseFile: string, spec: string): void {
    if (!shouldFollow(spec)) return;
    addFile(resolveDist(baseFile, spec));
  }

  for (const match of html.matchAll(tagPattern)) {
    if (match[1] !== undefined) {
      const attrs = match[1];
      const body = match[2] ?? "";
      if (!isExecutable(attr(attrs, "type"))) continue;
      const src = attr(attrs, "src");
      if (src !== undefined) {
        addFile(resolveDist(pagePath, src));
        continue;
      }
      items.push({
        origin: `inline:${inlineIndex}`,
        gzipBytes: gzipSize(body),
      });
      inlineIndex += 1;
      for (const spec of staticSpecifiers(body)) {
        follow(pagePath, spec);
      }
      continue;
    }

    const linkAttrs = match[3];
    if (linkAttrs === undefined) continue;
    if (!isModulePreload(attr(linkAttrs, "rel"))) continue;
    const href = attr(linkAttrs, "href");
    if (href === undefined) continue;
    addFile(resolveDist(pagePath, href));
  }

  return { items, total: sumBytes(items), islands };
}
