<svelte:options namespace="svg" />

<script lang="ts">
  import { gridPattern } from "~/lib/viz/geometry";

  type Props = {
    width: number;
    height: number;
  };

  let { width, height }: Props = $props();
  const uid = $props.id();

  const tile = $derived(gridPattern(width, height));

  function hatch(offsets: number[], size: number): string {
    return offsets
      .map((offset) => `M${offset} 0V${size}M0 ${offset}H${size}`)
      .join("");
  }

  const minorPath = $derived(hatch(tile.minorOffsets, tile.major));
  const majorPath = $derived(hatch(tile.majorOffsets, tile.major));
</script>

<g data-grid>
  <pattern
    id="grade-{uid}"
    patternUnits="userSpaceOnUse"
    width={tile.major}
    height={tile.major}
  >
    <path d={minorPath} class="stroke-grid" stroke-width="1" fill="none" />
    <path
      d={majorPath}
      class="stroke-grid-strong"
      stroke-width="1"
      fill="none"
    />
  </pattern>
  <rect {width} {height} fill="url(#grade-{uid})" />
</g>
