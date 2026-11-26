import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { KINDS } from "./lib/kind";
import { postIdFromEntry } from "./lib/post-id";
import { postsGlobPattern, shouldShowFixtures } from "./lib/published";
import { citationsSchema } from "./lib/citations";

const appendix = z.strictObject({
  title: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
});

const posts = defineCollection({
  loader: glob({
    pattern: postsGlobPattern(
      shouldShowFixtures(import.meta.env.SHOW_FIXTURES),
    ),
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
        kind: z.enum(KINDS),
        tags: z
          .array(z.string().regex(/^[a-z0-9-]+$/))
          .max(6)
          .default([]),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        draft: z.boolean().default(false),
        citations: citationsSchema,
        appendices: z.array(appendix).max(26).default([]),
        canonical: z.url().optional(),
      })
      .refine((data) => !data.cover || data.coverAlt, {
        error: "coverAlt é obrigatório quando há cover",
        path: ["coverAlt"],
      }),
});

export const collections = { posts };
