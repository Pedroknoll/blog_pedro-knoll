import { getCollection } from "astro:content";

import { assertUniqueFolios } from "./folio";
import { selectPublished, shouldShowDrafts } from "./published";

export async function getPublishedPosts() {
  const posts = await getCollection("posts");
  assertUniqueFolios(posts);
  return selectPublished(posts, shouldShowDrafts(import.meta.env.SHOW_DRAFTS));
}
