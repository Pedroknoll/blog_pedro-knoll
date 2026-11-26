import { describe, expect, it } from "vitest";

import {
  assertFontLoaded,
  escapeMarkup,
  needsGeneratedOg,
  ogImagePath,
  ogKindLabel,
  wrapTitle,
} from "../../src/lib/og";

// Largura falsa: 10 px por caractere.
const measure = (text: string) => text.length * 10;

describe("U1 ogImagePath e needsGeneratedOg [RF-16]", () => {
  it("põe o PNG na pasta do post", () => {
    expect(ogImagePath("2026-10-um-post")).toBe("/blog/2026-10-um-post/og.png");
  });

  it("gera só para post sem capa", () => {
    expect(needsGeneratedOg({})).toBe(true);
    expect(needsGeneratedOg({ cover: undefined })).toBe(true);
    expect(needsGeneratedOg({ cover: { src: "/x.png" } })).toBe(false);
  });
});

describe("U2 ogKindLabel [RF-16]", () => {
  it("escreve o tipo em maiúsculas", () => {
    expect(ogKindLabel("article")).toBe("ARTIGO");
    expect(ogKindLabel("prototype")).toBe("PROTÓTIPO");
  });
});

describe("U3 wrapTitle [RF-16]", () => {
  it("deixa um título curto numa linha", () => {
    expect(wrapTitle("Um título curto", measure, { maxWidth: 200 })).toEqual([
      "Um título curto",
    ]);
  });

  it("quebra só entre palavras", () => {
    const lines = wrapTitle("aaaa bbbb cccc dddd", measure, { maxWidth: 90 });
    expect(lines).toEqual(["aaaa bbbb", "cccc dddd"]);
    for (const line of lines) expect(measure(line)).toBeLessThanOrEqual(90);
  });

  it("junta espaços repetidos", () => {
    expect(wrapTitle("  aaaa   bbbb ", measure, { maxWidth: 200 })).toEqual([
      "aaaa bbbb",
    ]);
  });

  it("corta na 3ª linha com reticências que cabem", () => {
    const lines = wrapTitle(
      "aaaa bbbb cccc dddd eeee ffff gggg hhhh",
      measure,
      { maxWidth: 90 },
    );
    expect(lines).toHaveLength(3);
    expect(lines.slice(0, 2)).toEqual(["aaaa bbbb", "cccc dddd"]);
    expect(lines[2]).toBe("eeee…");
    expect(measure(lines[2] ?? "")).toBeLessThanOrEqual(90);
  });

  it("põe reticências mesmo quando a 3ª linha está cheia", () => {
    const lines = wrapTitle("aaaa bbbb cccc dddd eeee ffff gggg", measure, {
      maxWidth: 90,
    });
    expect(lines).toEqual(["aaaa bbbb", "cccc dddd", "eeee…"]);
  });

  it("não corta título que cabe em 3 linhas", () => {
    expect(
      wrapTitle("aaaa bbbb cccc dddd eeee ffff", measure, { maxWidth: 90 }),
    ).toEqual(["aaaa bbbb", "cccc dddd", "eeee ffff"]);
  });

  it("deixa inteira uma palavra mais larga que a linha", () => {
    expect(
      wrapTitle("a palavralongademais b", measure, { maxWidth: 50 }),
    ).toEqual(["a", "palavralongademais", "b"]);
  });

  it("respeita maxLines", () => {
    expect(
      wrapTitle("aaaa bbbb cccc", measure, { maxWidth: 50, maxLines: 2 }),
    ).toEqual(["aaaa", "bbbb…"]);
  });
});

describe("U4 assertFontLoaded [RF-16]", () => {
  it("passa quando as duas faces medem diferente", () => {
    expect(() => assertFontLoaded(565, 808)).not.toThrow();
  });

  it("falha quando a display caiu na mesma face da mono", () => {
    expect(() => assertFontLoaded(808, 808)).toThrow(/fonte/i);
  });
});

describe("U5 escapeMarkup [RF-16]", () => {
  it("escapa o que o Pango lê como marcação", () => {
    expect(escapeMarkup(`A & B <c> "d" 'e'`)).toBe(
      "A &amp; B &lt;c&gt; &quot;d&quot; &apos;e&apos;",
    );
  });
});
