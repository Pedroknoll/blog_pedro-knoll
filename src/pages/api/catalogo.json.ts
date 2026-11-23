import type { APIRoute } from "astro";

import { getPublishedPosts } from "~/lib/getPublishedPosts";
import { catalogFromPosts } from "~/lib/votes-catalog";

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  return new Response(JSON.stringify(catalogFromPosts(posts)), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
};
