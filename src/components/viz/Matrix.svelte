<svelte:options namespace="svg" />

<script lang="ts">
  import { cellRects, gridSize } from "~/lib/viz/cells";
  import { dimension as dimensionOf } from "~/lib/viz/geometry";

  type Props = {
    x: number;
    y: number;
    rows: number;
    cols: number;
    size?: number;
    gap?: number;
    highlight?: [number, number];
    dimension?: string;
  };

  let {
    x,
    y,
    rows,
    cols,
    size = 24,
    gap = 4,
    highlight,
    dimension: label,
  }: Props = $props();

  const cells = $derived(cellRects(rows, cols, size, gap));
  const gridW = $derived(gridSize(cols, size, gap));
  const gridH = $derived(gridSize(rows, size, gap));
  const mark = $derived(
    label
      ? dimensionOf({ x: 0, y: gridH }, { x: gridW, y: gridH }, { x: 0, y: 12 })
      : null,
  );

  function marked(row: number, col: number): boolean {
    return highlight?.[0] === row && highlight?.[1] === col;
  }
</script>

<g transform="translate({x} {y})">
  {#each cells as cell (`${cell.row}-${cell.col}`)}
    <rect
      x={cell.x}
      y={cell.y}
      width={cell.size}
      height={cell.size}
      class={marked(cell.row, cell.col)
        ? "fill-accent stroke-ink"
        : "fill-sheet stroke-ink"}
      stroke-width="1"
    />
  {/each}
  {#if mark && label}
    <g data-dimension>
      <line
        x1={mark.line.from.x}
        y1={mark.line.from.y}
        x2={mark.line.to.x}
        y2={mark.line.to.y}
        class="stroke-ink"
        stroke-width="1"
        fill="none"
      />
      {#each mark.ticks as tick, index (index)}
        <line
          x1={tick.from.x}
          y1={tick.from.y}
          x2={tick.to.x}
          y2={tick.to.y}
          class="stroke-ink"
          stroke-width="1"
          fill="none"
        />
      {/each}
      <text
        class="font-mono fill-ink"
        font-size="12"
        text-anchor={mark.label.anchor}
        dominant-baseline={mark.label.baseline}
        x={mark.label.at.x}
        y={mark.label.at.y}>{label}</text
      >
    </g>
  {/if}
</g>
