import { gridSize } from "./cells";
import { dimension } from "./geometry";

const cellSize = 24;
const cellGap = 4;
const frameMargin = 8;
const labelSize = 12;

export type Step = {
  label: string;
  highlight: readonly [number, number];
};

export type StepTable = {
  columns: string[];
  rows: string[][];
};

export type StepFrame = {
  width: number;
  height: number;
  origin: { x: number; y: number };
};

export function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(Math.max(index, 0), count - 1);
}

export function stepText(index: number, steps: readonly Step[]): string {
  const clamped = clampIndex(index, steps.length);
  const step = steps[clamped];
  return `Passo ${clamped + 1} de ${steps.length}: ${step?.label ?? ""}`;
}

export function stepTable(steps: readonly Step[]): StepTable {
  return {
    columns: ["Passo", "Descrição"],
    rows: steps.map((step, index) => [String(index + 1), step.label]),
  };
}

export function stepperFrame(rows: number, cols: number): StepFrame {
  const gridW = gridSize(cols, cellSize, cellGap);
  const gridH = gridSize(rows, cellSize, cellGap);
  const mark = dimension(
    { x: 0, y: gridH },
    { x: gridW, y: gridH },
    { x: 0, y: 12 },
  );
  return {
    width: frameMargin + gridW + frameMargin,
    height: frameMargin + mark.label.at.y + labelSize + frameMargin,
    origin: { x: frameMargin, y: frameMargin },
  };
}

export function assertHighlight(
  rows: number,
  cols: number,
  highlight: readonly [number, number],
): void {
  const [row, col] = highlight;
  if (!Number.isInteger(row) || row < 0 || row >= rows) {
    throw new RangeError(`linha fora da matriz: ${row}`);
  }
  if (!Number.isInteger(col) || col < 0 || col >= cols) {
    throw new RangeError(`coluna fora da matriz: ${col}`);
  }
}
