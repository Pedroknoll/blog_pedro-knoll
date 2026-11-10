import { describe, expect, it } from "vitest";

import {
  type Step,
  assertHighlight,
  clampIndex,
  stepTable,
  stepText,
  stepperFrame,
} from "../../src/lib/viz/steps";

const steps: Step[] = [
  { label: "O destaque começa na primeira casa.", highlight: [0, 0] },
  { label: "O destaque anda uma coluna.", highlight: [0, 1] },
  { label: "O destaque desce uma linha.", highlight: [1, 1] },
];

describe("clampIndex", () => {
  it("prende o índice no intervalo", () => {
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(9, 3)).toBe(2);
    expect(clampIndex(1, 3)).toBe(1);
  });
});

describe("stepText", () => {
  it("passo 1 e passo 3", () => {
    expect(stepText(0, steps)).toBe(
      "Passo 1 de 3: O destaque começa na primeira casa.",
    );
    expect(stepText(2, steps)).toBe(
      "Passo 3 de 3: O destaque desce uma linha.",
    );
  });
});

describe("stepTable", () => {
  it("colunas Passo e Descrição", () => {
    expect(stepTable(steps)).toEqual({
      columns: ["Passo", "Descrição"],
      rows: [
        ["1", "O destaque começa na primeira casa."],
        ["2", "O destaque anda uma coluna."],
        ["3", "O destaque desce uma linha."],
      ],
    });
  });
});

describe("assertHighlight", () => {
  it("linha ou coluna fora da matriz", () => {
    const outsideRow: Step["highlight"] = [4, 0];
    const outsideCol: Step["highlight"] = [0, 4];
    expect(() => assertHighlight(4, 4, outsideRow)).toThrow(RangeError);
    expect(() => assertHighlight(4, 4, outsideCol)).toThrow(RangeError);
  });
});

describe("stepperFrame", () => {
  it("moldura 4 por 4", () => {
    expect(stepperFrame(4, 4)).toEqual({
      width: 124,
      height: 156,
      origin: { x: 8, y: 8 },
    });
  });
});
