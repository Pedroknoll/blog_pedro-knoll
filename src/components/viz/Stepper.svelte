<script lang="ts">
  import { onMount } from "svelte";

  import {
    assertHighlight,
    clampIndex,
    stepText,
    stepperFrame,
    type Step,
  } from "~/lib/viz/steps";
  import Grid from "./Grid.svelte";
  import Matrix from "./Matrix.svelte";

  type Props = {
    name: string;
    title: string;
    summary: string;
    rows: number;
    cols: number;
    dimension: string;
    steps: readonly Step[];
  };

  let { name, title, summary, rows, cols, dimension, steps }: Props = $props();

  let index = $state(0);
  let hydrated = $state(false);

  const frame = $derived.by(() => {
    for (const item of steps) assertHighlight(rows, cols, item.highlight);
    return stepperFrame(rows, cols);
  });
  const mark = $derived.by((): [number, number] => {
    const current = steps[clampIndex(index, steps.length)];
    return [current?.highlight[0] ?? 0, current?.highlight[1] ?? 0];
  });
  const live = $derived(stepText(index, steps));

  onMount(() => {
    hydrated = true;
  });
</script>

<svg
  data-viz={name}
  viewBox="0 0 {frame.width} {frame.height}"
  width={frame.width}
  height={frame.height}
  role="img"
  aria-label={summary}
  class="block h-auto max-w-full"
>
  <title>{title}</title>
  <Grid width={frame.width} height={frame.height} />
  <Matrix
    x={frame.origin.x}
    y={frame.origin.y}
    {rows}
    {cols}
    highlight={mark}
    {dimension}
  />
</svg>
<div class="mt-4 flex flex-wrap items-center gap-3">
  <button
    type="button"
    class="min-h-8 border border-ink px-3 font-mono text-xs text-ink disabled:opacity-60"
    disabled={!hydrated || index === 0}
    onclick={() => {
      index = clampIndex(index - 1, steps.length);
    }}>Anterior</button
  >
  <button
    type="button"
    class="min-h-8 border border-ink px-3 font-mono text-xs text-ink disabled:opacity-60"
    disabled={!hydrated || index === steps.length - 1}
    onclick={() => {
      index = clampIndex(index + 1, steps.length);
    }}>Próximo</button
  >
  <p aria-live="polite" class="font-mono text-xs text-muted">{live}</p>
</div>
