import { fileURLToPath } from "node:url";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { headersIntegration } from "./src/integrations/headers.ts";
import { pagefindIntegration } from "./src/integrations/pagefind.ts";
import { remarkCitations } from "./src/lib/remark-citations.mjs";
import { remarkHasCode } from "./src/lib/remark-has-code.mjs";
import { remarkNotebook } from "./src/lib/remark-notebook.mjs";
import { remarkReadingTime } from "./src/lib/remark-reading-time.mjs";
import { shikiCodeFrame } from "./src/lib/shiki-code-frame.mjs";
import pkClaro from "./src/styles/shiki/pk-claro.json";
import pkEscuro from "./src/styles/shiki/pk-escuro.json";

const remarkPlugins = [
  remarkMath,
  remarkCitations,
  remarkReadingTime,
  remarkHasCode,
  remarkNotebook,
];
const rehypePlugins = [rehypeKatex];

export default defineConfig({
  site: process.env.SITE_URL ?? "https://blog.exemplo.com",
  output: "static",
  fonts: [
    {
      name: "IBM Plex Sans Condensed",
      cssVariable: "--font-plex-condensed",
      provider: fontProviders.fontsource(),
      weights: [600],
      styles: ["normal"],
      subsets: ["latin"],
      formats: ["woff2"],
      fallbacks: ["Metric Sans", "sans-serif"],
    },
    {
      name: "IBM Plex Sans",
      cssVariable: "--font-plex-sans",
      provider: fontProviders.fontsource(),
      weights: [400, 600],
      styles: ["normal"],
      subsets: ["latin"],
      formats: ["woff2"],
      fallbacks: ["Metric Plex Sans", "sans-serif"],
      optimizedFallbacks: false,
    },
    {
      name: "IBM Plex Sans",
      cssVariable: "--font-plex-sans",
      provider: fontProviders.fontsource(),
      weights: [400],
      styles: ["italic"],
      subsets: ["latin"],
      formats: ["woff2"],
      fallbacks: ["Metric Plex Sans", "sans-serif"],
      optimizedFallbacks: false,
    },
    {
      name: "IBM Plex Mono",
      cssVariable: "--font-plex-mono",
      provider: fontProviders.fontsource(),
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      formats: ["woff2"],
      fallbacks: ["Metric Mono", "monospace"],
    },
    // Só a imagem OG (T-23): o sharp não lê woff2, só TTF. Nenhuma página
    // renderiza <Font> destas variáveis, e o leitor não baixa os TTF.
    {
      name: "IBM Plex Sans Condensed",
      cssVariable: "--font-og-display",
      provider: fontProviders.fontsource(),
      weights: [600],
      styles: ["normal"],
      subsets: ["latin"],
      formats: ["ttf"],
      fallbacks: ["sans-serif"],
      optimizedFallbacks: false,
    },
    {
      name: "IBM Plex Mono",
      cssVariable: "--font-og-mono",
      provider: fontProviders.fontsource(),
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      formats: ["ttf"],
      fallbacks: ["monospace"],
      optimizedFallbacks: false,
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
    svelte(),
    headersIntegration(),
    pagefindIntegration(),
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
