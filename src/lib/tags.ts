type Tagged = { id: string; data: { tags: string[] } };

function byName(left: string, right: string) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function collectTags<T extends Tagged>(posts: readonly T[]): string[] {
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      tags.add(tag);
    }
  }
  return [...tags].sort(byName);
}

export function postsWithTag<T extends Tagged>(
  posts: readonly T[],
  tag: string,
): T[] {
  return posts.filter((post) => post.data.tags.includes(tag));
}

export function tagPath(tag: string): string {
  return `/tags/${tag}/`;
}
