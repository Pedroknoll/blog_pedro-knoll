import fs from "node:fs";
import path from "node:path";

export type DiskPost = {
  slug: string;
  kind: "article" | "prototype";
  date: string;
  tags: string[];
};

function readTags(frontmatter: string, slug: string): string[] {
  const line = /^tags:\s*\[([^\]]*)\]\s*$/m.exec(frontmatter)?.[1];
  if (line === undefined) throw new Error(`${slug}: tags ausente`);
  if (line.trim() === "") return [];
  return line
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function diskPosts(): DiskPost[] {
  const root = path.resolve("src/content/posts");
  const posts: DiskPost[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = ["index.md", "index.mdx"]
      .map((name) => path.join(root, entry.name, name))
      .find((candidate) => fs.existsSync(candidate));
    if (!file) continue;
    const frontmatter = /^---\n([\s\S]*?\n)---/.exec(
      fs.readFileSync(file, "utf8"),
    )?.[1];
    if (!frontmatter) throw new Error(`${entry.name}: sem frontmatter`);
    if (/^draft:\s*true\s*$/m.test(frontmatter)) continue;
    const kind = /^kind:\s*(article|prototype)\s*$/m.exec(frontmatter)?.[1];
    const date = /^pubDate:\s*(\d{4}-\d{2}-\d{2})\s*$/m.exec(frontmatter)?.[1];
    if (kind !== "article" && kind !== "prototype") {
      throw new Error(`${entry.name}: kind ausente`);
    }
    if (!date) throw new Error(`${entry.name}: pubDate ausente`);
    posts.push({
      slug: entry.name,
      kind,
      date,
      tags: readTags(frontmatter, entry.name),
    });
  }
  return posts.sort((left, right) => {
    if (left.date !== right.date) return left.date < right.date ? 1 : -1;
    if (left.slug < right.slug) return -1;
    if (left.slug > right.slug) return 1;
    return 0;
  });
}

export function tagsOf(posts: readonly DiskPost[]): string[] {
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) tags.add(tag);
  }
  return [...tags].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}
