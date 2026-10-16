export function splitFeatured<T extends { data: { featured: boolean } }>(
  posts: readonly T[],
): { featured: T | null; rest: T[] } {
  const index = posts.findIndex((post) => post.data.featured);
  if (index === -1) {
    return { featured: null, rest: [...posts] };
  }

  return {
    featured: posts[index] ?? null,
    rest: posts.filter((_, itemIndex) => itemIndex !== index),
  };
}
