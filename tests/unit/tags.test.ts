import { describe, expect, it } from "vitest";
import { selectPublished } from "../../src/lib/published";
import { collectTags, postsWithTag, tagPath } from "../../src/lib/tags";

type Entry = { id: string; data: { tags: string[] } };

function entry(id: string, tags: string[]): Entry {
  return { id, data: { tags } };
}

describe("collectTags", () => {
  it("U1 lista vazia dá []", () => {
    expect(collectTags([])).toEqual([]);
  });

  it("U2 post com tags vazias não contribui", () => {
    expect(collectTags([entry("a", [])])).toEqual([]);
  });

  it("U3 tag compartilhada aparece uma vez", () => {
    expect(
      collectTags([
        entry("a", ["comum", "alfa"]),
        entry("b", ["comum", "beta"]),
      ]),
    ).toEqual(["alfa", "beta", "comum"]);
  });

  it("U4 tag repetida no mesmo post aparece uma vez", () => {
    expect(collectTags([entry("a", ["nlp", "nlp"])])).toEqual(["nlp"]);
  });

  it("U5 ordem alfabética", () => {
    expect(collectTags([entry("a", ["zeta", "alfa", "mu"])])).toEqual([
      "alfa",
      "mu",
      "zeta",
    ]);
  });

  it("U6 tag só de rascunho depende de selectPublished", () => {
    const entries = [
      {
        id: "rascunho",
        data: {
          draft: true,
          pubDate: new Date("2026-03-01T00:00:00.000Z"),
          tags: ["so-rascunho"],
        },
      },
      {
        id: "publicado",
        data: {
          draft: false,
          pubDate: new Date("2026-01-01T00:00:00.000Z"),
          tags: ["publica"],
        },
      },
    ];

    expect(collectTags(selectPublished(entries, false))).toEqual(["publica"]);
    expect(collectTags(selectPublished(entries, true))).toEqual([
      "publica",
      "so-rascunho",
    ]);
  });
});

describe("postsWithTag", () => {
  it("U7 devolve os posts da tag na ordem de entrada", () => {
    const posts = [
      entry("c", ["nlp"]),
      entry("a", ["outra"]),
      entry("b", ["nlp", "ml"]),
    ];

    expect(postsWithTag(posts, "nlp").map((post) => post.id)).toEqual([
      "c",
      "b",
    ]);
  });

  it("U8 tag inexistente dá []", () => {
    expect(postsWithTag([entry("a", ["nlp"])], "ausente")).toEqual([]);
  });

  it("U9 igualdade exata", () => {
    expect(postsWithTag([entry("a", ["mlops"])], "ml")).toEqual([]);
  });

  it("U10 post com a tag repetida aparece uma vez", () => {
    const posts = [entry("a", ["nlp", "nlp"]), entry("b", ["outra"])];

    expect(postsWithTag(posts, "nlp").map((post) => post.id)).toEqual(["a"]);
  });
});

describe("tagPath", () => {
  it("U11 nlp dá /tags/nlp/", () => {
    expect(tagPath("nlp")).toBe("/tags/nlp/");
  });
});
