import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";

import articleIcon from "../assets/brand/icones/icone-artigo.svg?raw";
import prototypeIcon from "../assets/brand/icones/icone-prototipo.svg?raw";
import { OG_COLORS } from "../assets/brand/og-ficha";
import type { Kind } from "./kind";
import {
  assertFontLoaded,
  escapeMarkup,
  OG_HEIGHT,
  OG_WIDTH,
  ogKindLabel,
  wrapTitle,
} from "./og";

// Desenho da ficha OG (BRAND §11) com o sharp. O sharp desenha texto pelo
// Pango, que só acha fonte pelo fontconfig e só lê TTF (o woff2 das páginas
// cai noutra face sem erro). Por isso as duas TTF da Fonts API vão para uma
// pasta própria, com um fonts.conf que só conhece elas: no Mac e no Linux do
// CI, nenhuma fonte do sistema entra (T-23).

export type OgFonts = { display: Uint8Array; mono: Uint8Array };

export type OgPost = { title: string; kind: Kind; domain: string };

const DISPLAY = "IBM Plex Sans Condensed SemiBold";
const MONO = "IBM Plex Mono";

const MARGIN = 72;
const CONTENT_WIDTH = OG_WIDTH - 2 * MARGIN;
const RIGHT = OG_WIDTH - MARGIN;

const ICON_SIZE = 24;
const ICON_CENTER = MARGIN + ICON_SIZE / 2;
const LABEL_SIZE = 22;
const TOP_RULE_Y = MARGIN + ICON_SIZE + 20;
const RULE = 2;

const TITLE_SIZE = 72;
const TITLE_FIRST_BASELINE = 222;
const TITLE_STEP = 80;

const FOOTER_BASELINE = OG_HEIGHT - MARGIN;
const FOOTER_RULE_Y = 500;
const WORDMARK_SIZE = 34;
const WORDMARK_SMALL = Math.round(WORDMARK_SIZE * 0.8);

// Glifos alto e fundo, invisíveis, no fim de cada linha: o sharp recorta a
// imagem pela tinta das letras, e a escora fixa o topo e a linha de base.
const STRUT = "ÁÇj";

const FONT_DIR = join(tmpdir(), "pklog-og-fonts");

function writeIfChanged(path: string, data: Uint8Array | string) {
  const next = Buffer.from(data);
  try {
    if (readFileSync(path).equals(next)) return;
  } catch {
    // ainda não existe
  }
  writeFileSync(path, next);
}

/**
 * Grava as TTF e o fonts.conf e aponta o fontconfig para eles. Precisa vir
 * antes do primeiro texto do sharp no processo: o fontconfig e o Pango leem
 * as variáveis na primeira vez.
 */
function installFonts(fonts: OgFonts) {
  mkdirSync(FONT_DIR, { recursive: true });
  writeIfChanged(join(FONT_DIR, "display.ttf"), fonts.display);
  writeIfChanged(join(FONT_DIR, "mono.ttf"), fonts.mono);
  const dir = escapeMarkup(FONT_DIR);
  const conf = join(FONT_DIR, "fonts.conf");
  writeIfChanged(
    conf,
    `<?xml version="1.0"?>\n<fontconfig><dir>${dir}</dir><cachedir>${dir}/cache</cachedir></fontconfig>\n`,
  );
  process.env.FONTCONFIG_FILE = conf;
  process.env.PANGOCAIRO_BACKEND = "fc";
}

const font = (family: string, size: number) => `${family} ${size}`;

