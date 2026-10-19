import { fileURLToPath } from "node:url";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import { remarkReadingTime } from "./src/lib/remark-reading-time.mjs";

const remarkPlugins = [remarkReadingTime];

export default defineConfig({
  output: "static",
  markdown: {
    processor: unified({ remarkPlugins }),
  },
  integrations: [
    mdx({
      processor: unified({ remarkPlugins }),
    }),
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
