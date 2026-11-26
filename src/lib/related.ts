// Posts relacionados pelas tags (RF-18, T-26): até 2 com tags em comum, nunca
// o próprio, pelo número de tags em comum e, no empate, pela data mais
// recente. Sem tag em comum, a lista fica vazia e a seção não aparece.

type Tagged = { id: string; data: { tags: readonly string[]; pubDate: Date } };

const LIMIT = 2;

export function relatedPosts<T extends Tagged>(
  current: Tagged,
  posts: readonly T[],
  limit = LIMIT,
): T[] {
  const tags = new Set(current.data.tags);
  return posts
    .filter((post) => post.id !== current.id)
    .map((post) => ({
      post,
      shared: [...new Set(post.data.tags)].filter((tag) => tags.has(tag))
        .length,
    }))
    .filter((entry) => entry.shared > 0)
    .sort(
      (left, right) =>
        right.shared - left.shared ||
        right.post.data.pubDate.getTime() - left.post.data.pubDate.getTime(),
    )
    .slice(0, limit)
    .map((entry) => entry.post);
}
