import { describe, expect, it } from "vitest";

import {
  applyCitations,
  duplicateReferenceKeys,
  formatAuthors,
  postAppendix,
} from "../../src/lib/references";

const file = "arquivo.md";

function reference(
  key: string,
  authors: string[] = ["Autor"],
  title = "Título",
) {
  return {
    key,
    authors,
    title,
    year: 2020,
    venue: "Veículo",
    url: `https://example.com/${key}`,
  };
}

function cite(n: number, key: string) {
  return {
    type: "link",
    url: `#ref-${key}`,
    data: { hProperties: { "aria-label": `Referência ${n}` } },
    children: [{ type: "text", value: `[${n}]` }],
  };
}

function root(value: string) {
  return {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value }],
      },
    ],
  };
}

function thrownMessage(run: () => void): string {
  try {
    run();
  } catch (error) {
    if (error instanceof Error) return error.message;
    throw error;
  }
  throw new Error("a função não lançou");
}

describe("applyCitations", () => {
  it("um marcador vira o link da posição na lista", () => {
    const tree = root("Veja [@segunda] aqui.");

    applyCitations(tree, [reference("primeira"), reference("segunda")], file);

    expect(tree.children[0]?.children).toEqual([
      { type: "text", value: "Veja " },
      cite(2, "segunda"),
      { type: "text", value: " aqui." },
    ]);
  });

  it("vários marcadores no mesmo nó text", () => {
    const tree = root("Um [@primeira] e outro [@segunda].");

    applyCitations(tree, [reference("primeira"), reference("segunda")], file);

    expect(tree.children[0]?.children).toEqual([
      { type: "text", value: "Um " },
      cite(1, "primeira"),
      { type: "text", value: " e outro " },
      cite(2, "segunda"),
      { type: "text", value: "." },
    ]);
  });

  it("marcador dentro de emphasis, list, blockquote e componente MDX", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "emphasis",
          children: [{ type: "text", value: "veja [@chave]" }],
        },
        {
          type: "list",
          children: [
            {
              type: "listItem",
              children: [{ type: "text", value: "item [@chave]" }],
            },
          ],
        },
        {
          type: "blockquote",
          children: [{ type: "text", value: "cita [@chave]" }],
        },
        {
          type: "mdxJsxFlowElement",
          children: [{ type: "text", value: "fluxo [@chave]" }],
        },
        {
          type: "mdxJsxTextElement",
          children: [{ type: "text", value: "texto [@chave]" }],
        },
      ],
    };

    applyCitations(tree, [reference("chave")], file);

    expect(tree.children[0]?.children).toEqual([
      { type: "text", value: "veja " },
      cite(1, "chave"),
    ]);
    expect(tree.children[1]?.children?.[0]?.children).toEqual([
      { type: "text", value: "item " },
      cite(1, "chave"),
    ]);
    expect(tree.children[2]?.children).toEqual([
      { type: "text", value: "cita " },
      cite(1, "chave"),
    ]);
    expect(tree.children[3]?.children).toEqual([
      { type: "text", value: "fluxo " },
      cite(1, "chave"),
    ]);
    expect(tree.children[4]?.children).toEqual([
      { type: "text", value: "texto " },
      cite(1, "chave"),
    ]);
  });

  it.each(["code", "inlineCode", "math"])(
    "preserva [@chave] em %s",
    (type) => {
      const tree = {
        type: "root",
        children: [
          { type, value: "veja [@chave]" },
          {
            type: "paragraph",
            children: [{ type: "text", value: "citada [@chave]" }],
          },
        ],
      };

      applyCitations(tree, [reference("chave")], file);

      expect(tree.children[0]).toEqual({ type, value: "veja [@chave]" });
      expect(tree.children[1]?.children).toEqual([
        { type: "text", value: "citada " },
        cite(1, "chave"),
      ]);
    },
  );

  it("citação sem referência", () => {
    expect(
      thrownMessage(() =>
        applyCitations(root("Veja [@ausente]."), [reference("outra")], file),
      ),
    ).toBe("Citação sem referência: @ausente em arquivo.md");
  });

  it("referência não citada", () => {
    expect(
      thrownMessage(() =>
        applyCitations(
          root("Veja [@usada]."),
          [reference("falta"), reference("usada")],
          file,
        ),
      ),
    ).toBe("Referência não citada: falta em arquivo.md");
  });

  it("citação dentro de link e de linkReference", () => {
    for (const type of ["link", "linkReference"]) {
      const tree = {
        type: "root",
        children: [
          {
            type,
            children: [{ type: "text", value: "antes [@chave] depois" }],
          },
        ],
      };

      expect(
        thrownMessage(() =>
          applyCitations(tree, [reference("chave")], file),
        ),
        type,
      ).toBe("Citação dentro de link: @chave em arquivo.md");
    }
  });

  it("árvore sem marcador e sem referências permanece o mesmo objeto", () => {
    for (const references of [undefined, []] as const) {
      const tree = root("Texto sem marcador.");
      const before = structuredClone(tree);

      expect(applyCitations(tree, references, file)).toBe(tree);
      expect(tree).toEqual(before);
    }
  });
});

