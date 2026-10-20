import { describe, expect, it } from "vitest";

import { buildToc, type TocHeading, type TocItem } from "../../src/lib/toc";

function item(
  depth: number,
  slug: string,
  text: string,
  children: TocItem[] = [],
): TocItem {
  return { depth, slug, text, children };
}

describe("buildToc", () => {
  it("mantém só depth 2 e 3, na ordem", () => {
    const headings: TocHeading[] = [
      { depth: 1, slug: "titulo", text: "Título" },
      { depth: 2, slug: "a", text: "A" },
      { depth: 4, slug: "detalhe", text: "Detalhe" },
      { depth: 3, slug: "b", text: "B" },
      { depth: 2, slug: "c", text: "C" },
    ];

    expect(buildToc(headings)).toEqual([
      item(2, "a", "A", [item(3, "b", "B")]),
      item(2, "c", "C"),
    ]);
  });

  it("aninha o h3 sob o h2 anterior", () => {
    const headings: TocHeading[] = [
      { depth: 2, slug: "a", text: "A" },
      { depth: 3, slug: "b", text: "B" },
      { depth: 3, slug: "c", text: "C" },
      { depth: 2, slug: "d", text: "D" },
    ];

    expect(buildToc(headings)).toEqual([
      item(2, "a", "A", [item(3, "b", "B"), item(3, "c", "C")]),
      item(2, "d", "D"),
    ]);
  });

  it("h3 antes de qualquer h2 vira item de topo", () => {
    const headings: TocHeading[] = [
      { depth: 3, slug: "b", text: "B" },
      { depth: 2, slug: "a", text: "A" },
    ];

    expect(buildToc(headings)).toEqual([item(3, "b", "B"), item(2, "a", "A")]);
  });

  it("lista vazia devolve []", () => {
    expect(buildToc([])).toEqual([]);
  });
});
