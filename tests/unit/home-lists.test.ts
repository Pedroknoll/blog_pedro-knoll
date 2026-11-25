import { describe, expect, it } from "vitest";

import { homeLinks, homeLists, thumbnailOf } from "../../src/lib/home-lists";

function post(id: string, kind: "article" | "prototype") {
  return { id, data: { kind } };
}

describe("homeLists", () => {
  it("corta recentes e protótipos em 5, na ordem recebida", () => {
    const posts = [
      ...Array.from({ length: 6 }, (_, index) => post(`a${index}`, "article")),
      ...Array.from({ length: 6 }, (_, index) =>
        post(`p${index}`, "prototype"),
      ),
    ];
    const lists = homeLists(posts);
    expect(lists.recent.map((item) => item.id)).toEqual([
      "a0",
      "a1",
      "a2",
      "a3",
      "a4",
    ]);
    expect(lists.prototypes.map((item) => item.id)).toEqual([
      "p0",
      "p1",
      "p2",
      "p3",
      "p4",
    ]);
    expect(lists.totals).toEqual({ posts: 12, prototypes: 6 });
  });

  it("devolve protótipos vazios quando não há protótipo publicado", () => {
    const posts = [post("a0", "article"), post("a1", "article")];
    expect(homeLists(posts).prototypes).toEqual([]);
    expect(homeLists(posts).recent.map((item) => item.id)).toEqual([
      "a0",
      "a1",
    ]);
    expect(homeLists(posts).totals).toEqual({ posts: 2, prototypes: 0 });
  });
});

describe("homeLinks", () => {
  it("traz o número no plural e a seta só no texto visível", () => {
    expect(homeLinks({ posts: 12, prototypes: 3 })).toEqual({
      posts: { text: "Todos os 12 posts →", name: "Todos os 12 posts" },
      prototypes: {
        text: "Todos os 3 protótipos →",
        name: "Todos os 3 protótipos",
      },
      ranking: { text: "Ver ranking →", name: "Ver ranking" },
    });
  });

  it("vai para o singular com 1", () => {
    const links = homeLinks({ posts: 1, prototypes: 1 });
    expect(links.posts).toEqual({
      text: "O único post →",
      name: "O único post",
    });
    expect(links.prototypes).toEqual({
      text: "O único protótipo →",
      name: "O único protótipo",
    });
  });
});

describe("thumbnailOf", () => {
  it("usa a capa quando existe", () => {
    const cover = { src: "/c.png", width: 800, height: 600, format: "png" };
    expect(thumbnailOf(cover)).toEqual({ kind: "cover", cover });
  });

  it("cai no bloco sem capa", () => {
    expect(thumbnailOf(undefined)).toEqual({ kind: "block" });
  });
});
