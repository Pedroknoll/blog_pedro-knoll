// Guarda de SVG quebrado (T-104). O HTML Standard (§13.2.6.5, "The rules for
// parsing tokens in foreign content") manda o parser sair do SVG quando, dentro
// dele, aparece uma destas tags: o resto do desenho cai fora do <svg>. O MDX faz
// isso quando o Prettier quebra um <text> em linhas e a linha solta vira <p>.
// https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign

export const BREAKOUT_START_TAGS: readonly string[] = [
  "b",
  "big",
  "blockquote",
  "body",
  "br",
  "center",
  "code",
  "dd",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "hr",
  "i",
  "img",
  "li",
  "listing",
  "menu",
  "meta",
  "nobr",
  "ol",
  "p",
  "pre",
  "ruby",
  "s",
  "small",
  "span",
  "strong",
  "strike",
  "sub",
  "sup",
  "table",
  "tt",
  "u",
  "ul",
  "var",
];

const breakoutStart = new Set(BREAKOUT_START_TAGS);
const breakoutEnd = new Set(["br", "p"]);
// Pontos de integração HTML do SVG: dentro deles, HTML é permitido.
const integrationPoints = new Set(["title", "desc", "foreignobject"]);

export type SvgBreakout = {
  tag: string;
  line: number;
  // data-viz do <svg> de fora, quando há (o name do Figure)
  figure: string | null;
};

export type SvgBreakoutResult = {
  svgs: number;
  breakouts: SvgBreakout[];
};

const tokenPattern =
  /<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)([^>]*)>/gi;

function lineAt(html: string, offset: number) {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (html.charCodeAt(index) === 10) line += 1;
  }
  return line;
}

export function svgBreakouts(html: string): SvgBreakoutResult {
  const breakouts: SvgBreakout[] = [];
  let svgs = 0;
  let depth = 0;
  let integration: string | null = null;
  let figure: string | null = null;

  for (const match of html.matchAll(tokenPattern)) {
    const name = match[3]?.toLowerCase();
    if (!name) continue;
    const end = match[2] === "/";
    const attributes = match[4] ?? "";
    const selfClosing = attributes.trimEnd().endsWith("/");

    if (depth === 0) {
      if (name === "svg" && !end) {
        svgs += 1;
        figure = /\bdata-viz="([^"]*)"/.exec(attributes)?.[1] ?? null;
        if (!selfClosing) depth = 1;
      }
      continue;
    }

    if (integration) {
      if (end && name === integration) integration = null;
      continue;
    }

    if (!end && integrationPoints.has(name)) {
      if (!selfClosing) integration = name;
      continue;
    }

    const fontBreakout =
      !end && name === "font" && /\b(?:color|face|size)\s*=/i.test(attributes);
    if (
      (!end && breakoutStart.has(name)) ||
      (end && breakoutEnd.has(name)) ||
      fontBreakout
    ) {
      breakouts.push({
        tag: end ? `</${name}>` : `<${name}>`,
        line: lineAt(html, match.index ?? 0),
        figure,
      });
      continue;
    }

    if (name === "svg") {
      if (end) depth -= 1;
      else {
        svgs += 1;
        if (!selfClosing) depth += 1;
      }
    }
  }

  return { svgs, breakouts };
}
