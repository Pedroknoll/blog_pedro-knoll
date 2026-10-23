import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import { getPublishedPosts } from "~/lib/getPublishedPosts";
import { absoluteUrl, postToRssItem } from "~/lib/seo";
import { site } from "~/site.config";

export async function GET(context: APIContext) {
  if (context.site === undefined) throw new Error("site indefinido");

  const posts = await getPublishedPosts();
  const self = absoluteUrl("/rss.xml", context.site);

  return rss({
    title: site.title,
    description: site.author.bio,
    site: context.site,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: `<language>pt-br</language><atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
    items: posts.map((post) => {
      const item = postToRssItem(post);
      return { ...item, categories: [...item.categories] };
    }),
  });
}
