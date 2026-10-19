import { describe, expect, it } from "vitest";

import {
  countWords,
  readingMinutes,
  type MdastNode,
} from "../../src/lib/reading-time";

function text(value: string): MdastNode {
  return { type: "text", value };
}

describe("countWords", () => {
  it("conta palavras de parágrafo e heading", () => {
    const tree: MdastNode = {
      type: "root",
      children: [
        {
          type: "heading",
          children: [text("Dois termos")],
        },
        {
          type: "paragraph",
          children: [text("três palavras aqui")],
        },
      ],
    };

    expect(countWords(tree)).toBe(5);
  });

  it.each([
    ["code", { type: "code", value: "ignorado" }],
    ["math", { type: "math", value: "ignorado" }],
    ["inlineMath", { type: "inlineMath", value: "ignorado" }],
    ["html", { type: "html", value: "ignorado" }],
    ["yaml", { type: "yaml", value: "ignorado" }],
    ["toml", { type: "toml", value: "ignorado" }],
    ["mdxjsEsm", { type: "mdxjsEsm", value: "ignorado" }],
    ["mdxFlowExpression", { type: "mdxFlowExpression", value: "ignorado" }],
    ["mdxTextExpression", { type: "mdxTextExpression", value: "ignorado" }],
  ] satisfies Array<[string, MdastNode]>)("ignora %s", (_name, node) => {
    const tree: MdastNode = {
      type: "root",
      children: [node, { type: "paragraph", children: [text("visível")] }],
    };

    expect(countWords(tree)).toBe(1);
  });

  it("ignora o alt da imagem", () => {
    const tree: MdastNode = {
      type: "root",
      children: [
        { type: "image", alt: "escondido" },
        { type: "paragraph", children: [text("visível")] },
      ],
    };

    expect(countWords(tree)).toBe(1);
  });

  it("conta o texto do componente MDX e ignora atributos", () => {
    const tree: MdastNode = {
      type: "root",
      children: [
        {
          type: "mdxJsxFlowElement",
          attributes: [{ name: "title", value: "segredo oculto" }],
          children: [text("alfa beta")],
        },
        {
          type: "mdxJsxTextElement",
          attributes: [{ name: "label", value: "outro segredo" }],
          children: [text("gama")],
        },
      ],
    };

    expect(countWords(tree)).toBe(3);
  });

  it("conta inlineCode", () => {
    const tree: MdastNode = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            text("antes"),
            { type: "inlineCode", value: "codigo interno" },
          ],
        },
      ],
    };

    expect(countWords(tree)).toBe(3);
  });

  it("ignora pontuação isolada e conta acento e número", () => {
    const tree: MdastNode = {
      type: "root",
      children: [text("--- ... não 200")],
    };

    expect(countWords(tree)).toBe(2);
  });
});

describe("readingMinutes", () => {
  it("arredonda para cima com mínimo de 1", () => {
    expect(readingMinutes(0)).toBe(1);
    expect(readingMinutes(200)).toBe(1);
    expect(readingMinutes(201)).toBe(2);
    expect(readingMinutes(400)).toBe(2);
  });
});
