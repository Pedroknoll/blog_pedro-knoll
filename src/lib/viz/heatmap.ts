import { cellRects, gridSize } from "./cells";
import { dimension as dimensionOf, type Dimension } from "./geometry";

export const HEAT_OPACITY: readonly number[] = [0.15, 0.3, 0.45, 0.6, 0.75];

const cellSize = 24;
const cellGap = 4;
const labelAdvance = 8;
const labelSlack = 8;
const frameMargin = 8;
const labelSize = 12;
const outlineOutset = 1;

export type HeatCell = {
  row: number;
  col: number;
  x: number;
  y: number;
  size: number;
};

export type HeatLabel = {
  text: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  baseline: "middle" | "hanging" | "auto";
  rotate?: number;
};

export type HeatOutline = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HeatmapFrame = {
  width: number;
  height: number;
  cells: HeatCell[];
  rowLabels: HeatLabel[];
  colLabels: HeatLabel[];
  dimension: Dimension;
  dimensionLabel: HeatLabel;
  highlight: (row: number) => HeatOutline;
};

export type RowPeak = {
  index: number;
  token: string;
  value: number;
};

export type WeightTable = {
  columns: string[];
  rows: string[][];
};

function longestLength(tokens: readonly string[]): number {
  let longest = 0;
  for (const token of tokens) {
    if (token.length > longest) longest = token.length;
  }
  return longest;
}

export function heatStep(value: number, min: number, max: number): number {
  if (max === min) return 1;
  const ratio = (value - min) / (max - min);
  return Math.min(5, 1 + Math.floor(5 * ratio));
}

export function heatOpacity(step: number): number {
  const opacity = HEAT_OPACITY[step - 1];
  if (opacity === undefined) {
    throw new RangeError(`degrau fora da tabela: ${step}`);
  }
  return opacity;
}

export function formatWeight(value: number): string {
  return value.toFixed(3).replace(".", ",");
}

export function rowPeak(
  tokens: readonly string[],
  weights: readonly number[],
): RowPeak {
  let index = 0;
  for (let cursor = 1; cursor < weights.length; cursor += 1) {
    const weight = weights[cursor];
    const best = weights[index];
    if (weight !== undefined && best !== undefined && weight > best) {
      index = cursor;
    }
  }
  return {
    index: weights.length === 0 ? -1 : index,
    token: tokens[index] ?? "",
    value: weights[index] ?? 0,
  };
}

export function queryText(
  tokens: readonly string[],
  weights: readonly (readonly number[])[],
  row: number,
): string {
  const token = tokens[row] ?? "";
  const peak = rowPeak(tokens, weights[row] ?? []);
  return `Consulta: ${token} · maior peso: ${peak.token} (${formatWeight(peak.value)})`;
}

export function heatmapTable(
  tokens: readonly string[],
  weights: readonly (readonly number[])[],
): WeightTable {
  assertHeatmap(tokens, weights);
  return {
    columns: ["Consulta", ...tokens],
    rows: tokens.map((token, index) => [
      token,
      ...(weights[index] ?? []).map((value) => formatWeight(value)),
    ]),
  };
}

export function heatmapFrame(tokens: readonly string[]): HeatmapFrame {
  const count = tokens.length;
  const band = frameMargin + longestLength(tokens) * labelAdvance + labelSlack;
  const grid = gridSize(count, cellSize, cellGap);
  const local = cellRects(count, count, cellSize, cellGap);
  const cells: HeatCell[] = local.map((cell) => ({
    row: cell.row,
    col: cell.col,
    x: band + cell.x,
    y: band + cell.y,
    size: cell.size,
  }));
  const rowLabels: HeatLabel[] = tokens.map((text, index) => {
    const cell = local[index * count];
    return {
      text,
      x: band - labelSlack,
      y: band + (cell?.y ?? 0) + cellSize / 2,
      anchor: "end",
      baseline: "middle",
    };
  });
  const colLabels: HeatLabel[] = tokens.map((text, index) => {
    const cell = local[index];
    return {
      text,
      x: band + (cell?.x ?? 0) + cellSize / 2,
      y: band - labelSlack,
      anchor: "start",
      baseline: "middle",
      rotate: -90,
    };
  });
  const localMark = dimensionOf(
    { x: 0, y: grid },
    { x: grid, y: grid },
    { x: 0, y: 12 },
  );
  const shift = (x: number, y: number) => ({ x: x + band, y: y + band });
  const dimension: Dimension = {
    line: {
      from: shift(localMark.line.from.x, localMark.line.from.y),
      to: shift(localMark.line.to.x, localMark.line.to.y),
    },
    ticks: [
      {
        from: shift(localMark.ticks[0].from.x, localMark.ticks[0].from.y),
        to: shift(localMark.ticks[0].to.x, localMark.ticks[0].to.y),
      },
      {
        from: shift(localMark.ticks[1].from.x, localMark.ticks[1].from.y),
        to: shift(localMark.ticks[1].to.x, localMark.ticks[1].to.y),
      },
    ],
    label: {
      at: shift(localMark.label.at.x, localMark.label.at.y),
      anchor: localMark.label.anchor,
      baseline: localMark.label.baseline,
    },
  };
  const pitch = cellSize + cellGap;
  return {
    width: band + grid + frameMargin,
    height: dimension.label.at.y + labelSize + frameMargin,
    cells,
    rowLabels,
    colLabels,
    dimension,
    dimensionLabel: {
      text: `[${count}, ${count}]`,
      x: dimension.label.at.x,
      y: dimension.label.at.y,
      anchor: dimension.label.anchor,
      baseline: dimension.label.baseline,
    },
    highlight(row: number): HeatOutline {
      return {
        x: band - outlineOutset,
        y: band - outlineOutset + row * pitch,
        width: grid + outlineOutset * 2,
        height: cellSize + outlineOutset * 2,
      };
    },
  };
}

export function assertHeatmap(
  tokens: readonly string[],
  weights: readonly (readonly number[])[],
): void {
  if (weights.length !== tokens.length) {
    throw new RangeError(
      `linhas precisa ser ${tokens.length}: ${weights.length}`,
    );
  }
  for (const line of weights) {
    if (line.length !== tokens.length) {
      throw new RangeError(
        `linha precisa ter ${tokens.length} pesos: ${line.length}`,
      );
    }
  }
}
