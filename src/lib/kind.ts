export const KINDS = ["article", "prototype"] as const;

export type Kind = (typeof KINDS)[number];

export const KIND_LABELS: Record<Kind, string> = {
  article: "Artigo",
  prototype: "Protótipo",
};

export const KIND_SLUGS: Record<Kind, string> = {
  article: "artigos",
  prototype: "prototipos",
};

export function kindPath(kind: Kind): string {
  return `/${KIND_SLUGS[kind]}/`;
}

export function kindFromSlug(slug: string): Kind | undefined {
  return KINDS.find((kind) => KIND_SLUGS[kind] === slug);
}

type WithKind = { data: { kind: Kind } };

export function kindCounts<T extends WithKind>(
  posts: readonly T[],
): { kind: Kind; count: number }[] {
  const counts = new Map<Kind, number>();
  for (const post of posts) {
    counts.set(post.data.kind, (counts.get(post.data.kind) ?? 0) + 1);
  }
  return KINDS.flatMap((kind) => {
    const count = counts.get(kind) ?? 0;
    return count > 0 ? [{ kind, count }] : [];
  });
}

export function postsWithKind<T extends WithKind>(
  posts: readonly T[],
  kind: Kind,
): T[] {
  return posts.filter((post) => post.data.kind === kind);
}

export function kindCountWord(count: number): "post" | "posts" {
  return count === 1 ? "post" : "posts";
}

export function kindCountText(count: number): string {
  return `${count} ${kindCountWord(count)}`;
}
