import { describe, expect, it } from "vitest";

import { hasCodeBlock, type CodeTree } from "../../src/lib/has-code";

describe("hasCodeBlock", () => {
  it("código cercado com linguagem é verdadeiro", () => {
    const tree: CodeTree = {
      type: "root",
      children: [{ type: "code", lang: "ts" }],
    };

    expect(hasCodeBlock(tree)).toBe(true);
  });

  it("código cercado sem linguagem é verdadeiro", () => {
    const tree: CodeTree = {
      type: "root",
      children: [{ type: "code", lang: null }],
    };

    expect(hasCodeBlock(tree)).toBe(true);
  });

  it("código dentro de blockquote é verdadeiro", () => {
    const tree: CodeTree = {
      type: "root",
      children: [
        {
          type: "blockquote",
          children: [{ type: "code", lang: "ts" }],
        },
      ],
    };

    expect(hasCodeBlock(tree)).toBe(true);
  });

  it("código dentro de listItem é verdadeiro", () => {
    const tree: CodeTree = {
      type: "root",
      children: [
        {
          type: "list",
          children: [
            {
              type: "listItem",
              children: [{ type: "code", lang: "ts" }],
            },
          ],
        },
      ],
    };

    expect(hasCodeBlock(tree)).toBe(true);
  });

  it("só inlineCode é falso", () => {
    const tree: CodeTree = {
      type: "root",
      children: [{ type: "inlineCode" }],
    };

    expect(hasCodeBlock(tree)).toBe(false);
  });

  it("só bloco math é falso", () => {
    const tree: CodeTree = {
      type: "root",
      children: [{ type: "code", lang: "math" }],
    };

    expect(hasCodeBlock(tree)).toBe(false);
  });

  it("árvore vazia é falsa", () => {
    const tree: CodeTree = { type: "root", children: [] };

    expect(hasCodeBlock(tree)).toBe(false);
  });
});
