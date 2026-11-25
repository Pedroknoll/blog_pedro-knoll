import type { Kind } from "./kind";
import { allLinkName } from "./tag-filter";

const LIMIT = 5;

type Listed = { data: { kind: Kind } };

export function homeLists<T extends Listed>(
  posts: readonly T[],
): {
  recent: T[];
  prototypes: T[];
  totals: { posts: number; prototypes: number };
} {
  const prototypes = posts.filter((post) => post.data.kind === "prototype");
  return {
    recent: posts.slice(0, LIMIT),
    prototypes: prototypes.slice(0, LIMIT),
    totals: {
      posts: posts.length,
      prototypes: prototypes.length,
    },
  };
}

export type BandLink = { text: string; name: string };

function bandLink(name: string): BandLink {
  return { text: `${name} →`, name };
}

// Links das faixas da home (BRAND §9.2): o nome acessível é o texto sem a seta.
export function homeLinks(totals: { posts: number; prototypes: number }): {
  posts: BandLink;
  prototypes: BandLink;
  ranking: BandLink;
} {
  return {
    posts: bandLink(allLinkName(totals.posts, { one: "post", many: "posts" })),
    prototypes: bandLink(
      allLinkName(totals.prototypes, {
        one: "protótipo",
        many: "protótipos",
      }),
    ),
    ranking: bandLink("Ver ranking"),
  };
}

export type Thumbnail<T> = { kind: "cover"; cover: T } | { kind: "block" };

// Miniatura do item de Protótipos: a capa, ou um bloco `sheet` sem capa.
export function thumbnailOf<T>(cover: T | undefined): Thumbnail<T> {
  return cover === undefined ? { kind: "block" } : { kind: "cover", cover };
}
