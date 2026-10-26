import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { countPageJs } from "../src/lib/page-js.ts";

const distDir = path.resolve("dist");
const limit = 50_000;

function exists(file) {
  try {
    statSync(file);
    return true;
  } catch {
    return false;
  }
}

if (!exists(path.join(distDir, "index.html"))) {
  console.error("dist/index.html não existe");
  process.exit(1);
}

function htmlFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(distDir, full);
    if (rel === "notebooks" || rel.startsWith(`notebooks${path.sep}`)) {
      continue;
    }
    if (entry.isDirectory()) {
      found.push(...htmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      found.push(full);
    }
  }
  return found;
}

function pageUrl(pagePath) {
  if (pagePath === "index.html") return "/";
  if (pagePath.endsWith("/index.html")) {
    return `/${pagePath.slice(0, -"index.html".length)}`;
  }
  return `/${pagePath}`;
}

function readDist(relPath) {
  const root = path.resolve(distDir);
  const abs = path.resolve(root, relPath);
  if (abs !== root && !abs.startsWith(`${root}${path.sep}`)) {
    return undefined;
  }
  try {
    return readFileSync(abs, "utf8");
  } catch {
    return undefined;
  }
}

const files = htmlFiles(distDir);
if (files.length === 0) {
  console.error("nenhuma página HTML em dist/");
  process.exit(1);
}

const rows = files.map((file) => {
  const pagePath = path.relative(distDir, file).split(path.sep).join("/");
  const url = pageUrl(pagePath);
  try {
    const html = readFileSync(file, "utf8");
    const result = countPageJs(html, pagePath, readDist);
    return { url, total: result.total, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { url, total: null, error: message };
  }
});

rows.sort((left, right) =>
  left.url < right.url ? -1 : left.url > right.url ? 1 : 0,
);

const label = "página";
const width = Math.max(label.length, ...rows.map((row) => row.url.length));
console.log(`${label.padEnd(width)}  bytes  limite`);
for (const row of rows) {
  const bytes = row.total === null ? "-" : String(row.total);
  console.log(`${row.url.padEnd(width)}  ${bytes.padStart(5)}  ${limit}`);
}

let failed = false;
for (const row of rows) {
  if (row.error) {
    console.error(`${row.url}: ${row.error}`);
    failed = true;
  } else if (row.total > limit) {
    console.error(`${row.url}: ${row.total} bytes gzip, limite ${limit}`);
    failed = true;
  }
}

if (failed) process.exit(1);
