type Tagged = { id: string; data: { tags: string[] } };

export function collectTags<T extends Tagged>(posts: readonly T[]): string[] {
  void posts;
  throw new Error("não implementado");
}

export function postsWithTag<T extends Tagged>(
  posts: readonly T[],
  tag: string,
): T[] {
  void posts;
  void tag;
  throw new Error("não implementado");
}

export function tagPath(tag: string): string {
  void tag;
  throw new Error("não implementado");
}
