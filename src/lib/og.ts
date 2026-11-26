import { KIND_LABELS, type Kind } from "./kind";

// Imagem OG do post sem capa (RF-16, BRAND §11). Aqui só a parte pura; o
// desenho com o sharp fica em og-image.ts.

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export function ogImagePath(id: string): string {
  return `/blog/${id}/og.png`;
}

/** Com capa, a capa ganha; sem capa, o build gera a ficha. */
export function needsGeneratedOg(data: { cover?: unknown }): boolean {
  return !data.cover;
}

export function ogKindLabel(kind: Kind): string {
  return KIND_LABELS[kind].toLocaleUpperCase("pt-BR");
}

const ELLIPSIS = "…";

/**
 * Quebra o título só entre palavras, de forma gulosa. Se sobrar texto depois
 * de `maxLines`, a última linha perde palavras até `linha + "…"` caber; a
 * primeira palavra dela nunca sai. Uma palavra mais larga que a linha fica
 * inteira, sozinha.
 */
export function wrapTitle(
  title: string,
  measure: (text: string) => number,
  { maxWidth, maxLines = 3 }: { maxWidth: number; maxLines?: number },
): string[] {
  const words = title.split(/\s+/).filter((word) => word.length > 0);
  const lines: string[][] = [];
  let current: string[] = [];
  for (const word of words) {
    const candidate = [...current, word];
    if (current.length === 0 || measure(candidate.join(" ")) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = [word];
    }
  }
  if (current.length > 0) lines.push(current);
  if (lines.length <= maxLines) return lines.map((line) => line.join(" "));

  const kept = lines.slice(0, maxLines);
  const last = [...(kept[maxLines - 1] ?? [])];
  while (
    last.length > 1 &&
    measure(`${last.join(" ")}${ELLIPSIS}`) > maxWidth
  ) {
    last.pop();
  }
  kept[maxLines - 1] = last;
  return kept.map((line, index) =>
    index === maxLines - 1 ? `${line.join(" ")}${ELLIPSIS}` : line.join(" "),
  );
}

/**
 * Guarda do build: se a display medir o mesmo que a mono no mesmo texto, o
 * Pango não achou a IBM Plex Sans Condensed e caiu na outra face.
 */
export function assertFontLoaded(displayWidth: number, monoWidth: number) {
  if (displayWidth === monoWidth) {
    throw new Error(
      "Imagem OG: a fonte de display não carregou (mesma largura da mono).",
    );
  }
}

/** Escapa texto para a marcação do Pango, que o sharp usa em `text`. */
export function escapeMarkup(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
