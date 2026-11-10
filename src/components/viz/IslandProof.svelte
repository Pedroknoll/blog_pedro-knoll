<script lang="ts">
  import { onMount } from "svelte";

  import { cellRects, gridSize } from "~/lib/viz/cells";

  type Props = {
    rows: number;
    cols: number;
    title: string;
    summary: string;
    controls?: boolean;
    start?: number;
  };

  const size = 24;
  const gap = 4;
  const pad = 1;

  let {
    rows,
    cols,
    title,
    summary,
    controls = false,
    start = 0,
  }: Props = $props();

  let offset = $state(0);
  let hydrated = $state(false);

  const cells = $derived(cellRects(rows, cols, size, gap));
  const width = $derived(gridSize(cols, size, gap) + 2 * pad);
  const height = $derived(gridSize(rows, size, gap) + 2 * pad);
  const total = $derived(rows * cols);
  const active = $derived((((start + offset) % total) + total) % total);

  onMount(() => {
    hydrated = true;
  });

  function move(step: number): void {
    offset += step;
  }
</script>

<div class="not-prose my-8">
  <svg
    data-viz="island-proof"
    viewBox="{-pad} {-pad} {width} {height}"
    role="img"
    aria-label={summary}
    class="block h-auto w-full max-w-64"
  >
    <title>{title}</title>
    {#each cells as cell, index (index)}
      <rect
        x={cell.x}
        y={cell.y}
        width={cell.size}
        height={cell.size}
        class={index === active ? "fill-accent" : "fill-sheet stroke-ink"}
        data-active={index === active ? "" : undefined}
      />
    {/each}
  </svg>
  {#if controls}
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="min-h-8 rounded border border-ink px-3 font-mono text-xs text-ink disabled:opacity-60"
        disabled={!hydrated}
        onclick={() => move(-1)}>Anterior</button
      >
      <button
        type="button"
        class="min-h-8 rounded border border-ink px-3 font-mono text-xs text-ink disabled:opacity-60"
        disabled={!hydrated}
        onclick={() => move(1)}>Próximo</button
      >
      <p aria-live="polite" class="font-mono text-xs text-muted">
        Célula {active + 1} de {total}
      </p>
    </div>
  {/if}
</div>
