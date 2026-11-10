export type Point = { x: number; y: number };

export type Segment = { from: Point; to: Point };

export type Dimension = {
  line: Segment;
  ticks: [Segment, Segment];
  label: {
    at: Point;
    anchor: "start" | "middle" | "end";
    baseline: "middle" | "hanging" | "auto";
  };
};

export type Arrow = {
  shaft: Segment;
  head: [Segment, Segment];
};

export type GridPattern = {
  minor: number;
  major: number;
  minorOffsets: number[];
  majorOffsets: number[];
};

const layerStep = 8;
const headLength = 8;
const headAngle = Math.PI / 6;
const minorStep = 8;
const majorStep = 40;

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} precisa ser inteiro positivo: ${value}`);
  }
}

function assertFinitePoint(point: Point, name: string): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new RangeError(`${name} precisa ser finito: ${point.x}, ${point.y}`);
  }
}

function offsetLabel(mid: number, offset: number, gap: number): number {
  if (offset > 0) return mid + offset + gap;
  if (offset < 0) return mid + offset - gap;
  return mid;
}

function tickAt(center: Point, dx: number, dy: number, tick: number): Segment {
  const length = Math.hypot(dx, dy);
  const px = -dy / length;
  const py = dx / length;
  const half = tick / 2;
  return {
    from: { x: center.x - px * half, y: center.y - py * half },
    to: { x: center.x + px * half, y: center.y + py * half },
  };
}

function turn(vector: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

export function tensorLayers(depth: number, x: number, y: number): Point[] {
  assertPositiveInteger(depth, "depth");
  const layers: Point[] = [];
  for (let index = 0; index < depth; index += 1) {
    layers.push({
      x: x + layerStep * index,
      y: y - layerStep * index,
    });
  }
  return layers;
}

export function dimension(
  from: Point,
  to: Point,
  offset: Point,
  tick = 6,
  labelGap = 8,
): Dimension {
  assertFinitePoint(from, "from");
  assertFinitePoint(to, "to");
  assertFinitePoint(offset, "offset");
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) {
    throw new RangeError("segmento precisa ter comprimento");
  }
  if (offset.x === 0 && offset.y === 0) {
    throw new RangeError("offset não pode ser nulo");
  }
  if (offset.x !== 0 && offset.y !== 0) {
    throw new RangeError("offset precisa ser horizontal ou vertical");
  }

  const line: Segment = {
    from: { x: from.x + offset.x, y: from.y + offset.y },
    to: { x: to.x + offset.x, y: to.y + offset.y },
  };
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const at = {
    x: offsetLabel(mid.x, offset.x, labelGap),
    y: offsetLabel(mid.y, offset.y, labelGap),
  };

  let anchor: Dimension["label"]["anchor"];
  let baseline: Dimension["label"]["baseline"];
  if (offset.x > 0) {
    anchor = "start";
    baseline = "middle";
  } else if (offset.x < 0) {
    anchor = "end";
    baseline = "middle";
  } else if (offset.y > 0) {
    anchor = "middle";
    baseline = "hanging";
  } else {
    anchor = "middle";
    baseline = "auto";
  }

  return {
    line,
    ticks: [tickAt(line.from, dx, dy, tick), tickAt(line.to, dx, dy, tick)],
    label: { at, anchor, baseline },
  };
}

export function arrow(from: Point, to: Point): Arrow {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (!(length > 0)) {
    throw new RangeError("a seta precisa de pontos distintos");
  }
  const back = { x: -dx / length, y: -dy / length };
  const wing = (angle: number): Point => {
    const rotated = turn(back, angle);
    return {
      x: to.x + rotated.x * headLength,
      y: to.y + rotated.y * headLength,
    };
  };
  return {
    shaft: { from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y } },
    head: [
      { from: { x: to.x, y: to.y }, to: wing(headAngle) },
      { from: { x: to.x, y: to.y }, to: wing(-headAngle) },
    ],
  };
}

export function gridPattern(width: number, height: number): GridPattern {
  if (!(width > 0)) {
    throw new RangeError(`width precisa ser positivo: ${width}`);
  }
  if (!(height > 0)) {
    throw new RangeError(`height precisa ser positivo: ${height}`);
  }
  const minorOffsets: number[] = [];
  for (let offset = minorStep; offset < majorStep; offset += minorStep) {
    minorOffsets.push(offset);
  }
  return {
    minor: minorStep,
    major: majorStep,
    minorOffsets,
    majorOffsets: [0, majorStep],
  };
}
