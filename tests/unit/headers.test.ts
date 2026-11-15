import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  buildHeaders,
  cacheHeaders,
  effectiveHeaders,
  extractHashes,
  validateHeaders,
} from "../../src/integrations/headers";

function token(content: string): string {
  const digest = createHash("sha256").update(content).digest("base64");
  return `'sha256-${digest}'`;
}

function ruleFile(count: number): string {
  return Array.from({ length: count }, (_, index) => `/r${index}`).join("\n");
}

function directivesOf(policy: string): Record<string, string> {
  const found: Record<string, string> = {};
  for (const part of policy.split("; ")) {
    const space = part.indexOf(" ");
    found[part.slice(0, space)] = part.slice(space + 1);
  }
  return found;
}

describe("extractHashes", () => {
  it("ignora src e ld+json", () => {
    const html = [
      '<script src="/app.js">var fromSrc = 1;</script>',
      '<script type="module" src="/mod.js">var fromModule = 1;</script>',
      '<script type="application/ld+json">{"@type":"Blog"}</script>',
    ].join("");
    expect(extractHashes(html).scripts).toEqual([]);
  });

  it("pega module e clássico", () => {
    const classic = "var classic = 1;";
    const asModule = "var asModule = 1;";
    const html = `<script type="module">${asModule}</script><script>${classic}</script>`;
    expect(extractHashes(html).scripts).toEqual(
      [token(classic), token(asModule)].sort(),
    );
  });

  it("pega <style> de HTML e de SVG", () => {
    const htmlStyle = "\n  html{color:red}\n";
    const svgStyle = ".n{fill:&amp;}";
    const html = `<style type="text/css">${htmlStyle}</style>`;
    const svg = `<svg><style>${svgStyle}</style></svg>`;
    expect(extractHashes(html).styles).toEqual([token(htmlStyle)]);
    expect(extractHashes(svg).styles).toEqual([token(svgStyle)]);
  });

  it("devolve um hash quando o bloco se repete", () => {
    const body = "var n = 1;";
    const html = `<script>${body}</script><script>${body}</script>`;
    expect(extractHashes(html).scripts).toEqual([token(body)]);
  });
});

describe("buildHeaders", () => {
  it("escreve os quatro headers e cada diretiva", () => {
    const alpha = "'sha256-aaa'";
    const beta = "'sha256-bbb'";
    const text = buildHeaders({
      scripts: [beta, alpha, alpha],
      styles: [beta, alpha, beta],
    });
    const lines = text.split("\n").filter((line) => line !== "");
    expect(lines.filter((line) => !line.startsWith(" "))).toEqual(["/*"]);
    const applied = effectiveHeaders(text, "/");
    expect(applied.get("strict-transport-security")).toEqual([
      "max-age=63072000; includeSubDomains",
    ]);
    expect(applied.get("x-content-type-options")).toEqual(["nosniff"]);
    expect(applied.get("referrer-policy")).toEqual([
      "strict-origin-when-cross-origin",
    ]);
    const policies = applied.get("content-security-policy");
    expect(policies).toHaveLength(1);
    expect(directivesOf(policies?.[0] ?? "")).toEqual({
      "default-src": "'none'",
      "script-src": `'self' ${alpha} ${beta}`,
      "style-src": "'self' 'unsafe-inline'",
      "style-src-elem": `'self' ${alpha} ${beta}`,
      "style-src-attr": "'unsafe-inline'",
      "img-src": "'self'",
      "font-src": "'self' data:",
      "connect-src": "'self'",
      "base-uri": "'none'",
      "form-action": "'none'",
      "frame-ancestors": "'self'",
    });
  });
});

describe("validateHeaders", () => {
  it("falha com 101 regras", () => {
    expect(() => validateHeaders(ruleFile(101))).toThrow("100 regras");
  });

  it("falha com uma linha de 2.001 caracteres", () => {
    expect(() => validateHeaders("a".repeat(2001))).toThrow("2.000 caracteres");
  });

  it("aceita 100 regras e uma linha de 2.000 caracteres", () => {
    expect(() => validateHeaders(ruleFile(100))).not.toThrow();
    expect(() => validateHeaders("a".repeat(2000))).not.toThrow();
  });
});

describe("effectiveHeaders", () => {
  it("deixa uma CSP, a outra, em /blog/a/", () => {
    const text = [
      "/*",
      "  Content-Security-Policy: global",
      "/blog/*",
      "  ! Content-Security-Policy",
      "  Content-Security-Policy: outra",
    ].join("\n");
    expect(
      effectiveHeaders(text, "/blog/a/").get("content-security-policy"),
    ).toEqual(["outra"]);
  });

  it("repete o header sem ! em duas entradas", () => {
    const text = [
      "/*",
      "  X-Content-Type-Options: nosniff",
      "/blog/*",
      "  X-Content-Type-Options: outra",
    ].join("\n");
    expect(
      effectiveHeaders(text, "/blog/a/").get("x-content-type-options"),
    ).toEqual(["nosniff", "outra"]);
  });

  it("casa um splat e :slug/:nome", () => {
    const text = [
      "/assets/*",
      "  X-Content-Type-Options: splat",
      "/notebooks/:slug/:nome/assets/*",
      "  X-Content-Type-Options: exportado",
    ].join("\n");
    expect(
      effectiveHeaders(text, "/assets/x.js").get("x-content-type-options"),
    ).toEqual(["splat"]);
    expect(
      effectiveHeaders(text, "/notebooks/a/b/assets/x.js").get(
        "x-content-type-options",
      ),
    ).toEqual(["exportado"]);
    expect(
      effectiveHeaders(text, "/notebooks/a/assets/x.js").get(
        "x-content-type-options",
      ),
    ).toBeUndefined();
  });
});

describe("cacheHeaders", () => {
  const immutable = ["public, max-age=31536000, immutable"];

  function headersText(): string {
    return buildHeaders({ scripts: [], styles: [] }) + cacheHeaders();
  }

  it("cache de um ano no primeiro nível de /_astro/", () => {
    const text = headersText();
    const lines = text.split("\n").filter((line) => line !== "");
    expect(lines.filter((line) => !line.startsWith(" "))).toEqual([
      "/*",
      "/_astro/:file",
    ]);
    for (const pathname of [
      "/_astro/BaseLayout.DLRftG8w.css",
      "/_astro/KaTeX_Main-Regular.B22Nviop.woff2",
    ]) {
      expect(effectiveHeaders(text, pathname).get("cache-control")).toEqual(
        immutable,
      );
    }
  });

  it("sem Cache-Control fora dele", () => {
    const text = headersText();
    for (const pathname of [
      "/_astro/fonts/0123456789abcdef.woff2",
      "/",
      "/blog/a/",
      "/favicon.svg",
      "/notebooks/a/b/assets/x.js",
    ]) {
      expect(
        effectiveHeaders(text, pathname).get("cache-control"),
        pathname,
      ).toBeUndefined();
    }
  });
});
