<svelte:options namespace="svg" />

<script lang="ts">
  import { heatOpacity, heatStep, heatmapFrame } from "~/lib/viz/heatmap";

  type Props = {
    x: number;
    y: number;
    tokens: readonly string[];
    weights: readonly (readonly number[])[];
    row: number;
  };

  let { x, y, tokens, weights, row }: Props = $props();

  const frame = $derived(heatmapFrame(tokens));
  const values = $derived(weights.flat());
  const min = $derived(values.length === 0 ? 0 : Math.min(...values));
  const max = $derived(values.length === 0 ? 0 : Math.max(...values));
  const outline = $derived(frame.highlight(row));

  function opacityAt(cellRow: number, cellCol: number): number {
    const value = weights[cellRow]?.[cellCol] ?? min;
    return heatOpacity(heatStep(value, min, max));
  }
</script>

<g transform="translate({x} {y})">
  {#each frame.cells as cell (`${cell.row}-${cell.col}`)}
    <rect
      data-cell=""
      x={cell.x}
      y={cell.y}
      width={cell.size}
      height={cell.size}
      class="fill-ink stroke-ink"
      stroke-width="1"
      fill-opacity={opacityAt(cell.row, cell.col)}
    />
  {/each}
  {#each frame.rowLabels as label, index (index)}
    <text
      class="font-mono fill-ink"
      font-size="12"
      text-anchor={label.anchor}
      dominant-baseline={label.baseline}
      x={label.x}
      y={label.y}>{label.text}</text
    >
  {/each}
  {#each frame.colLabels as label, index (index)}
    <text
      class="font-mono fill-ink"
      font-size="12"
      text-anchor={label.anchor}
      dominant-baseline={label.baseline}
      transform="rotate(-90 {label.x} {label.y})"
      x={label.x}
      y={label.y}>{label.text}</text
    >
  {/each}
  <g data-dimension>
    <line
      x1={frame.dimension.line.from.x}
      y1={frame.dimension.line.from.y}
      x2={frame.dimension.line.to.x}
      y2={frame.dimension.line.to.y}
      class="stroke-ink"
      stroke-width="1"
      fill="none"
    />
    {#each frame.dimension.ticks as tick, index (index)}
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
      text-anchor={frame.dimensionLabel.anchor}
      dominant-baseline={frame.dimensionLabel.baseline}
      x={frame.dimensionLabel.x}
      y={frame.dimensionLabel.y}>{frame.dimensionLabel.text}</text
    >
  </g>
  <rect
    data-highlight=""
    x={outline.x}
    y={outline.y}
    width={outline.width}
    height={outline.height}
    class="stroke-accent"
    fill="none"
    stroke-width="2"
  />
</g>
