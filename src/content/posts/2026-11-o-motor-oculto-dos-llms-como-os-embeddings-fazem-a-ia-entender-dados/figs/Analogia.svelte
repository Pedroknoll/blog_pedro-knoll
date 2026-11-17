<script lang="ts">
  import { onMount } from "svelte";

  import Grid from "~/components/viz/Grid.svelte";
  import { arrow, dimension } from "~/lib/viz/geometry";
  import { clampIndex } from "~/lib/viz/steps";

  type Point = readonly number[];
  type Word = { token: string; at: Point };
  type Step = { from: Point; to: Point };

  type Props = {
    name: string;
    title: string;
    summary: string;
    words: readonly Word[];
    steps: readonly Step[];
    labels: readonly string[];
  };

  let { name, title, summary, words, steps, labels }: Props = $props();

  const width = 320;
  const height = 240;
  const originX = 160;
  const originY = 128;
  const scale = 48;

  let index = $state(0);
  let hydrated = $state(false);

  const count = $derived(Math.min(steps.length, labels.length));
  const current = $derived(clampIndex(index, count));
  const step = $derived(steps[current]);
  const live = $derived(
    `Passo ${current + 1} de ${count}: ${labels[current] ?? ""}`,
  );
  const unit = dimension(
    { x: originX, y: originY },
    { x: originX + scale, y: originY },
    { x: 0, y: 12 },
  );

  function place(at: Point): [number, number] {
    return [originX + (at[0] ?? 0) * scale, originY - (at[1] ?? 0) * scale];
  }

  function shotOf(from: Point, to: Point) {
    const [x1, y1] = place(from);
    const [x2, y2] = place(to);
    return arrow({ x: x1, y: y1 }, { x: x2, y: y2 });
  }

  function labelOf(at: Point): {
    x: number;
    y: number;
    anchor: "start" | "end";
  } {
    const [x, y] = place(at);
    const right = (at[0] ?? 0) >= 0;
    const above = (at[1] ?? 0) > 0;
    return {
      x: x + (right ? 12 : -12),
      y: y + (above ? -10 : 14),
      anchor: right ? "start" : "end",
    };
  }

  onMount(() => {
    hydrated = true;
  });
</script>

{#snippet vector(from: Point, to: Point, marked: boolean)}
  {@const shot = shotOf(from, to)}
  <line
    x1={shot.shaft.from.x}
    y1={shot.shaft.from.y}
    x2={shot.shaft.to.x}
    y2={shot.shaft.to.y}
    class={marked ? "stroke-accent" : "stroke-ink"}
    stroke-width="1"
    fill="none"
  />
  {#each shot.head as segment, head (head)}
    <line
      x1={segment.from.x}
      y1={segment.from.y}
      x2={segment.to.x}
      y2={segment.to.y}
      class={marked ? "stroke-accent" : "stroke-ink"}
      stroke-width="1"
      fill="none"
    />
  {/each}
{/snippet}

<svg
  data-viz={name}
  viewBox="0 0 {width} {height}"
  {width}
  {height}
  role="img"
  aria-label={summary}
  class="block h-auto max-w-full"
>
  <title>{title}</title>
  <Grid {width} {height} />
  <line
    x1="32"
    y1={originY}
    x2="288"
    y2={originY}
    class="stroke-ink"
    stroke-width="1"
    stroke-dasharray="4 4"
    fill="none"
  />
  <line
    x1={originX}
    y1="32"
    x2={originX}
    y2="208"
    class="stroke-ink"
    stroke-width="1"
    stroke-dasharray="4 4"
    fill="none"
  />
  {#each words as word (word.token)}
    {@render vector([0, 0], word.at, false)}
  {/each}
  {#if step}
    {@render vector(step.from, step.to, true)}
  {/if}
  {#each words as word (word.token)}
    {@const label = labelOf(word.at)}
    <text
      class="fill-ink font-mono"
      font-size="12"
      text-anchor={label.anchor}
      dominant-baseline="central"
      x={label.x}
      y={label.y}>{word.token}</text
    >
  {/each}
  <g data-dimension>
    <line
      x1={unit.line.from.x}
      y1={unit.line.from.y}
      x2={unit.line.to.x}
      y2={unit.line.to.y}
      class="stroke-ink"
      stroke-width="1"
      fill="none"
    />
    {#each unit.ticks as tick, tickIndex (tickIndex)}
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
      class="fill-ink font-mono"
      font-size="12"
      text-anchor={unit.label.anchor}
      dominant-baseline={unit.label.baseline}
      x={unit.label.at.x}
      y={unit.label.at.y}>1</text
    >
  </g>
</svg>
<div class="mt-4 flex flex-wrap items-center gap-3">
  <button
    type="button"
    class="min-h-8 border border-ink px-3 font-mono text-xs text-ink disabled:opacity-60"
    disabled={!hydrated || current === 0}
    onclick={() => {
      index = clampIndex(index - 1, count);
    }}>Anterior</button
  >
  <button
    type="button"
    class="min-h-8 border border-ink px-3 font-mono text-xs text-ink disabled:opacity-60"
    disabled={!hydrated || current === count - 1}
    onclick={() => {
      index = clampIndex(index + 1, count);
    }}>Próximo</button
  >
  <p aria-live="polite" class="font-mono text-xs text-muted">{live}</p>
</div>
