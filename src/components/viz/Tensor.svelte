<svelte:options namespace="svg" />

<script lang="ts">
  import { cellRects, gridSize } from "~/lib/viz/cells";
  import { dimension as dimensionOf, tensorLayers } from "~/lib/viz/geometry";

  type Props = {
    x: number;
    y: number;
    depth: number;
    rows: number;
    cols: number;
    size?: number;
    gap?: number;
    shape: string;
    highlight?: [number, number];
  };

  let {
    x,
    y,
    depth,
    rows,
    cols,
    size = 24,
    gap = 4,
    shape,
    highlight,
  }: Props = $props();

  const layers = $derived(tensorLayers(depth, 0, 0));
  const ordered = $derived(
    layers.map((origin, index) => ({ origin, index })).reverse(),
  );
  const cells = $derived(cellRects(rows, cols, size, gap));
  const gridW = $derived(gridSize(cols, size, gap));
  const gridH = $derived(gridSize(rows, size, gap));
  const minX = $derived(Math.min(...layers.map((layer) => layer.x)));
  const maxX = $derived(Math.max(...layers.map((layer) => layer.x)) + gridW);
  const maxY = $derived(Math.max(...layers.map((layer) => layer.y)) + gridH);
  const mark = $derived(
    dimensionOf({ x: minX, y: maxY }, { x: maxX, y: maxY }, { x: 0, y: 12 }),
  );

  function marked(row: number, col: number): boolean {
    return highlight?.[0] === row && highlight?.[1] === col;
  }
</script>

<g transform="translate({x} {y})">
  {#each ordered as layer (layer.index)}
    {#if layer.index === 0}
      {#each cells as cell (`${cell.row}-${cell.col}`)}
        <rect
          x={layer.origin.x + cell.x}
          y={layer.origin.y + cell.y}
          width={cell.size}
          height={cell.size}
          class={marked(cell.row, cell.col)
            ? "fill-accent stroke-ink"
            : "fill-sheet stroke-ink"}
          stroke-width="1"
        />
      {/each}
    {:else}
      <rect
        x={layer.origin.x}
        y={layer.origin.y}
        width={gridW}
        height={gridH}
        class="fill-sheet stroke-ink"
        stroke-width="1"
      />
    {/if}
  {/each}
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
      y={mark.label.at.y}>{shape}</text
    >
  </g>
</g>