describe("formatAuthors", () => {
  it.each([
    [["Autor Um"], "Autor Um"],
    [["Autor Um", "Autor Dois"], "Autor Um e Autor Dois"],
    [
      ["Autor Um", "Autor Dois", "Autor Três"],
      "Autor Um, Autor Dois e Autor Três",
    ],
  ] satisfies Array<[string[], string]>)(
    "formata %j como %s",
    (authors, formatted) => {
      expect(formatAuthors(authors)).toBe(formatted);
    },
  );
});

describe("postAppendix", () => {
  it("área completa traz os h2 e o sumário na mesma ordem", () => {
    const first = "Primeiro título";
    const second = "Segundo título";
    const model = postAppendix(
      [
        reference("alpha", ["Autor Um"], "Título Alpha"),
        reference("beta", ["Autor Um", "Autor Dois"], "Título Beta"),
      ],
      [
        { title: first, paragraphs: ["Parágrafo do primeiro."] },
        { title: second, paragraphs: ["Parágrafo do segundo."] },
      ],
    );

    expect(model).toBeDefined();
    if (!model?.references) throw new Error("área sem referências");

    expect(model.appendices.map((section) => section.id)).toEqual([
      "apendice-a",
      "apendice-b",
    ]);
    expect(model.appendices.map((section) => section.text)).toEqual([
      `Apêndice A · ${first}`,
      `Apêndice B · ${second}`,
    ]);
    expect(model.appendices.map((section) => section.paragraphs)).toEqual([
      ["Parágrafo do primeiro."],
      ["Parágrafo do segundo."],
    ]);
    expect(model.references.id).toBe("referencias");
    expect(model.references.text).toBe("Referências");
    expect(model.references.items.map((item) => item.id)).toEqual([
      "ref-alpha",
      "ref-beta",
    ]);
    expect(model.references.items[0]).toEqual({
      id: "ref-alpha",
      authors: "Autor Um",
      year: 2020,
      title: "Título Alpha",
      url: "https://example.com/alpha",
      venue: "Veículo",
    });
    expect(model.references.items[1]).toMatchObject({
      id: "ref-beta",
      authors: "Autor Um e Autor Dois",
    });

    const headings = [
      ...model.appendices.map((section) => ({
        id: section.id,
        text: section.text,
      })),
      { id: model.references.id, text: model.references.text },
    ];
    expect(model.toc).toEqual(
      headings.map((heading) => ({
        depth: 2,
        slug: heading.id,
        text: heading.text,
        children: [],
      })),
    );
  });

  it.each([
    {
      name: "só apêndices não traz referencias",
      references: [],
      appendices: [{ title: "Notas", paragraphs: ["Texto."] }],
      slugs: ["apendice-a"],
    },
    {
      name: "só referências não traz apêndice",
      references: [reference("obra")],
      appendices: [],
      slugs: ["referencias"],
    },
  ])("$name", ({ references, appendices, slugs }) => {
    const model = postAppendix(references, appendices);

    expect(model).toBeDefined();
    expect(model?.toc.map((item) => item.slug)).toEqual(slugs);
    if (slugs[0] === "referencias") {
      expect(model?.appendices).toEqual([]);
      expect(model?.toc.some((item) => item.slug.includes("apendice"))).toBe(
        false,
      );
      return;
    }
    expect(model?.references).toBeUndefined();
    expect(model?.toc.some((item) => item.slug === "referencias")).toBe(false);
  });

  it("sem campos devolve undefined", () => {
    expect(postAppendix()).toBeUndefined();
    expect(postAppendix(undefined, undefined)).toBeUndefined();
    expect(postAppendix([], [])).toBeUndefined();
  });
});

describe("duplicateReferenceKeys", () => {
  it("chave repetida devolve a chave e lista única devolve []", () => {
    expect(
      duplicateReferenceKeys([
        reference("alpha"),
        reference("beta"),
        reference("alpha"),
      ]),
    ).toEqual(["alpha"]);
    expect(
      duplicateReferenceKeys([reference("alpha"), reference("beta")]),
    ).toEqual([]);
  });
});
