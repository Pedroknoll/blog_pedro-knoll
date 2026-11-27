import { describe, expect, it } from "vitest";

import { lighthouseScope } from "../../src/lib/lighthouse-scope";

const postA = "src/content/posts/2026-10-por-que-este-blog";
const postB = "src/content/posts/2026-10-como-o-blog-e-feito";

describe("lighthouseScope [RNF-01, RNF-14]", () => {
  it("só um post mede a home e esse post", () => {
    expect(
      lighthouseScope([`${postA}/index.mdx`, `${postA}/figs/A.astro`]),
    ).toEqual({ mode: "posts", posts: ["2026-10-por-que-este-blog"] });
  });

  it("dois posts saem ordenados e sem repetição", () => {
    expect(
      lighthouseScope([
        `${postB}/index.mdx`,
        `${postA}/index.mdx`,
        `${postB}/data/raw/x.csv`,
      ]),
    ).toEqual({
      mode: "posts",
      posts: ["2026-10-como-o-blog-e-feito", "2026-10-por-que-este-blog"],
    });
  });

  it("post junto com código compartilhado mede tudo", () => {
    expect(
      lighthouseScope([`${postA}/index.mdx`, "src/layouts/PostLayout.astro"]),
    ).toEqual({ mode: "full", posts: [] });
    expect(
      lighthouseScope([`${postA}/index.mdx`, ".github/workflows/ci.yml"]),
    ).toEqual({ mode: "full", posts: [] });
  });

  it("fixture mede tudo", () => {
    expect(
      lighthouseScope(["src/content/posts/fixture-mdx/index.mdx"]),
    ).toEqual({ mode: "full", posts: [] });
  });

  it("arquivo solto em src/content/posts/ mede tudo", () => {
    expect(lighthouseScope(["src/content/posts/README.md"])).toEqual({
      mode: "full",
      posts: [],
    });
  });

  it("diff vazio mede tudo", () => {
    expect(lighthouseScope([])).toEqual({ mode: "full", posts: [] });
    expect(lighthouseScope(["", "  "])).toEqual({ mode: "full", posts: [] });
  });

  it("dependência mede tudo", () => {
    expect(lighthouseScope(["package.json"])).toEqual({
      mode: "full",
      posts: [],
    });
  });
});
