import { fileURLToPath } from "node:url";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { remarkHasCode } from "./src/lib/remark-has-code.mjs";
import { remarkReadingTime } from "./src/lib/remark-reading-time.mjs";
import { shikiCodeFrame } from "./src/lib/shiki-code-frame.mjs";
import pkClaro from "./src/styles/shiki/pk-claro.json";
import pkEscuro from "./src/styles/shiki/pk-escuro.json";

const remarkPlugins = [remarkMath, remarkReadingTime, remarkHasCode];
const rehypePlugins = [rehypeKatex];

export default defineConfig({
  site: process.env.SITE_URL ?? "https://blog.exemplo.com",
  output: "static",
  fonts: [
    {
      name: "Cormorant Garamond",
      cssVariable: "--font-cormorant",
      provider: fontProviders.fontsource(),
      weights: [600],
      styles: ["normal"],
      subsets: ["latin"],
      formats: ["woff2"],
      fallbacks: ["serif"],
    },
    {
      name: "Cormorant Garamond",
      cssVariable: "--font-cormorant",
      provider: fontProviders.fontsource(),
      weights: [500, 600],
      styles: ["italic"],
      subsets: ["latin"],
      formats: ["woff2"],
      fallbacks: ["serif"],
    },
    {
      name: "IBM Plex Sans",
      cssVariable: "--font-plex-sans",
      provider: fontProviders.fontsource(),
      weights: [400, 600],
      styles: ["normal"],
      subsets: ["latin"],
      formats: ["woff2"],
      fallbacks: ["sans-serif"],
    },
    {
      name: "IBM Plex Sans",
      cssVariable: "--font-plex-sans",
      provider: fontProviders.fontsource(),
      weights: [400],
      styles: ["italic"],
      subsets: ["latin"],
      formats: ["woff2"],
      fallbacks: ["sans-serif"],
    },
    {
      name: "IBM Plex Mono",
      cssVariable: "--font-plex-mono",
      provider: fontProviders.fontsource(),
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      formats: ["woff2"],
      fallbacks: ["monospace"],
    },
    {
      name: "Caveat",
      cssVariable: "--font-caveat",
      provider: fontProviders.fontsource(),
      weights: [500, 600],
      styles: ["normal"],
      subsets: ["latin"],
      formats: ["woff2"],
      fallbacks: ["cursive"],
    },
  ],
  markdown: {
    shikiConfig: {
      themes: { light: pkClaro, dark: pkEscuro },
      defaultColor: false,
      transformers: [shikiCodeFrame()],
    },
    processor: unified({ remarkPlugins, rehypePlugins }),
  },
  integrations: [
    mdx({
      processor: unified({ remarkPlugins, rehypePlugins }),
    }),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "~": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
