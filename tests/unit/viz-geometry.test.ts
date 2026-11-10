import { describe, expect, it } from "vitest";

import {
  arrow,
  dimension,
  gridPattern,
  tensorLayers,
} from "../../src/lib/viz/geometry";

type Point = { x: number; y: number };

type Segment = { from: Point; to: Point };

type DimensionMark = {
  line: Segment;
  ticks: Segment[];
  label: {
    at: Point;
    anchor: "start" | "middle" | "end";
    baseline: "middle" | "hanging" | "auto";
  };
};

function expectTicks(mark: DimensionMark) {
  const dx = mark.line.to.x - mark.line.from.x;
  const dy = mark.line.to.y - mark.line.from.y;
  expect(dx === 0 || dy === 0).toBe(true);
  expect(mark.ticks).toHaveLength(2);
  const horizontal = dy === 0;
  for (const tick of mark.ticks) {
    expect(Math.hypot(tick.to.x - tick.from.x, tick.to.y - tick.from.y)).toBe(
      6,
    );
    if (horizontal) expect(tick.from.x).toBe(tick.to.x);
    else expect(tick.from.y).toBe(tick.to.y);
  }
  const key = (point: Point) => `${point.x},${point.y}`;
  const centers = mark.ticks.map((tick) => ({
    x: (tick.from.x + tick.to.x) / 2,
    y: (tick.from.y + tick.to.y) / 2,
  }));
  expect(centers.map(key).sort()).toEqual(
    [mark.line.from, mark.line.to].map(key).sort(),
  );
}

function expectDimension(
  from: Point,
  to: Point,
  offset: Point,
  at: Point,
  anchor: DimensionMark["label"]["anchor"],
  baseline: DimensionMark["label"]["baseline"],
) {
  const mark = dimension(from, to, offset);
  expect(mark.line).toEqual({
    from: { x: from.x + offset.x, y: from.y + offset.y },
    to: { x: to.x + offset.x, y: to.y + offset.y },
  });
  expect(mark.label).toEqual({ at, anchor, baseline });
  expectTicks(mark);
}

describe("tensorLayers", () => {
  it("três camadas em (10, 20), sem mudança", () => {
    expect(tensorLayers(3, 10, 20)).toEqual([
      { x: 10, y: 20 },
      { x: 18, y: 12 },
      { x: 26, y: 4 },
    ]);
  });
});

describe("dimension", () => {
  it("quatro direções e a diagonal", () => {
    expectDimension(
      { x: 0, y: 10 },
      { x: 0, y: 50 },
      { x: 12, y: 0 },
      { x: 20, y: 30 },
      "start",
      "middle",
    );
    expectDimension(
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 0, y: 12 },
      { x: 20, y: 20 },
      "middle",
      "hanging",
    );
    expectDimension(
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 0, y: -12 },
      { x: 20, y: -20 },
      "middle",
      "auto",
    );
    expectDimension(
      { x: 0, y: 10 },
      { x: 0, y: 50 },
      { x: -12, y: 0 },
      { x: -20, y: 30 },
      "end",
      "middle",
    );
    expect(() =>
      dimension({ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 12, y: 12 }),
    ).toThrow(RangeError);
  });
});

describe("arrow", () => {
  it("haste de ponta a ponta e ponta aberta a 30 graus", () => {
    const shot = arrow({ x: 0, y: 0 }, { x: 30, y: 0 });
    expect(shot.shaft).toEqual({
      from: { x: 0, y: 0 },
      to: { x: 30, y: 0 },
    });
    expect(shot.head).toHaveLength(2);
    const along = 8 * Math.cos(Math.PI / 6);
    const rise = 8 * Math.sin(Math.PI / 6);
    const tips = shot.head.map((segment) => {
      expect(segment.from).toEqual({ x: 30, y: 0 });
      expect(segment.to.x).toBeCloseTo(30 - along);
      expect(Math.hypot(segment.to.x - 30, segment.to.y)).toBeCloseTo(8);
      return segment.to.y;
    });
    tips.sort((left, right) => left - right);
    expect(tips[0]).toBeCloseTo(-rise);
    expect(tips[1]).toBeCloseTo(rise);
  });
});

describe("gridPattern", () => {
  it("passos 8 e 40, reforço em 0 e em 40", () => {
    expect(gridPattern(280, 176)).toEqual({
      minor: 8,
      major: 40,
      minorOffsets: [8, 16, 24, 32],
      majorOffsets: [0, 40],
    });
  });
});

describe("argumentos inválidos", () => {
  it("RangeError", () => {
    expect(() => tensorLayers(0, 10, 20)).toThrow(RangeError);
    expect(() => tensorLayers(1.5, 10, 20)).toThrow(RangeError);
    expect(() => tensorLayers(-1, 10, 20)).toThrow(RangeError);
    expect(() =>
      dimension({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 12, y: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      dimension({ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 0, y: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      dimension({ x: Number.NaN, y: 0 }, { x: 40, y: 0 }, { x: 0, y: 12 }),
    ).toThrow(RangeError);
    expect(() =>
      dimension(
        { x: 0, y: 0 },
        { x: Number.POSITIVE_INFINITY, y: 0 },
        { x: 12, y: 0 },
      ),
    ).toThrow(RangeError);
    expect(() =>
      dimension({ x: 0, y: 0 }, { x: 40, y: 0 }, { x: Number.NaN, y: 0 }),
    ).toThrow(RangeError);
    expect(() => arrow({ x: 0, y: 0 }, { x: 0, y: 0 })).toThrow(RangeError);
    expect(() => gridPattern(0, 176)).toThrow(RangeError);
    expect(() => gridPattern(280, 0)).toThrow(RangeError);
    expect(() => gridPattern(-1, 176)).toThrow(RangeError);
    expect(() => gridPattern(280, -1)).toThrow(RangeError);
  });
});
