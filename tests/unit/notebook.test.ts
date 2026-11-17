import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  molabUrl,
  notebookRef,
  notebookRepoPath,
} from "../../src/lib/notebook";
import { remarkNotebook } from "../../src/lib/remark-notebook.mjs";

const base = "https://molab.marimo.io/github/Pedroknoll/blog_pedro-knoll/blob";
const path = "src/content/posts/fixture-mdx/notebooks/leve.py";
const sha = "a32301baf99e49f310a46ab97cc2a603532d1851";
const root = "/repo";
const mdx = "/repo/src/content/posts/fixture-mdx/index.mdx";

function tree(src: unknown) {
  return {
    type: "root",
    children: [
      {
        type: "mdxJsxFlowElement",
        name: "Notebook",
        attributes: [{ type: "mdxJsxAttribute", name: "src", value: src }],
        children: [],
      },
    ],
  };
}

describe("molabUrl", () => {
  it("leva ao /wasm por padrão", () => {
    expect(molabUrl(path, "main", false)).toBe(`${base}/main/${path}/wasm`);
  });
  it("com gpu, o mesmo link sem /wasm", () => {
    expect(molabUrl(path, "main", true)).toBe(`${base}/main/${path}`);
  });
  it("usa a ref recebida", () => {
    expect(molabUrl(path, sha, false)).toBe(`${base}/${sha}/${path}/wasm`);
  });
  it("recusa o src sem o caminho do repositório", () => {
    expect(() => molabUrl("./notebooks/leve.py", "main", false)).toThrow(
      "Caderno sem o caminho do repositório: ./notebooks/leve.py (importe o componente como Notebook)",
    );
  });
});

describe("notebookRef", () => {
  it("main sem a variável", () => {
    expect(notebookRef(undefined)).toBe("main");
    expect(notebookRef("")).toBe("main");
  });
  it("o commit do PR", () => {
    expect(notebookRef(sha)).toBe(sha);
  });
  it("recusa ref com barra", () => {
    expect(() => notebookRef("post/x")).toThrow(
      "NOTEBOOK_REF inválido: post/x",
    );
  });
});

describe("notebookRepoPath", () => {
  it("caminho do repositório a partir do post", () => {
    expect(notebookRepoPath(mdx, "./notebooks/leve.py", root, () => true)).toBe(
      path,
    );
  });
  it("arquivo que não existe", () => {
    expect(() =>
      notebookRepoPath(mdx, "./notebooks/leve.py", root, () => false),
    ).toThrow(`Caderno não encontrado: ./notebooks/leve.py em ${mdx}`);
  });
  it.each([
    "../fixture-md/notebooks/leve.py",
    "./notebooks/sub/leve.py",
    "./notebooks/leve.ipynb",
    "notebooks/leve.py",
    undefined,
  ])("fora de ./notebooks/: %s", (src) => {
    expect(() => notebookRepoPath(mdx, src, root, () => true)).toThrow(
      `Caderno fora de ./notebooks/<nome>.py: ${String(src)} em ${mdx}`,
    );
  });
});

describe("remarkNotebook", () => {
  const post = fileURLToPath(
    new URL("../../src/content/posts/fixture-mdx/index.mdx", import.meta.url),
  );
  it("quebra o build com caderno inexistente", () => {
    expect(() =>
      remarkNotebook()(tree("./notebooks/nao-existe.py"), { path: post }),
    ).toThrow(`Caderno não encontrado: ./notebooks/nao-existe.py em ${post}`);
  });
});
