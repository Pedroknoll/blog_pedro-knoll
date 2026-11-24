import { describe, expect, it } from "vitest";

import { homeLists } from "../../src/lib/home-lists";

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
