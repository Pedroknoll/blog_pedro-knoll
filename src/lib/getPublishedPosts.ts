import { getCollection } from "astro:content";

import { selectPublished, shouldShowDrafts } from "./published";

export async function getPublishedPosts() {
  const posts = await getCollection("posts");
  return selectPublished(posts, shouldShowDrafts(import.meta.env.SHOW_DRAFTS));
}
