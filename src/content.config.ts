import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { KINDS } from "./lib/kind";
import { postIdFromEntry } from "./lib/post-id";
import { duplicateReferenceKeys } from "./lib/references";

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

const reference = z.strictObject({
  key: z.string().regex(/^[a-z0-9-]+$/),
  authors: z.array(z.string().min(1)).min(1),
  title: z.string().min(1),
  year: z.int(),
  venue: z.string().min(1),
  url: z.url(),
});

const appendix = z.strictObject({
  title: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
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
        folio: z.int().min(1), // exibido como "Fól. 006"
        kind: z.enum(KINDS),
        level: z.int().min(1).max(3),
        tags: z
          .array(z.string().regex(/^[a-z0-9-]+$/))
          .max(6)
          .default([]),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
        references: z
          .array(reference)
          .refine((items) => duplicateReferenceKeys(items).length === 0, {
            error: (iss) =>
              `Chave de referência repetida: ${Array.isArray(iss.input) ? duplicateReferenceKeys(iss.input)[0] : ""}`,
          })
          .default([]),
        appendices: z.array(appendix).max(26).default([]),
        // declara os iframes do post
        notebooks: z.array(notebook).default([]),
        canonical: z.url().optional(),
      })
      .refine((data) => !data.cover || data.coverAlt, {
        error: "coverAlt é obrigatório quando há cover",
        path: ["coverAlt"],
      })
      .refine((data) => data.kind !== "lab" || data.notebooks.length > 0, {
        error: "kind lab exige ao menos um item em notebooks",
        path: ["notebooks"],
      }),
});

export const collections = { posts };
