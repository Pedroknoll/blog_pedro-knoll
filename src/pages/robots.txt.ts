import type { APIRoute } from "astro";

import { absoluteUrl } from "~/lib/seo";

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = absoluteUrl("/sitemap-index.xml", site);
  return new Response(`User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`);
};
