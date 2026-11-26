import { describe, expect, it } from "vitest";

import { relatedPosts } from "../../src/lib/related";

function post(id: string, tags: string[], date: string) {
  return { id, data: { tags, pubDate: new Date(`${date}T00:00:00.000Z`) } };
}

const ids = (posts: { id: string }[]) => posts.map((item) => item.id);

describe("relatedPosts (RF-18)", () => {
  it("nunca devolve o próprio post", () => {
    const current = post("a", ["x"], "2026-01-01");
    const other = post("b", ["x"], "2026-01-02");
    expect(ids(relatedPosts(current, [current, other]))).toEqual(["b"]);
  });

  it("sem tag em comum, devolve vazio", () => {
    const current = post("a", ["x"], "2026-01-01");
    const posts = [current, post("b", ["y"], "2026-01-02")];
    expect(relatedPosts(current, posts)).toEqual([]);
  });

  it("ordena pelo número de tags em comum antes da data", () => {
    const current = post("a", ["x", "y"], "2026-01-01");
    const posts = [
      current,
      post("recente", ["x"], "2026-05-01"),
      post("antigo", ["x", "y"], "2025-01-01"),
    ];
    expect(ids(relatedPosts(current, posts))).toEqual(["antigo", "recente"]);
  });

  it("no empate, o mais recente primeiro", () => {
    const current = post("a", ["x"], "2026-01-01");
    const posts = [
      post("b", ["x"], "2026-01-02"),
      current,
      post("c", ["x"], "2026-03-01"),
    ];
    expect(ids(relatedPosts(current, posts))).toEqual(["c", "b"]);
  });

  it("corta em 2", () => {
    const current = post("a", ["x"], "2026-01-01");
    const posts = [
      current,
      ...["b", "c", "d", "e"].map((id, index) =>
        post(id, ["x"], `2026-02-0${index + 1}`),
      ),
    ];
    expect(ids(relatedPosts(current, posts))).toEqual(["e", "d"]);
  });

  it("tag repetida não conta em dobro", () => {
    const current = post("a", ["x", "y"], "2026-01-01");
    const posts = [
      current,
      post("repetida", ["x", "x"], "2026-05-01"),
      post("duas", ["x", "y"], "2025-01-01"),
    ];
    expect(ids(relatedPosts(current, posts))).toEqual(["duas", "repetida"]);
  });

  it("não muda a lista recebida", () => {
    const current = post("a", ["x"], "2026-01-01");
    const posts = [
      post("b", ["x"], "2026-01-02"),
      current,
      post("c", ["x"], "2026-03-01"),
    ];
    const before = ids(posts);
    relatedPosts(current, posts);
    expect(ids(posts)).toEqual(before);
  });
});
