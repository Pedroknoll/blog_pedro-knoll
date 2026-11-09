import { describe, expect, it } from "vitest";

import { cellRects, gridSize } from "../../src/lib/viz/cells";

describe("cellRects", () => {
  it("2 × 3 com vão, por linha", () => {
    expect(cellRects(2, 3, 10, 4)).toEqual([
      { row: 0, col: 0, x: 0, y: 0, size: 10 },
      { row: 0, col: 1, x: 14, y: 0, size: 10 },
      { row: 0, col: 2, x: 28, y: 0, size: 10 },
      { row: 1, col: 0, x: 0, y: 14, size: 10 },
      { row: 1, col: 1, x: 14, y: 14, size: 10 },
      { row: 1, col: 2, x: 28, y: 14, size: 10 },
    ]);
  });
});

describe("gridSize", () => {
  it("soma as células e os vãos do meio", () => {
    expect(gridSize(1, 10, 4)).toBe(10);
    expect(gridSize(5, 10, 4)).toBe(66);
  });
});

describe("argumentos inválidos", () => {
  it("RangeError", () => {
    expect(() => cellRects(0, 1, 10, 0)).toThrow(RangeError);
    expect(() => cellRects(1.5, 1, 10, 0)).toThrow(RangeError);
    expect(() => cellRects(-1, 1, 10, 0)).toThrow(RangeError);
    expect(() => cellRects(1, 0, 10, 0)).toThrow(RangeError);
    expect(() => cellRects(1, 2.5, 10, 0)).toThrow(RangeError);
    expect(() => cellRects(1, 1, 0, 0)).toThrow(RangeError);
    expect(() => cellRects(1, 1, -1, 0)).toThrow(RangeError);
    expect(() => cellRects(1, 1, 10, -1)).toThrow(RangeError);
    expect(() => gridSize(0, 10, 0)).toThrow(RangeError);
    expect(() => gridSize(1.5, 10, 0)).toThrow(RangeError);
    expect(() => gridSize(-2, 10, 0)).toThrow(RangeError);
    expect(() => gridSize(2, 0, 0)).toThrow(RangeError);
    expect(() => gridSize(2, -1, 0)).toThrow(RangeError);
    expect(() => gridSize(2, 10, -1)).toThrow(RangeError);
  });
});
