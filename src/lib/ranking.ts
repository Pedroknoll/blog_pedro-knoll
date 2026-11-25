export type CatalogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  kind: "article" | "prototype";
  minutes: number;
  tags: string[];
};

export function rankPosts(
  catalog: readonly CatalogPost[],
  votes: Readonly<Record<string, number>>,
  limit?: number,
): CatalogPost[] {
  const ranked = catalog.filter((post) => (votes[post.slug] ?? 0) >= 1);
  ranked.sort((a, b) => {
    const byVotes = (votes[b.slug] ?? 0) - (votes[a.slug] ?? 0);
    if (byVotes !== 0) return byVotes;
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.slug < b.slug) return -1;
    if (a.slug > b.slug) return 1;
    return 0;
  });
  return limit === undefined ? ranked : ranked.slice(0, limit);
}