async function renderText(markup: string) {
  const { data, info } = await sharp({
    text: { text: markup, font: font(MONO, LABEL_SIZE), rgba: true, dpi: 72 },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

const span = (family: string, size: number, attrs = "") =>
  `<span font="${font(family, size)}"${attrs}>`;

async function textWidth(markup: string) {
  return (await renderText(markup)).width;
}

type Layer = { input: Buffer; left: number; top: number; width: number };

/** A linha recortada da borda da tinta, com o topo na escora. */
async function textLine(
  markup: string,
  strut: { family: string; size: number },
  baseline: number,
  left: number,
): Promise<Layer> {
  const strutSpan = `${span(strut.family, strut.size, ' alpha="1"')}${STRUT}</span>`;
  const [plain, withStrut, cap] = await Promise.all([
    renderText(markup),
    renderText(`${markup}${strutSpan}`),
    renderText(`${span(strut.family, strut.size)}Á</span>`),
  ]);
  const input = await sharp(withStrut.data)
    .extract({ left: 0, top: 0, width: plain.width, height: withStrut.height })
    .png()
    .toBuffer();
  // O Á fica na linha de base: a altura dele é a distância do topo da escora
  // até a base.
  return { input, left, top: baseline - cap.height, width: plain.width };
}

function background(kind: Kind): Buffer {
  const icon = (kind === "article" ? articleIcon : prototypeIcon)
    .replace(/<svg[^>]*>/, "")
    .replace("</svg>", "")
    .replaceAll("currentColor", OG_COLORS.ink);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <defs>
    <pattern id="mm" width="8" height="8" patternUnits="userSpaceOnUse">
      <path d="M8 0H0V8" fill="none" stroke="${OG_COLORS.grid}" stroke-width="1"/>
    </pattern>
    <pattern id="cm" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="url(#mm)"/>
      <path d="M40 0H0V40" fill="none" stroke="${OG_COLORS.gridStrong}" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="${OG_COLORS.surface}"/>
  <rect width="100%" height="100%" fill="url(#cm)"/>
  <g transform="translate(${MARGIN} ${MARGIN}) scale(${ICON_SIZE / 12})" fill="${OG_COLORS.ink}" shape-rendering="crispEdges">${icon}</g>
  <rect x="${MARGIN}" y="${TOP_RULE_Y}" width="${CONTENT_WIDTH}" height="${RULE}" fill="${OG_COLORS.ink}"/>
  <rect x="${MARGIN}" y="${FOOTER_RULE_Y}" width="${CONTENT_WIDTH}" height="${RULE}" fill="${OG_COLORS.line}"/>
</svg>`;
  return Buffer.from(svg);
}

let installed = false;

/** PNG 1200×630 da ficha do post sem capa (RF-16, BRAND §11). */
export async function renderOgImage(
  post: OgPost,
  fonts: OgFonts,
): Promise<Buffer> {
  if (!installed) {
    installFonts(fonts);
    installed = true;
  }

  const probe = "Como o blog é feito";
  assertFontLoaded(
    await textWidth(`${span(DISPLAY, TITLE_SIZE)}${probe}</span>`),
    await textWidth(`${span(MONO, TITLE_SIZE)}${probe}</span>`),
  );

  const titleSpan = span(DISPLAY, TITLE_SIZE, ` foreground="${OG_COLORS.ink}"`);
  const widths = new Map<string, number>();
  const measure = async (text: string) => {
    const cached = widths.get(text);
    if (cached !== undefined) return cached;
    const width = await textWidth(`${titleSpan}${escapeMarkup(text)}</span>`);
    widths.set(text, width);
    return width;
  };
  const lines = await wrapTitleAsync(post.title, measure);

  const display = { family: DISPLAY, size: TITLE_SIZE };
  const label = { family: MONO, size: LABEL_SIZE };
  const wordmark = { family: DISPLAY, size: WORDMARK_SIZE };
  // Caixa alta da mono: altura de capitular de ~0,7 do corpo, centrada no
  // ícone.
  const labelBaseline = Math.round(ICON_CENTER + (LABEL_SIZE * 0.7) / 2);
  const tracking = Math.round(LABEL_SIZE * 0.1 * 1024);

  const layers: Layer[] = [
    await textLine(
      `${span(MONO, LABEL_SIZE, ` foreground="${OG_COLORS.ink}" letter_spacing="${tracking}"`)}${escapeMarkup(ogKindLabel(post.kind))}</span>`,
      label,
      labelBaseline,
      MARGIN + ICON_SIZE + 12,
    ),
    ...(await Promise.all(
      lines.map((line, index) =>
        textLine(
          `${titleSpan}${escapeMarkup(line)}</span>`,
          display,
          TITLE_FIRST_BASELINE + index * TITLE_STEP,
          MARGIN,
        ),
      ),
    )),
    await textLine(
      `${span(DISPLAY, WORDMARK_SIZE, ` foreground="${OG_COLORS.ink}"`)}pk</span>` +
        `${span(MONO, WORDMARK_SMALL, ` foreground="${OG_COLORS.accent}"`)}.</span>` +
        `${span(MONO, WORDMARK_SMALL, ` foreground="${OG_COLORS.ink}" letter_spacing="${Math.round(WORDMARK_SMALL * -0.02 * 1024)}"`)}log</span>`,
      wordmark,
      FOOTER_BASELINE,
      MARGIN,
    ),
  ];

  const domain = await textLine(
    `${span(MONO, LABEL_SIZE, ` foreground="${OG_COLORS.muted}"`)}${escapeMarkup(post.domain)}</span>`,
    label,
    FOOTER_BASELINE,
    0,
  );
  layers.push({ ...domain, left: RIGHT - domain.width });

  return sharp(background(post.kind))
    .composite(layers.map(({ input, left, top }) => ({ input, left, top })))
    .png()
    .toBuffer();
}

/** O wrapTitle com uma medida assíncrona: mede antes as linhas candidatas. */
async function wrapTitleAsync(
  title: string,
  measure: (text: string) => Promise<number>,
): Promise<string[]> {
  // O wrapTitle é síncrono; repete-se até toda medida pedida estar em cache.
  const known = new Map<string, number>();
  for (;;) {
    const missing = new Set<string>();
    const lines = wrapTitle(
      title,
      (text) => {
        const width = known.get(text);
        if (width === undefined) {
          missing.add(text);
          return 0;
        }
        return width;
      },
      { maxWidth: CONTENT_WIDTH },
    );
    if (missing.size === 0) return lines;
    for (const text of missing) known.set(text, await measure(text));
  }
}
