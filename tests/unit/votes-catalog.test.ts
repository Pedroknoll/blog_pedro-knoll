import { describe, expect, it } from "vitest";

import { selectPublished } from "../../src/lib/published";
import { catalogFromPosts, listCatalog } from "../../src/lib/votes-catalog";

describe("catalogFromPosts", () => {
  it("lista os ids recebidos, em ordem e sem repetir", () => {
    expect(
      catalogFromPosts([{ id: "zeta" }, { id: "alfa" }, { id: "zeta" }]),
    ).toEqual({ slugs: ["alfa", "zeta"] });
  });

  it("devolve uma lista vazia quando não há entrada", () => {
    expect(catalogFromPosts([])).toEqual({ slugs: [] });
  });
});

describe("listCatalog", () => {
  const posts = [
    {
      id: "novo",
      minutes: 8,
      data: {
        title: "A < B",
        pubDate: new Date("2024-05-01T00:00:00.000Z"),
        kind: "article" as const,
        tags: ["b", "c"],
        draft: false,
      },
    },
    {
      id: "rascunho",
      minutes: 4,
      data: {
        title: "Rascunho",
        pubDate: new Date("2024-06-01T00:00:00.000Z"),
        kind: "prototype" as const,
        tags: ["so-rascunho"],
        draft: true,
      },
    },
    {
      id: "antigo",
      minutes: 3,
      data: {
        title: "Antigo",
        pubDate: new Date("2020-01-01T00:00:00.000Z"),
        kind: "prototype" as const,
        tags: [],
        draft: false,
      },
    },
  ];

  it("tem os seis campos, escapa < e segue selectPublished", () => {
    const json = listCatalog(posts, false);
    expect(json.includes("<")).toBe(false);
    expect(json).toContain("\\u003c");
    const parsed = JSON.parse(json) as {
      slug: string;
      title: string;
      date: string;
      kind: string;
      minutes: number;
      tags: string[];
    }[];
    expect(parsed).toEqual([
      {
        slug: "novo",
        title: "A < B",
        date: "2024-05-01",
        kind: "article",
        minutes: 8,
        tags: ["b", "c"],
      },
      {
        slug: "antigo",
        title: "Antigo",
        date: "2020-01-01",
        kind: "prototype",
        minutes: 3,
        tags: [],
      },
    ]);
    expect(parsed.map((item) => item.slug)).toEqual(
      selectPublished(posts, false).map((item) => item.id),
    );
    const withDrafts = JSON.parse(listCatalog(posts, true)) as {
      slug: string;
    }[];
    expect(withDrafts.map((item) => item.slug)).toEqual(
      selectPublished(posts, true).map((item) => item.id),
    );
  });
});
