<svelte:options namespace="svg" />

<script lang="ts">
  import { cellRects, gridSize } from "~/lib/viz/cells";
  import { dimension as dimensionOf } from "~/lib/viz/geometry";

  type Props = {
    x: number;
    y: number;
    length: number;
    orientation?: "row" | "column";
    size?: number;
    gap?: number;
    highlight?: number;
    dimension?: string;
  };

  let {
    x,
    y,
    length,
    orientation = "column",
    size = 24,
    gap = 4,
    highlight,
    dimension: label,
  }: Props = $props();

  const cells = $derived(
    orientation === "column"
      ? cellRects(length, 1, size, gap)
      : cellRects(1, length, size, gap),
  );
  const along = $derived(gridSize(length, size, gap));
  const mark = $derived(
    !label
      ? null
      : orientation === "column"
        ? dimensionOf({ x: size, y: 0 }, { x: size, y: along }, { x: 12, y: 0 })
        : dimensionOf(
            { x: 0, y: size },
            { x: along, y: size },
            { x: 0, y: 12 },
          ),
  );
</script>

<g transform="translate({x} {y})">
  {#each cells as cell, index (index)}
    <rect
      x={cell.x}
      y={cell.y}
      width={cell.size}
      height={cell.size}
      class={highlight === index
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
