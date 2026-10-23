import { fileURLToPath } from "node:url";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { remarkHasCode } from "./src/lib/remark-has-code.mjs";
import { remarkReadingTime } from "./src/lib/remark-reading-time.mjs";

const remarkPlugins = [remarkMath, remarkReadingTime, remarkHasCode];
const rehypePlugins = [rehypeKatex];

export default defineConfig({
  site: process.env.SITE_URL ?? "https://blog.exemplo.com",
  output: "static",
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
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
