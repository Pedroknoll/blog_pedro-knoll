import { render, type CollectionEntry } from "astro:content";

export async function minutesReadOf(
  entry: CollectionEntry<"posts">,
): Promise<number> {
  const { remarkPluginFrontmatter } = await render(entry);
  const { minutesRead } = remarkPluginFrontmatter;
  if (typeof minutesRead !== "number") {
    throw new Error(`minutesRead ausente em ${entry.id}`);
  }
  return minutesRead;
}

// O item das listas inteiras (BRAND §9.2), usado pelo `PostList` e pelos
// posts relacionados (T-26).
export async function listItemOf(entry: CollectionEntry<"posts">) {
  return {
    slug: entry.id,
    title: entry.data.title,
    date: entry.data.pubDate,
    minutes: await minutesReadOf(entry),
    tags: entry.data.tags,
    description: entry.data.description,
    cover: entry.data.cover,
  };
}
