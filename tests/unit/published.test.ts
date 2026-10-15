import { describe, expect, it } from "vitest";
import { selectPublished, shouldShowDrafts } from "../../src/lib/published";

type Entry = { id: string; data: { draft: boolean; pubDate: Date } };

function entry(id: string, draft: boolean, iso: string): Entry {
  return { id, data: { draft, pubDate: new Date(iso) } };
}

describe("shouldShowDrafts", () => {
  it("aceita a string exata true", () => {
    expect(shouldShowDrafts("true")).toBe(true);
  });

  it("rejeita undefined", () => {
    expect(shouldShowDrafts(undefined)).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(shouldShowDrafts("")).toBe(false);
  });

  it("rejeita false", () => {
    expect(shouldShowDrafts("false")).toBe(false);
  });

  it("rejeita TRUE", () => {
    expect(shouldShowDrafts("TRUE")).toBe(false);
  });

  it("rejeita 1", () => {
    expect(shouldShowDrafts("1")).toBe(false);
  });
});

describe("selectPublished", () => {
  const entries = [
    entry("b", false, "2026-01-01T00:00:00.000Z"),
    entry("a", false, "2026-01-01T00:00:00.000Z"),
    entry("c", true, "2026-06-01T00:00:00.000Z"),
  ];

  it("com false, remove rascunhos e ordena por data e id", () => {
    expect(selectPublished(entries, false).map((item) => item.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("com true, mantém rascunhos e ordena por data e id", () => {
    expect(selectPublished(entries, true).map((item) => item.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("não altera o array recebido", () => {
    const input = [
      entry("b", false, "2026-01-01T00:00:00.000Z"),
      entry("a", false, "2026-06-01T00:00:00.000Z"),
    ];
    const idsBefore = input.map((item) => item.id);

    selectPublished(input, true);

    expect(input.map((item) => item.id)).toEqual(idsBefore);
  });
});
