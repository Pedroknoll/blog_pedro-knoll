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
  return index;
}

export function stepText(index: number, steps: readonly Step[]): string {
  return "";
}

export function stepTable(steps: readonly Step[]): StepTable {
  return { columns: [], rows: [] };
}

export function stepperFrame(rows: number, cols: number): StepFrame {
  return { width: 0, height: 0, origin: { x: 0, y: 0 } };
}

export function assertHighlight(
  rows: number,
  cols: number,
  highlight: readonly [number, number],
): void {
  return;
}
