export const HEAT_OPACITY: readonly number[] = [0.15, 0.3, 0.45, 0.6, 0.75];

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

export function heatStep(value: number, min: number, max: number): number {
  return 0;
}

export function heatOpacity(step: number): number {
  return 0;
}

export function formatWeight(value: number): string {
  return "";
}

export function rowPeak(
  tokens: readonly string[],
  weights: readonly number[],
): RowPeak {
  return { index: -1, token: "", value: 0 };
}

export function queryText(
  tokens: readonly string[],
  weights: readonly (readonly number[])[],
  row: number,
): string {
  return "";
}

export function heatmapTable(
  tokens: readonly string[],
  weights: readonly (readonly number[])[],
): WeightTable {
  return { columns: [], rows: [] };
}

export function heatmapFrame(tokens: readonly string[]): HeatmapFrame {
  return {
    width: 0,
    height: 0,
    cells: [],
    rowLabels: [],
    colLabels: [],
    dimensionLabel: {
      text: "",
      x: 0,
      y: 0,
      anchor: "middle",
      baseline: "middle",
    },
    highlight(row: number): HeatOutline {
      return { x: 0, y: 0, width: 0, height: 0 };
    },
  };
}

export function assertHeatmap(
  tokens: readonly string[],
  weights: readonly (readonly number[])[],
): void {
  return;
}
