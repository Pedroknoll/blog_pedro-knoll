import type { CollectionEntry } from "astro:content";

import { minutesReadOf } from "./reading-minutes";
import { shouldShowDrafts } from "./published";
import { listCatalog } from "./votes-catalog";

export async function pageCatalog(
  posts: readonly CollectionEntry<"posts">[],
): Promise<string> {
  const enriched = await Promise.all(
    posts.map(async (post) => ({
      id: post.id,
      minutes: await minutesReadOf(post),
      data: post.data,
    })),
  );
  return listCatalog(enriched, shouldShowDrafts(import.meta.env.SHOW_DRAFTS));
}
