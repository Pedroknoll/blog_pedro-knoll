import { describe, expect, it } from "vitest";

import { rankPosts, type CatalogPost } from "../../src/lib/ranking";

function post(slug: string, date: string, title = slug): CatalogPost {
  return {
    slug,
    title,
    date,
    kind: "article",
    minutes: 4,
    tags: ["t"],
  };
}

const catalog = [
  post("novo", "2026-06-01", "Novo"),
  post("empate-b", "2026-05-01", "Empate B"),
  post("empate-a", "2026-05-01", "Empate A"),
  post("antigo", "2026-01-01", "Antigo"),
  post("zero", "2026-07-01", "Zero"),
];

describe("rankPosts", () => {
  it("ignora quem tem menos de 1 voto e quem não está no catálogo", () => {
    const ranked = rankPosts(catalog, {
      novo: 1,
      zero: 0,
      antigo: 2,
      fora: 9,
    });
    expect(ranked.map((item) => item.slug)).toEqual(["antigo", "novo"]);
  });

  it("ordena por votos e, no empate, pela data mais recente e pelo slug", () => {
    const ranked = rankPosts(catalog, {
      novo: 3,
      "empate-b": 3,
      "empate-a": 3,
      antigo: 5,
      zero: 0,
    });
    expect(ranked.map((item) => item.slug)).toEqual([
      "antigo",
      "novo",
      "empate-a",
      "empate-b",
    ]);
  });

  it("limita em 10 e, sem limite, devolve todos os que têm voto", () => {
    const many = Array.from({ length: 12 }, (_, index) => {
      const slug = `p${String(index).padStart(2, "0")}`;
      return post(slug, `2026-01-${String(index + 1).padStart(2, "0")}`);
    });
    const votes = Object.fromEntries(many.map((item) => [item.slug, 1]));
    const limited = rankPosts(many, votes, 10).map((item) => item.slug);
    expect(limited).toEqual([
      "p11",
      "p10",
      "p09",
      "p08",
      "p07",
      "p06",
      "p05",
      "p04",
      "p03",
      "p02",
    ]);
    expect(rankPosts(many, votes).map((item) => item.slug)).toHaveLength(12);
  });
});
