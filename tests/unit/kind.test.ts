import { describe, expect, it } from "vitest";

import {
  KINDS,
  KIND_LABELS,
  KIND_SLUGS,
  kindCountText,
  kindCountWord,
  kindCounts,
  kindFromSlug,
  kindPath,
  postsWithKind,
  type Kind,
} from "../../src/lib/kind";
import { selectPublished } from "../../src/lib/published";

const slugPattern = /^[a-z0-9-]+$/;

describe("kind", () => {
  it("slugs exatos, únicos e no padrão", () => {
    expect(KINDS).toEqual(["article", "prototype"]);
    expect(KIND_LABELS).toEqual({
      article: "Artigo",
      prototype: "Protótipo",
    });
    expect(KIND_SLUGS).toEqual({
      article: "artigos",
      prototype: "prototipos",
    });
    expect(kindPath("article")).toBe("/tipos/artigos/");
    const slugs = KINDS.map((kind) => KIND_SLUGS[kind]);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(slugPattern);
  });

  it("kindPath termina com barra", () => {
    for (const kind of KINDS) {
      expect(kindPath(kind)).toBe(`/tipos/${KIND_SLUGS[kind]}/`);
    }
  });

  it("kindFromSlug ida e volta e slug desconhecido", () => {
    for (const kind of KINDS) {
      expect(kindFromSlug(KIND_SLUGS[kind])).toBe(kind);
    }
    expect(kindFromSlug("ausente")).toBeUndefined();
  });

  it("contagem na ordem de KINDS e sem o tipo vazio", () => {
    const posts = [
      { data: { kind: "prototype" as Kind } },
      { data: { kind: "article" as Kind } },
      { data: { kind: "article" as Kind } },
    ];
    expect(kindCounts(posts)).toEqual([
      { kind: "article", count: 2 },
      { kind: "prototype", count: 1 },
    ]);
    expect(kindCounts([{ data: { kind: "article" as Kind } }])).toEqual([
      { kind: "article", count: 1 },
    ]);
  });

  it("tipo só com rascunho fica de fora da publicação", () => {
    const entries = [
      {
        id: "artigo",
        data: {
          kind: "article" as Kind,
          draft: false,
          pubDate: new Date("2026-01-02"),
        },
      },
      {
        id: "rascunho",
        data: {
          kind: "prototype" as Kind,
          draft: true,
          pubDate: new Date("2026-01-03"),
        },
      },
    ];
    expect(kindCounts(selectPublished(entries, false))).toEqual([
      { kind: "article", count: 1 },
    ]);
    expect(kindCounts(selectPublished(entries, true))).toEqual([
      { kind: "article", count: 1 },
      { kind: "prototype", count: 1 },
    ]);
  });

  it("filtra o tipo e preserva a ordem", () => {
    const posts = [
      { id: "a", data: { kind: "article" as Kind } },
      { id: "p", data: { kind: "prototype" as Kind } },
      { id: "a2", data: { kind: "article" as Kind } },
    ];
    expect(postsWithKind(posts, "article").map((post) => post.id)).toEqual([
      "a",
      "a2",
    ]);
  });

  it("texto da contagem", () => {
    expect(kindCountWord(1)).toBe("post");
    expect(kindCountWord(2)).toBe("posts");
    expect(kindCountText(1)).toBe("1 post");
    expect(kindCountText(2)).toBe("2 posts");
  });
});
