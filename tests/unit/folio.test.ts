import { describe, expect, it } from "vitest";
import {
  assertUniqueFolios,
  findFolioConflicts,
  formatFolio,
} from "../../src/lib/folio";

function entry(id: string, folio: number) {
  return { id, data: { folio } };
}

describe("fólio", () => {
  it("U1, série única", () => {
    const entries = [
      entry("2026-10-por-que-este-blog", 1),
      entry("2026-10-como-o-blog-e-feito", 2),
      entry("2026-10-rascunho-de-teste", 999),
    ];

    expect(findFolioConflicts(entries)).toEqual([]);
    expect(() => assertUniqueFolios(entries)).not.toThrow();
  });

  it("U2, fólio repetido", () => {
    const entries = [entry("a", 1), entry("b", 2), entry("c", 1)];

    expect(findFolioConflicts(entries)).toEqual([
      { folio: 1, ids: ["a", "c"] },
    ]);

    let message: string | undefined;
    try {
      assertUniqueFolios(entries);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) message = error.message;
    }
    expect(message).toBe("Fólio repetido: 1 em a, c");
  });

  it("N1, formatFolio de 1, 42 e 999", () => {
    expect(formatFolio(1)).toBe("Fól. 001");
    expect(formatFolio(42)).toBe("Fól. 042");
    expect(formatFolio(999)).toBe("Fól. 999");
  });
});
