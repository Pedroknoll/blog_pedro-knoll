import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { postIdFromEntry } from "./lib/post-id";

// Iframe: notebook inteiro num .py da pasta do post, exportado com html-wasm.
const notebook = z.strictObject({
  mode: z.literal("iframe"),
  src: z.string(),
  // estratégia de execução, ver seção 7
  compute: z
    .enum(["browser", "cache", "precomputed", "onnx", "static"])
    .default("browser"),
  gpuUrl: z.url().optional(), // botão "Rodar com GPU" (molab, Colab, HF Space)
});

const posts = defineCollection({
  loader: glob({
    pattern: "**/index.{md,mdx}",
    base: "./src/content/posts",
    // id = nome da pasta, validado por postIdFromEntry; é o slug de /blog/[slug]
    generateId: ({ entry }) => postIdFromEntry(entry),
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(90),
        description: z.string().min(50).max(160),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        tags: z
          .array(z.string().regex(/^[a-z0-9-]+$/))
          .max(6)
          .default([]),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
        // declara os iframes do post
        notebooks: z.array(notebook).default([]),
        canonical: z.url().optional(),
      })
      .refine((data) => !data.cover || data.coverAlt, {
        error: "coverAlt é obrigatório quando há cover",
        path: ["coverAlt"],
      }),
});

export const collections = { posts };
