import { describe, expect, it } from "vitest";
import {
  distLeaksFixtures,
  postsGlobPattern,
  selectPublished,
  shouldShowDrafts,
  shouldShowFixtures,
} from "../../src/lib/published";

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

describe("shouldShowFixtures", () => {
  it("aceita a string exata true", () => {
    expect(shouldShowFixtures("true")).toBe(true);
  });

  it("rejeita undefined", () => {
    expect(shouldShowFixtures(undefined)).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(shouldShowFixtures("")).toBe(false);
  });

  it("rejeita false", () => {
    expect(shouldShowFixtures("false")).toBe(false);
  });

  it("rejeita TRUE", () => {
    expect(shouldShowFixtures("TRUE")).toBe(false);
  });

  it("rejeita 1", () => {
    expect(shouldShowFixtures("1")).toBe(false);
  });
});

describe("postsGlobPattern", () => {
  it("com a flag, inclui todas as pastas", () => {
    expect(postsGlobPattern(true)).toBe("**/index.{md,mdx}");
  });

  it("sem a flag, nega fixture-*", () => {
    expect(postsGlobPattern(false)).toEqual([
      "**/index.{md,mdx}",
      "!fixture-*/**",
    ]);
  });
});

describe("distLeaksFixtures", () => {
  it("vaza quando existe a pasta blog/fixture-*", () => {
    expect(distLeaksFixtures(["blog/fixture-md"], [])).toBe(true);
    expect(distLeaksFixtures(["blog/fixture-sem-titulos"], [])).toBe(true);
  });

  it("vaza quando o texto contém /blog/fixture-", () => {
    expect(distLeaksFixtures([], ['<a href="/blog/fixture-md/">'])).toBe(true);
  });

  it("não vaza num dist só com posts reais", () => {
    expect(
      distLeaksFixtures(
        ["blog/2026-10-por-que-este-blog"],
        ['<a href="/blog/2026-10-por-que-este-blog/">'],
      ),
    ).toBe(false);
  });

  it("não trata pasta aninhada nem menção sem o prefixo como vazamento", () => {
    expect(distLeaksFixtures(["blog/fixture-md/figs"], [])).toBe(false);
    expect(distLeaksFixtures(["blog/fixture"], ["fixture-md"])).toBe(false);
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
