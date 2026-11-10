<script lang="ts">
  import { onMount } from "svelte";

  import Grid from "./Grid.svelte";
  import Heatmap from "./Heatmap.svelte";
  import { assertHeatmap, heatmapFrame, queryText } from "~/lib/viz/heatmap";

  type Props = {
    name: string;
    title: string;
    summary: string;
    tokens: readonly string[];
    weights: readonly (readonly number[])[];
  };

  let { name, title, summary, tokens, weights }: Props = $props();

  let row = $state(0);
  let hydrated = $state(false);
  const uid = $props.id();

  const frame = $derived.by(() => {
    assertHeatmap(tokens, weights);
    return heatmapFrame(tokens);
  });
  const token = $derived(tokens[row] ?? "");
  const live = $derived(queryText(tokens, weights, row));

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
  <Heatmap x={0} y={0} {tokens} {weights} {row} />
</svg>
<div class="mt-4 flex flex-wrap items-center gap-3">
  <label for={uid} class="font-mono text-xs text-ink">Consulta</label>
  <input
    id={uid}
    type="range"
    min="0"
    max={tokens.length - 1}
    step="1"
    bind:value={row}
    aria-valuetext={token}
    class="accent-accent min-h-6"
    disabled={!hydrated}
  />
</div>
<p aria-live="polite" class="mt-3 font-mono text-xs text-muted">{live}</p>
