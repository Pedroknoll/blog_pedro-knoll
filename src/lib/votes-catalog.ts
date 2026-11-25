import { formatPubDate } from "./format-date";
import { selectPublished } from "./published";

export function catalogFromPosts(posts: readonly { id: string }[]): {
  slugs: string[];
} {
  return { slugs: [...new Set(posts.map((post) => post.id))].sort() };
}

type CatalogSource = {
  id: string;
  minutes: number;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    kind: string;
    tags: readonly string[];
    draft: boolean;
  };
};

export function listCatalog(
  posts: readonly CatalogSource[],
  showDrafts: boolean,
): string {
  const entries = selectPublished(posts, showDrafts).map((post) => ({
    slug: post.id,
    title: post.data.title,
    description: post.data.description,
    date: formatPubDate(post.data.pubDate).datetime,
    kind: post.data.kind,
    minutes: post.minutes,
    tags: [...post.data.tags],
  }));
  return JSON.stringify(entries).replaceAll("<", "\\u003c");
}
