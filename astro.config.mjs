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

// O subset latin do Fontsource, o unicode-range que a API dava (T-95).
const LATIN = [
  "U+0000-00FF",
  "U+0131",
  "U+0152-0153",
  "U+02BB-02BC",
  "U+02C6",
  "U+02DA",
  "U+02DC",
  "U+0304",
  "U+0308",
  "U+0329",
  "U+2000-206F",
  "U+20AC",
  "U+2122",
  "U+2191",
  "U+2193",
  "U+2212",
  "U+2215",
  "U+FEFF",
  "U+FFFD",
];

function face(weight, style, file) {
  return {
    weight,
    style,
    src: [`./src/assets/fonts/${file}`],
    unicodeRange: LATIN,
  };
}

export default defineConfig({
  site: process.env.SITE_URL ?? "https://blog.exemplo.com",
  output: "static",
  // Arquivos locais (T-95): o Astro nomeia a fonte local pelo hash do
  // conteúdo, e a fonte remota pelo hash da URL. Os bytes são os do
  // Fontsource 5.3.0 (OFL, src/assets/fonts/OFL.txt). Trocar o arquivo muda
  // o nome, e /_astro/fonts/ pode ter cache longo.
  fonts: [
    {
      name: "IBM Plex Sans Condensed",
      cssVariable: "--font-plex-condensed",
      provider: fontProviders.local(),
      options: {
        variants: [
          face(600, "normal", "ibm-plex-sans-condensed-latin-600-normal.woff2"),
        ],
      },
      fallbacks: ["Metric Sans", "sans-serif"],
    },
    {
      name: "IBM Plex Sans",
      cssVariable: "--font-plex-sans",
      provider: fontProviders.local(),
      options: {
        variants: [
          face(400, "normal", "ibm-plex-sans-latin-400-normal.woff2"),
          face(600, "normal", "ibm-plex-sans-latin-600-normal.woff2"),
          face(400, "italic", "ibm-plex-sans-latin-400-italic.woff2"),
        ],
      },
      fallbacks: ["Metric Plex Sans", "sans-serif"],
      optimizedFallbacks: false,
    },
    {
      name: "IBM Plex Mono",
      cssVariable: "--font-plex-mono",
      provider: fontProviders.local(),
      options: {
        variants: [face(400, "normal", "ibm-plex-mono-latin-400-normal.woff2")],
      },
      fallbacks: ["Metric Mono", "monospace"],
    },
    // Só a imagem OG (T-23): o sharp não lê woff2, só TTF. Nenhuma página
    // renderiza <Font> destas variáveis, e o leitor não baixa os TTF.
    {
      name: "IBM Plex Sans Condensed",
      cssVariable: "--font-og-display",
      provider: fontProviders.local(),
      options: {
        variants: [
          face(600, "normal", "ibm-plex-sans-condensed-latin-600-normal.ttf"),
        ],
      },
      fallbacks: ["sans-serif"],
      optimizedFallbacks: false,
    },
    {
      name: "IBM Plex Mono",
      cssVariable: "--font-og-mono",
      provider: fontProviders.local(),
      options: {
        variants: [face(400, "normal", "ibm-plex-mono-latin-400-normal.ttf")],
      },
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
