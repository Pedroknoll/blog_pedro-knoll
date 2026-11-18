import { describe, expect, it } from "vitest";

import { BREAKOUT_START_TAGS, svgBreakouts } from "../../src/lib/svg-breakout";

const figure = (inner: string) =>
  `<figure><svg data-viz="vetor" viewBox="0 0 10 10" role="img"><title>Vetor</title>${inner}</svg><figcaption>Figura 1</figcaption></figure>`;

describe("svgBreakouts [RF-09, RNF-14]", () => {
  it("aceita a figura do Figure, com title, grade, text e tspan", () => {
    const html = figure(
      '<g class="stroke-grid"><line x1="0" y1="0" x2="10" y2="0"></line></g><text x="1" y="2">u<tspan>2</tspan></text>',
    );
    expect(svgBreakouts(html)).toEqual({ svgs: 1, breakouts: [] });
  });

  it("reprova o <p> que o MDX põe dentro do <text> quebrado pelo Prettier", () => {
    const html = figure(
      '<text x="1" y="2"><p>u</p></text><text x="3" y="4"><p>v</p></text>',
    );
    expect(svgBreakouts(html).breakouts).toEqual([
      { tag: "<p>", line: 1, figure: "vetor" },
      { tag: "</p>", line: 1, figure: "vetor" },
      { tag: "<p>", line: 1, figure: "vetor" },
      { tag: "</p>", line: 1, figure: "vetor" },
    ]);
  });

  it("reprova o <p> no último elemento do desenho", () => {
    const html = figure('<line x1="0"></line>\n<text><p>u</p></text>');
    expect(svgBreakouts(html).breakouts.map((b) => [b.tag, b.line])).toEqual([
      ["<p>", 2],
      ["</p>", 2],
    ]);
  });

  it("reprova a ênfase do Markdown dentro do <text>", () => {
    const html = figure("<text><em>u</em></text>");
    expect(svgBreakouts(html).breakouts.map((b) => b.tag)).toEqual(["<em>"]);
  });

  it("reprova cada tag da lista do HTML Standard", () => {
    expect(BREAKOUT_START_TAGS).toHaveLength(44);
    for (const tag of BREAKOUT_START_TAGS) {
      const html = figure(`<text><${tag}>u</text>`);
      expect(
        svgBreakouts(html).breakouts.map((b) => b.tag),
        tag,
      ).toEqual([`<${tag}>`]);
    }
  });

  it("reprova font com color, face ou size, e aceita font sem eles", () => {
    expect(
      svgBreakouts(figure('<font color="red">u</font>')).breakouts,
    ).toHaveLength(1);
    expect(
      svgBreakouts(figure('<font size="2">u</font>')).breakouts,
    ).toHaveLength(1);
    expect(svgBreakouts(figure("<font>u</font>")).breakouts).toEqual([]);
  });

  it("aceita HTML fora do svg, antes e depois dele", () => {
    const html = `<p>antes</p>${figure("<text>u</text>")}<p>depois <em>fim</em></p>`;
    expect(svgBreakouts(html)).toEqual({ svgs: 1, breakouts: [] });
  });

  it("aceita HTML dentro de title, desc e foreignObject", () => {
    const html = figure(
      "<desc><p>nota</p></desc><foreignObject><div><p>x</p></div></foreignObject>",
    ).replace("<title>Vetor</title>", "<title><b>Vetor</b></title>");
    expect(svgBreakouts(html)).toEqual({ svgs: 1, breakouts: [] });
  });

  it("ignora comentário, script e style", () => {
    const html = figure(
      '<!-- <p> --><script>const p = "<p>";</script><style>p::after { content: "<p>"; }</style><text>u</text>',
    );
    expect(svgBreakouts(html).breakouts).toEqual([]);
  });

  it("conta svg aninhado e svg vazio, e só sai do desenho no </svg> de fora", () => {
    const html = `<svg><svg></svg><text>a</text></svg><svg/><p>fora</p>`;
    expect(svgBreakouts(html)).toEqual({ svgs: 3, breakouts: [] });
    const broken = `<svg><svg></svg><text><p>a</p></text></svg>`;
    expect(svgBreakouts(broken).breakouts.map((b) => b.figure)).toEqual([
      null,
      null,
    ]);
  });
});
