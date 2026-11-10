import { describe, expect, it } from "vitest";

import {
  assertHeatmap,
  formatWeight,
  heatOpacity,
  heatStep,
  heatmapFrame,
  heatmapTable,
  rowPeak,
} from "../../src/lib/viz/heatmap";

const tokens = ["o", "gato", "subiu", "no", "telhado"];

const weights = [
  [0.251, 0.173, 0.162, 0.236, 0.178],
  [0.148, 0.252, 0.244, 0.141, 0.215],
  [0.132, 0.233, 0.268, 0.138, 0.228],
  [0.24, 0.168, 0.173, 0.237, 0.182],
  [0.142, 0.2, 0.222, 0.143, 0.293],
];

const flat = weights.flat();
const min = Math.min(...flat);
const max = Math.max(...flat);

const expectedSteps = [
  4, 2, 1, 4, 2, 1, 4, 4, 1, 3, 1, 4, 5, 1, 3, 4, 2, 2, 4, 2, 1, 3, 3, 1, 5,
];

const expectedOpacities = [
  0.6, 0.3, 0.15, 0.6, 0.3, 0.15, 0.6, 0.6, 0.15, 0.45, 0.15, 0.6, 0.75, 0.15,
  0.45, 0.6, 0.3, 0.3, 0.6, 0.3, 0.15, 0.45, 0.45, 0.15, 0.75,
];

describe("heatStep", () => {
  it("25 degraus da atenção", () => {
    expect(flat.map((value) => heatStep(value, min, max))).toEqual(
      expectedSteps,
    );
  });
});

describe("heatOpacity", () => {
  it("25 opacidades da atenção", () => {
    expect(flat.map((value) => heatOpacity(heatStep(value, min, max)))).toEqual(
      expectedOpacities,
    );
  });
});

describe("matriz constante", () => {
  it("todo peso no degrau 1", () => {
    const steps = [0.5, 0.5, 0.5, 0.5].map((value) =>
      heatStep(value, 0.5, 0.5),
    );
    expect(steps).toEqual([1, 1, 1, 1]);
    expect(steps.map((step) => heatOpacity(step))).toEqual([
      0.15, 0.15, 0.15, 0.15,
    ]);
  });
});

describe("heatmapFrame", () => {
  it("25 células de lado 24", () => {
    const frame = heatmapFrame(tokens);
    const cells: { x: number; y: number; size: number }[] = [];
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        cells.push({ x: 72 + col * 28, y: 72 + row * 28, size: 24 });
      }
    }
    expect(
      frame.cells.map((cell) => ({ x: cell.x, y: cell.y, size: cell.size })),
    ).toEqual(cells);
  });

  it("rótulos, cota e contorno", () => {
    const frame = heatmapFrame(tokens);
    expect(frame.rowLabels).toHaveLength(5);
    expect(
      frame.rowLabels.find((label) => label.text === "telhado"),
    ).toMatchObject({
      text: "telhado",
      x: 64,
      y: 196,
      anchor: "end",
      baseline: "middle",
    });
    expect(frame.colLabels).toHaveLength(5);
    expect(
      frame.colLabels.find((label) => label.text === "telhado"),
    ).toMatchObject({
      text: "telhado",
      x: 196,
      y: 64,
      anchor: "start",
      baseline: "middle",
      rotate: -90,
    });
    expect(frame.dimensionLabel).toMatchObject({
      text: "[5, 5]",
      x: 140,
      y: 228,
      anchor: "middle",
      baseline: "hanging",
    });
    expect(frame.width).toBe(216);
    expect(frame.height).toBe(248);
    expect(frame.highlight(0)).toEqual({
      x: 71,
      y: 71,
      width: 138,
      height: 26,
    });
    expect(frame.highlight(1)).toEqual({
      x: 71,
      y: 99,
      width: 138,
      height: 26,
    });
  });
});

describe("rowPeak", () => {
  it("o maior peso de cada linha", () => {
    expect(weights.map((row) => rowPeak(tokens, row))).toEqual([
      { index: 0, token: "o", value: 0.251 },
      { index: 1, token: "gato", value: 0.252 },
      { index: 2, token: "subiu", value: 0.268 },
      { index: 0, token: "o", value: 0.24 },
      { index: 4, token: "telhado", value: 0.293 },
    ]);
  });

  it("empate fica com o menor índice", () => {
    expect(rowPeak(["a", "b", "c"], [0.2, 0.5, 0.5])).toEqual({
      index: 1,
      token: "b",
      value: 0.5,
    });
  });
});

describe("formatWeight", () => {
  it("três casas e vírgula", () => {
    expect(formatWeight(0.251)).toBe("0,251");
    expect(formatWeight(0.24)).toBe("0,240");
  });
});

describe("heatmapTable", () => {
  it("consulta e pesos formatados", () => {
    expect(heatmapTable(tokens, weights)).toEqual({
      columns: ["Consulta", "o", "gato", "subiu", "no", "telhado"],
      rows: [
        ["o", "0,251", "0,173", "0,162", "0,236", "0,178"],
        ["gato", "0,148", "0,252", "0,244", "0,141", "0,215"],
        ["subiu", "0,132", "0,233", "0,268", "0,138", "0,228"],
        ["no", "0,240", "0,168", "0,173", "0,237", "0,182"],
        ["telhado", "0,142", "0,200", "0,222", "0,143", "0,293"],
      ],
    });
  });
});

describe("assertHeatmap", () => {
  it("número de linhas diferente do de tokens", () => {
    expect(() => assertHeatmap(["a", "b"], [[0.1, 0.2, 0.3]])).toThrow(
      RangeError,
    );
  });

  it("linha mais longa que os tokens", () => {
    expect(() => assertHeatmap(["a"], [[0.1, 0.2]])).toThrow(RangeError);
  });
});
