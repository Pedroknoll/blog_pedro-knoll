import type { APIRoute, GetStaticPaths } from "astro";
import type { CollectionEntry } from "astro:content";
import {
  type CssVariable,
  experimental_getFontFileURL,
  fontData,
} from "astro:assets";

import { getPublishedPosts } from "~/lib/getPublishedPosts";
import { needsGeneratedOg } from "~/lib/og";
import { renderOgImage, type OgFonts } from "~/lib/og-image";

// Ficha OG do post sem capa (RF-16, T-23). Com capa, a rota não existe.
export const getStaticPaths = (async () => {
  const posts = await getPublishedPosts();
  return posts
    .filter((post) => needsGeneratedOg(post.data))
    .map((post) => ({ params: { slug: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

// As TTF só da OG (astro.config.mjs): o sharp não lê o woff2 das páginas.
async function fontFile(cssVariable: CssVariable, requestUrl: URL) {
  const url = fontData[cssVariable]?.[0]?.src[0]?.url;
  if (!url) throw new Error(`Imagem OG: ${cssVariable} sem arquivo`);
  const response = await fetch(experimental_getFontFileURL(url, requestUrl));
  if (!response.ok) {
    throw new Error(`Imagem OG: ${url} respondeu ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

let fonts: Promise<OgFonts> | undefined;

export const GET: APIRoute = async ({ props, url, site }) => {
  const { post } = props as { post: CollectionEntry<"posts"> };
  if (site === undefined) throw new Error("Imagem OG: site indefinido");
  fonts ??= Promise.all([
    fontFile("--font-og-display", url),
    fontFile("--font-og-mono", url),
  ]).then(([display, mono]) => ({ display, mono }));
  const png = await renderOgImage(
    { title: post.data.title, kind: post.data.kind, domain: site.host },
    await fonts,
  );
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
