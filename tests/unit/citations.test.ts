import { describe, expect, it } from "vitest";

import {
  applyCitations,
  CITATION_TYPE_LABELS,
  CITATION_TYPES,
  type CitationType,
  citationsSchema,
  duplicateCitationKeys,
  formatAuthors,
  orderCitations,
  postAppendix,
} from "../../src/lib/citations";

const file = "arquivo.md";

function citation(
  key: string,
  type: CitationType = "paper",
  authors: string[] = ["Autor"],
  title = "Título",
) {
  return {
    key,
    type,
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
    url: `#cit-${key}`,
    data: { hProperties: { "aria-label": `Citação ${n}` } },
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

describe("CITATION_TYPES", () => {
  it("ordem e rótulos dos grupos", () => {
    expect(CITATION_TYPES).toEqual([
      "model",
      "dataset",
      "paper",
      "article",
      "course",
      "video",
    ]);
    expect(CITATION_TYPES.map((type) => CITATION_TYPE_LABELS[type])).toEqual([
      "Modelos",
      "Datasets",
      "Papers",
      "Textos",
      "Cursos",
      "Vídeos",
    ]);
  });
});

describe("citationsSchema", () => {
  it("aceita citação com tipo e lista vazia por padrão", () => {
    expect(citationsSchema.safeParse([citation("a", "model")]).success).toBe(
      true,
    );
    expect(citationsSchema.parse(undefined)).toEqual([]);
  });

  it("tipo ausente reprova", () => {
    const withoutType: Partial<ReturnType<typeof citation>> = citation("a");
    delete withoutType.type;
    expect(citationsSchema.safeParse([withoutType]).success).toBe(false);
  });

  it("tipo fora do enum reprova", () => {
    expect(
      citationsSchema.safeParse([{ ...citation("a"), type: "podcast" }])
        .success,
    ).toBe(false);
  });

  it("chave repetida reprova com a mensagem", () => {
    const result = citationsSchema.safeParse([citation("a"), citation("a")]);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Chave de citação repetida: a",
    );
  });
});

describe("orderCitations", () => {
  it("agrupa na ordem do enum e mantém a ordem do frontmatter dentro do grupo", () => {
    const ordered = orderCitations([
      citation("v1", "video"),
      citation("p1", "paper"),
      citation("m1", "model"),
      citation("p2", "paper"),
    ]);
    expect(ordered.map((item) => item.key)).toEqual(["m1", "p1", "p2", "v1"]);
  });
});

describe("applyCitations", () => {
  it("o número segue a ordem dos grupos, não a do frontmatter", () => {
    const tree = root("Veja [@a] e [@b].");

    applyCitations(
      tree,
      [citation("a", "video"), citation("b", "paper")],
      file,
    );

    expect(tree.children[0]?.children).toEqual([
      { type: "text", value: "Veja " },
      cite(2, "a"),
      { type: "text", value: " e " },
      cite(1, "b"),
      { type: "text", value: "." },
    ]);
  });

  it("vários marcadores no mesmo nó text", () => {
    const tree = root("Um [@primeira] e outro [@segunda].");

    applyCitations(tree, [citation("primeira"), citation("segunda")], file);

    expect(tree.children[0]?.children).toEqual([
      { type: "text", value: "Um " },
      cite(1, "primeira"),
      { type: "text", value: " e outro " },
      cite(2, "segunda"),
      { type: "text", value: "." },
    ]);
  });

  it("marcador dentro de emphasis, list, blockquote e componente MDX", () => {
    type TestNode = { type: string; value?: string; children?: TestNode[] };
    const tree: { type: string; children: TestNode[] } = {
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

    applyCitations(tree, [citation("chave")], file);

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

  it.each(["code", "inlineCode", "math"])("preserva [@chave] em %s", (type) => {
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

    applyCitations(tree, [citation("chave")], file);

    expect(tree.children[0]).toEqual({ type, value: "veja [@chave]" });
    expect(tree.children[1]?.children).toEqual([
      { type: "text", value: "citada " },
      cite(1, "chave"),
    ]);
  });

  it("chave citada sem citação", () => {
    expect(
      thrownMessage(() =>
        applyCitations(root("Veja [@ausente]."), [citation("outra")], file),
      ),
    ).toBe("Chave citada sem citação: @ausente em arquivo.md");
  });

  it("citação sem marcador no texto passa (citação indireta)", () => {
    const tree = root("Veja [@usada].");

    expect(() =>
      applyCitations(
        tree,
        [citation("indireta", "model"), citation("usada")],
        file,
      ),
    ).not.toThrow();
    expect(tree.children[0]?.children?.[1]).toEqual(cite(2, "usada"));
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
        thrownMessage(() => applyCitations(tree, [citation("chave")], file)),
        type,
      ).toBe("Citação dentro de link: @chave em arquivo.md");
    }
  });

  it("árvore sem marcador permanece igual, com ou sem citações", () => {
    for (const citations of [undefined, [], [citation("solta")]] as const) {
      const tree = root("Texto sem marcador.");
      const before = structuredClone(tree);

      expect(applyCitations(tree, citations, file)).toBe(tree);
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
  it("apêndices com rótulo e título, e citações agrupadas por tipo", () => {
    const model = postAppendix(
      [
        citation("v1", "video", ["Autor Um"], "Vídeo"),
        citation("p1", "paper", ["Autor Um", "Autor Dois"], "Paper Um"),
        citation("m1", "model", ["Org"], "Modelo"),
        citation("p2", "paper", ["Autor Três"], "Paper Dois"),
      ],
      [
        { title: "Primeiro", paragraphs: ["Parágrafo do primeiro."] },
        { title: "Segundo", paragraphs: ["Parágrafo do segundo."] },
      ],
    );

    expect(model).toBeDefined();
    if (!model?.citations) throw new Error("área sem citações");

    expect(model.appendices).toEqual([
      {
        id: "apendice-a",
        label: "Apêndice A",
        title: "Primeiro",
        paragraphs: ["Parágrafo do primeiro."],
      },
      {
        id: "apendice-b",
        label: "Apêndice B",
        title: "Segundo",
        paragraphs: ["Parágrafo do segundo."],
      },
    ]);

    expect(model.citations.id).toBe("citacoes");
    expect(model.citations.text).toBe("Citações");
    expect(
      model.citations.groups.map(({ type, label, count, start }) => ({
        type,
        label,
        count,
        start,
      })),
    ).toEqual([
      { type: "model", label: "Modelos", count: 1, start: 1 },
      { type: "paper", label: "Papers", count: 2, start: 2 },
      { type: "video", label: "Vídeos", count: 1, start: 4 },
    ]);
    expect(
      model.citations.groups.flatMap((group) =>
        group.items.map((item) => [item.n, item.id]),
      ),
    ).toEqual([
      [1, "cit-m1"],
      [2, "cit-p1"],
      [3, "cit-p2"],
      [4, "cit-v1"],
    ]);
    expect(model.citations.groups[1]?.items[0]).toEqual({
      id: "cit-p1",
      n: 2,
      authors: "Autor Um e Autor Dois",
      year: 2020,
      title: "Paper Um",
      url: "https://example.com/p1",
      venue: "Veículo",
    });
  });

  it("só apêndices não traz citações", () => {
    const model = postAppendix(
      [],
      [{ title: "Notas", paragraphs: ["Texto."] }],
    );
    expect(model?.appendices.map((section) => section.id)).toEqual([
      "apendice-a",
    ]);
    expect(model?.citations).toBeUndefined();
  });

  it("só citações não traz apêndice", () => {
    const model = postAppendix([citation("obra")], []);
    expect(model?.appendices).toEqual([]);
    expect(model?.citations?.groups).toHaveLength(1);
  });

  it("sem campos devolve undefined", () => {
    expect(postAppendix()).toBeUndefined();
    expect(postAppendix(undefined, undefined)).toBeUndefined();
    expect(postAppendix([], [])).toBeUndefined();
  });
});

describe("duplicateCitationKeys", () => {
  it("chave repetida devolve a chave e lista única devolve []", () => {
    expect(
      duplicateCitationKeys([
        citation("alpha"),
        citation("beta"),
        citation("alpha"),
      ]),
    ).toEqual(["alpha"]);
    expect(
      duplicateCitationKeys([citation("alpha"), citation("beta")]),
    ).toEqual([]);
  });
});
