import { describe, expect, it } from "vitest";

import {
  ORDERS,
  orderFromSearch,
  sortRows,
  withParam,
} from "../../src/lib/list-order";

const rows = [
  { index: 0, slug: "d", date: "2026-11-20" },
  { index: 1, slug: "b", date: "2026-11-10" },
  { index: 2, slug: "a", date: "2026-11-10" },
  { index: 3, slug: "c", date: "2026-11-01" },
];

function slugs(list: readonly { slug: string }[]) {
  return list.map((row) => row.slug);
}

describe("ORDERS", () => {
  it("tem o padrão sem valor e as duas ordens da URL", () => {
    expect(ORDERS.map((order) => [order.value, order.label])).toEqual([
      ["", "Mais recentes"],
      ["antigos", "Mais antigos"],
      ["votados", "Mais votados"],
    ]);
  });
});

describe("sortRows", () => {
  it("o padrão devolve a ordem original do HTML", () => {
    const shuffled = [rows[2], rows[0], rows[3], rows[1]].filter(
      (row) => row !== undefined,
    );
    expect(slugs(sortRows(shuffled, null))).toEqual(["d", "b", "a", "c"]);
  });

  it("antigos: data crescente e, no empate, o slug", () => {
    expect(slugs(sortRows(rows, "antigos"))).toEqual(["c", "a", "b", "d"]);
  });

  it("votados: votos decrescentes, com 0 incluído, e empate pela data mais recente e pelo slug", () => {
    const votes = { a: 2, b: 2, c: 5 };
    expect(slugs(sortRows(rows, "votados", votes))).toEqual([
      "c",
      "a",
      "b",
      "d",
    ]);
    expect(slugs(sortRows(rows, "votados", { d: 1, c: 1 }))).toEqual([
      "d",
      "c",
      "a",
      "b",
    ]);
  });

  it("não muda a lista de entrada", () => {
    const copy = [...rows];
    sortRows(rows, "antigos");
    expect(rows).toEqual(copy);
  });
});

describe("orderFromSearch", () => {
  const all = ["antigos", "votados"] as const;

  it("lê o valor válido", () => {
    expect(orderFromSearch("?ordem=antigos", all)).toBe("antigos");
    expect(orderFromSearch("tag=md&ordem=votados", all)).toBe("votados");
    expect(orderFromSearch("?ordem=curtos", all)).toBeNull();
  });

  it("devolve null para o padrão, o vazio e o inválido", () => {
    expect(orderFromSearch("", all)).toBeNull();
    expect(orderFromSearch("?ordem=", all)).toBeNull();
    expect(orderFromSearch("?ordem=xyz", all)).toBeNull();
    expect(orderFromSearch("?tag=md", all)).toBeNull();
  });

  it("devolve null para uma ordem indisponível", () => {
    expect(orderFromSearch("?ordem=votados", ["antigos"])).toBeNull();
  });
});

describe("withParam", () => {
  it("grava um parâmetro e mantém os outros", () => {
    expect(withParam("?tag=md", "ordem", "antigos")).toBe(
      "?tag=md&ordem=antigos",
    );
    expect(withParam("?tag=md&ordem=antigos", "tag", "mdx")).toBe(
      "?tag=mdx&ordem=antigos",
    );
    expect(withParam("", "ordem", "votados")).toBe("?ordem=votados");
  });

  it("tira o parâmetro e a interrogação quando nada sobra", () => {
    expect(withParam("?tag=md&ordem=antigos", "ordem", null)).toBe("?tag=md");
    expect(withParam("?ordem=antigos", "ordem", null)).toBe("");
    expect(withParam("ordem=antigos", "ordem", null)).toBe("");
  });
});
