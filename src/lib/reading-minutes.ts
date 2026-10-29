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
