import type { Kind } from "./kind";

const LIMIT = 5;

type Listed = { data: { kind: Kind } };

export function homeLists<T extends Listed>(
  posts: readonly T[],
): {
  recent: T[];
  prototypes: T[];
} {
  return {
    recent: posts.slice(0, LIMIT),
    prototypes: posts
      .filter((post) => post.data.kind === "prototype")
      .slice(0, LIMIT),
  };
}
