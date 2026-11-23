export function catalogFromPosts(posts: readonly { id: string }[]): {
  slugs: string[];
} {
  return { slugs: [...new Set(posts.map((post) => post.id))].sort() };
}
