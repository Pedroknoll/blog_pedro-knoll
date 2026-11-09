export type CellRect = {
  row: number;
  col: number;
  x: number;
  y: number;
  size: number;
};

function assertCount(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} precisa ser inteiro positivo: ${value}`);
  }
}

function assertSpacing(size: number, gap: number): void {
  if (!(size > 0)) {
    throw new RangeError(`size precisa ser positivo: ${size}`);
  }
  if (!(gap >= 0)) {
    throw new RangeError(`gap não pode ser negativo: ${gap}`);
  }
}

export function gridSize(count: number, size: number, gap: number): number {
  assertCount(count, "count");
  assertSpacing(size, gap);
  return count * size + (count - 1) * gap;
}

export function cellRects(
  rows: number,
  cols: number,
  size: number,
  gap: number,
): CellRect[] {
  assertCount(rows, "rows");
  assertCount(cols, "cols");
  assertSpacing(size, gap);
  const cells: CellRect[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      cells.push({
        row,
        col,
        x: col * (size + gap),
        y: row * (size + gap),
        size,
      });
    }
  }
  return cells;
}
