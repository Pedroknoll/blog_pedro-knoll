<svelte:options namespace="svg" />

<script lang="ts">
  import { arrow as arrowGeometry } from "~/lib/viz/geometry";

  type Props = {
    from: [number, number];
    to: [number, number];
  };

  let { from, to }: Props = $props();

  const shot = $derived(
    arrowGeometry({ x: from[0], y: from[1] }, { x: to[0], y: to[1] }),
  );
</script>

<g>
  <line
    x1={shot.shaft.from.x}
    y1={shot.shaft.from.y}
    x2={shot.shaft.to.x}
    y2={shot.shaft.to.y}
    class="stroke-ink"
    stroke-width="1"
    fill="none"
  />
  {#each shot.head as segment, index (index)}
    <line
      x1={segment.from.x}
      y1={segment.from.y}
      x2={segment.to.x}
      y2={segment.to.y}
      class="stroke-ink"
      stroke-width="1"
      fill="none"
    />
  {/each}
</g>
