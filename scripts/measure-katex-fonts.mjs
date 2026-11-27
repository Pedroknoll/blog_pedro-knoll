// Tempo até a math: quando chega o último .woff2 do KaTeX, numa carga
// limitada no perfil Slow 4G do Lighthouse (T-89, SPEC §9). O CSS do KaTeX
// usa `font-display: block`: a fórmula fica invisível até a fonte dela chegar.
// Fora do CI e sem gate; a guarda do CI é o teto de font-budget.spec.ts.
//
// Uso: node scripts/measure-katex-fonts.mjs <dist> <caminho>... [--runs N]
// Ex.: node scripts/measure-katex-fonts.mjs dist-fixtures /blog/fixture-formulas/
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { createGzip } from "node:zlib";

import { chromium } from "@playwright/test";

// Lighthouse 13.6.0, throttling.mobileSlow4G com o ajuste do throttling
// aplicado (DEVTOOLS_RTT_ADJUSTMENT_FACTOR 3,75 e
// DEVTOOLS_THROUGHPUT_ADJUSTMENT_FACTOR 0,9).
const slow4G = {
  latencyMs: 150 * 3.75,
  downloadKbps: 1.6 * 1024 * 0.9,
  uploadKbps: 750 * 0.9,
  cpuSlowdown: 4,
};

// Viewport móvel do Lighthouse, o mesmo da checagem de posição (T-85).
const viewport = { width: 412, height: 823 };
const deviceScaleFactor = 1.75;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};
const compressible = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".svg",
  ".xml",
  ".txt",
]);

function parseArgs(argv) {
  const rest = [];
  let runs = 5;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--runs") {
      runs = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    rest.push(arg);
  }
  const [dist, ...paths] = rest;
  if (!dist || paths.length === 0 || !Number.isInteger(runs) || runs < 1) {
    console.error(
      "Uso: node scripts/measure-katex-fonts.mjs <dist> <caminho>... [--runs N]",
    );
    process.exit(1);
  }
  return { dist: path.resolve(dist), paths, runs };
}

function fileFor(distDir, pathname) {
  const decoded = decodeURIComponent(pathname);
  let file = path.join(distDir, decoded);
  if (!file.startsWith(distDir)) return null;
  try {
    if (statSync(file).isDirectory()) file = path.join(file, "index.html");
    statSync(file);
    return file;
  } catch {
    return null;
  }
}

// Servidor estático com gzip, como o do `staticDistDir` do Lighthouse CI.
function serve(distDir) {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const file = fileFor(distDir, url.pathname);
    if (!file) {
      response.writeHead(404);
      response.end();
      return;
    }
    const extension = path.extname(file);
    const headers = {
      "content-type": types[extension] ?? "application/octet-stream",
      "cache-control": "no-store",
    };
    const gzip =
      compressible.has(extension) &&
      /\bgzip\b/.test(request.headers["accept-encoding"] ?? "");
    if (gzip) headers["content-encoding"] = "gzip";
    response.writeHead(200, headers);
    const stream = createReadStream(file);
    (gzip ? stream.pipe(createGzip()) : stream).pipe(response);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function measure(browser, origin, pagePath) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: slow4G.latencyMs,
    downloadThroughput: (slow4G.downloadKbps * 1024) / 8,
    uploadThroughput: (slow4G.uploadKbps * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", {
    rate: slow4G.cpuSlowdown,
  });
  await page.addInitScript(() => {
    window.__lcp = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__lcp = Math.max(window.__lcp, entry.startTime);
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  const response = await page.goto(`${origin}${pagePath}`, {
    waitUntil: "load",
  });
  if (response?.status() !== 200) {
    throw new Error(`${pagePath}: status ${response?.status()}`);
  }
  const result = await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    const katex = [];
    const brand = [];
    for (const entry of performance.getEntriesByType("resource")) {
      const url = new URL(entry.name);
      if (!url.pathname.endsWith(".woff2")) continue;
      const file = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
      const row = {
        file,
        bytes: entry.encodedBodySize,
        end: entry.responseEnd,
      };
      if (url.pathname.startsWith("/_astro/fonts/")) brand.push(row);
      else if (file.startsWith("KaTeX_")) katex.push(row);
    }
    const fcp = performance
      .getEntriesByType("paint")
      .find((entry) => entry.name === "first-contentful-paint");
    return {
      katex,
      brand,
      fcp: fcp?.startTime ?? null,
      lcp: window.__lcp || null,
      formulas: document.querySelectorAll(".katex").length,
    };
  });
  await context.close();
  return result;
}

function median(values) {
  const sorted = values.filter((value) => value !== null).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function spread(values) {
  const present = values.filter((value) => value !== null);
  if (present.length === 0) return "—";
  const fmt = (value) => value.toFixed(1);
  return `${fmt(median(present))} (${fmt(Math.min(...present))}–${fmt(Math.max(...present))})`;
}

function katexName(file) {
  const stem = file.slice(0, file.lastIndexOf("."));
  const hashAt = stem.lastIndexOf(".");
  return hashAt === -1 ? stem : stem.slice(0, hashAt);
}

const { dist, paths, runs } = parseArgs(process.argv.slice(2));
if (!fileFor(dist, "/")) {
  console.error(`${dist}/index.html não existe`);
  process.exit(1);
}

const server = await serve(dist);
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();

console.log(
  `Slow 4G aplicado: ${slow4G.latencyMs} ms, ${slow4G.downloadKbps} kbps de descida, ${slow4G.uploadKbps} kbps de subida, CPU ${slow4G.cpuSlowdown}×; ${runs} execuções; mediana (mín–máx) em ms`,
);
try {
  for (const pagePath of paths) {
    const samples = [];
    for (let run = 0; run < runs; run += 1) {
      samples.push(await measure(browser, origin, pagePath));
    }
    const last = samples.at(-1);
    const katexBytes = last.katex.reduce((sum, row) => sum + row.bytes, 0);
    const brandBytes = last.brand.reduce((sum, row) => sum + row.bytes, 0);
    const lastEnd = (rows) =>
      rows.length ? Math.max(...rows.map((row) => row.end)) : null;
    console.log(`\n${pagePath} (${last.formulas} .katex)`);
    console.log(
      `  KaTeX: ${last.katex.length} arquivos, ${katexBytes} bytes: ${last.katex
        .map((row) => katexName(row.file))
        .sort()
        .join(", ")}`,
    );
    console.log(`  marca: ${last.brand.length} arquivos, ${brandBytes} bytes`);
    console.log(
      `  tempo até a math (último KaTeX): ${spread(samples.map((s) => lastEnd(s.katex)))}`,
    );
    console.log(
      `  último .woff2 da marca:          ${spread(samples.map((s) => lastEnd(s.brand)))}`,
    );
    console.log(
      `  FCP:                             ${spread(samples.map((s) => s.fcp))}`,
    );
    console.log(
      `  LCP observado:                   ${spread(samples.map((s) => s.lcp))}`,
    );
  }
} finally {
  await browser.close();
  server.close();
}
