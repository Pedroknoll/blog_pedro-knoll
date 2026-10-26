import { gzipSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import { countPageJs } from "../../src/lib/page-js";

const postB = "blog/2026-10-como-o-blog-e-feito/index.html";

const islandMessage =
  "página com astro-island: o budget de RNF-02 vale para páginas sem island; a T-19 decide como contar";

function files(map: Record<string, string>) {
  return (path: string) => map[path];
}

function expectCount(
  html: string,
  pagePath: string,
  readFile: (path: string) => string | undefined,
  expected: { origin: string; content: string }[],
) {
  const run = () => countPageJs(html, pagePath, readFile);
  expect(run).not.toThrow();
  const result = run();
  const items = expected.map(({ origin, content }) => ({
    origin,
    gzipBytes: gzipSync(Buffer.from(content)).length,
  }));
  expect(result.items).toEqual(items);
  expect(result.total).toBe(
    items.reduce((sum, item) => sum + item.gzipBytes, 0),
  );
}

describe("countPageJs", () => {
  it("página sem script dá total 0", () => {
    const html = `<!DOCTYPE html><html><head><link rel="stylesheet" href="/styles.css"><title>Home</title></head><body><p>Oi</p></body></html>`;
    expectCount(html, "index.html", files({}), []);
  });

  it("JSON-LD é ignorado", () => {
    const html = `<!DOCTYPE html><html><head><script type="application/ld+json">{"@type":"BlogPosting"}</script><script type="application/json">{"a":1}</script></head><body></body></html>`;
    expectCount(html, "index.html", files({}), []);
  });

  it("script inline executável é contado", () => {
    const pages = [
      `<script type="module">const n=1;</script>`,
      `<script type="text/javascript">const n=2;</script>`,
      `<script type="application/javascript">const n=3;</script>`,
      `<script>const n=4;</script>`,
    ];
    const bodies = ["const n=1;", "const n=2;", "const n=3;", "const n=4;"];
    for (const [index, html] of pages.entries()) {
      expectCount(html, "index.html", files({}), [
        { origin: "inline:0", content: bodies[index] ?? "" },
      ]);
    }
  });

  it("script src é resolvido em dist/", () => {
    const content = "const hoisted=1;";
    const html = `<script src="/_astro/hoisted.abc123.js"></script>`;
    expectCount(html, postB, files({ "_astro/hoisted.abc123.js": content }), [
      { origin: "_astro/hoisted.abc123.js", content },
    ]);
  });

  it("modulepreload é contado", () => {
    const content = "export const chunk=1;";
    const html = `<link rel="modulepreload" href="/_astro/chunk.js">`;
    expectCount(html, postB, files({ "_astro/chunk.js": content }), [
      { origin: "_astro/chunk.js", content },
    ]);
  });

  it("cadeia de imports transitivos é contada e um ciclo não trava", () => {
    const sources = {
      "_astro/a.js": `import{b}from"./b.js";`,
      "_astro/b.js": `import'./c.js';export{a}from"./a.js";`,
      "_astro/c.js": `export const c=1;`,
    };
    const html = `<script type="module" src="/_astro/a.js"></script>`;
    expectCount(html, postB, files(sources), [
      { origin: "_astro/a.js", content: sources["_astro/a.js"] },
      { origin: "_astro/b.js", content: sources["_astro/b.js"] },
      { origin: "_astro/c.js", content: sources["_astro/c.js"] },
    ]);
  });

  it("o mesmo arquivo referenciado duas vezes conta uma vez", () => {
    const content = "export const a=1;";
    const html = `<script src="/_astro/a.js"></script><link rel="modulepreload" href="/_astro/a.js">`;
    expectCount(html, "index.html", files({ "_astro/a.js": content }), [
      { origin: "_astro/a.js", content },
    ]);
  });

  it("import() dinâmico não é seguido", () => {
    const content = `import("./lazy.js");export const a=1;`;
    const seen: string[] = [];
    const readFile = (path: string) => {
      seen.push(path);
      if (path === "_astro/a.js") return content;
      return `export const lazy=${"x".repeat(200)};`;
    };
    const html = `<script type="module" src="/_astro/a.js"></script>`;
    expectCount(html, postB, readFile, [{ origin: "_astro/a.js", content }]);
    expect(seen).not.toContain("_astro/lazy.js");
  });

  it.each([
    "https://cdn.example/app.js",
    "http://cdn.example/app.js",
    "//cdn.example/app.js",
  ])("src externo %s dá erro", (src) => {
    const html = `<script src="${src}"></script>`;
    expect(() => countPageJs(html, "index.html", files({}))).toThrow(
      `referência externa: ${src}`,
    );
  });

  it("arquivo inexistente dá erro", () => {
    const html = `<script src="/nao-existe.js"></script>`;
    expect(() => countPageJs(html, "index.html", files({}))).toThrow(
      "arquivo inexistente: nao-existe.js",
    );
  });

  it("astro-island dá erro", () => {
    const html = `<astro-island uid="abc" component-url="/_astro/Widget.js" component-export="default" renderer-url="/_astro/renderer.js" props="{}" ssr client="load"></astro-island>`;
    expect(() =>
      countPageJs(
        html,
        postB,
        files({ "_astro/Widget.js": "export default 1;" }),
      ),
    ).toThrow(islandMessage);
  });

  it("atributos em ordem diferente e aspas simples ou duplas", () => {
    const content = "export const app=1;";
    const readFile = files({ "js/app.js": content });
    const documents = [
      `<script type="module" src="/js/app.js"></script>`,
      `<script src='/js/app.js' type='module'></script>`,
      `<link rel="modulepreload" href="/js/app.js">`,
      `<link href='/js/app.js' rel='modulepreload'>`,
    ];
    for (const html of documents) {
      expectCount(html, "index.html", readFile, [
        { origin: "js/app.js", content },
      ]);
    }
  });

  it("HTML minificado numa linha só", () => {
    const pre = "export const pre=1;";
    const app = `import"./pre.js";export const app=1;`;
    const inline = "const n=1;";
    const html = `<!DOCTYPE html><html><head><script type="application/ld+json">{"@type":"BlogPosting"}</script><link rel="modulepreload" href="/_astro/pre.js" crossorigin><script type="module" src="/_astro/app.js" crossorigin></script></head><body><script type="module">${inline}</script></body></html>`;
    expectCount(
      html,
      postB,
      files({
        "_astro/pre.js": pre,
        "_astro/app.js": app,
      }),
      [
        { origin: "_astro/pre.js", content: pre },
        { origin: "_astro/app.js", content: app },
        { origin: "inline:0", content: inline },
      ],
    );
  });

  it("src relativo no HTML resolve a partir da página", () => {
    const content = "export const app=1;";
    const html = `<script src="app.js"></script>`;
    expectCount(
      html,
      postB,
      files({ "blog/2026-10-como-o-blog-e-feito/app.js": content }),
      [{ origin: "blog/2026-10-como-o-blog-e-feito/app.js", content }],
    );
  });

  it("import com ../ resolve a partir do módulo", () => {
    const x = `import"../y.js";`;
    const y = "export const y=1;";
    const html = `<script type="module" src="/_astro/sub/x.js"></script>`;
    expectCount(
      html,
      postB,
      files({
        "_astro/sub/x.js": x,
        "_astro/y.js": y,
      }),
      [
        { origin: "_astro/sub/x.js", content: x },
        { origin: "_astro/y.js", content: y },
      ],
    );
  });

  it("caminho que sai de dist/ dá erro", () => {
    const html = `<script src="../../../fora.js"></script>`;
    expect(() => countPageJs(html, postB, files({}))).toThrow(
      /^arquivo inexistente: .*fora\.js$/,
    );
  });

  it("import em script inline vem logo depois de quem importa", () => {
    const inline = `import"/_astro/shared.js";const n=1;`;
    const shared = "export const shared=1;";
    const html = `<script type="module">${inline}</script>`;
    expectCount(html, postB, files({ "_astro/shared.js": shared }), [
      { origin: "inline:0", content: inline },
      { origin: "_astro/shared.js", content: shared },
    ]);
  });

  it("JSON-LD não consome índice de inline", () => {
    const first = "const a=1;";
    const second = "const b=2;";
    const html = `<script>${first}</script><script type="application/ld+json">{}</script><script type="module">${second}</script>`;
    expectCount(html, "index.html", files({}), [
      { origin: "inline:0", content: first },
      { origin: "inline:1", content: second },
    ]);
  });

  it("import para arquivo ausente dentro de módulo dá erro", () => {
    const html = `<script type="module" src="/_astro/a.js"></script>`;
    expect(() =>
      countPageJs(
        html,
        "index.html",
        files({ "_astro/a.js": `import"./missing.js";` }),
      ),
    ).toThrow("arquivo inexistente: _astro/missing.js");
  });
});
