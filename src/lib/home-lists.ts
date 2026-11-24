import type { Kind } from "./kind";

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
