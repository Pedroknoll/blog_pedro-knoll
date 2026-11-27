// O que o job `lighthouse` mede, pelos arquivos que o diff toca (T-86).
// Só pastas de post publicado: a home e esses posts. Qualquer outra coisa,
// inclusive diff vazio e fixture: tudo. Na dúvida, mede tudo.

export type LighthouseScope = {
  mode: "full" | "posts";
  posts: string[];
};

const postsDir = "src/content/posts/";
const full: LighthouseScope = { mode: "full", posts: [] };

function postSlug(file: string) {
  if (!file.startsWith(postsDir)) return undefined;
  const [slug, ...rest] = file.slice(postsDir.length).split("/");
  if (!slug || rest.length === 0 || slug.startsWith("fixture-")) {
    return undefined;
  }
  return slug;
}

export function lighthouseScope(changedFiles: string[]): LighthouseScope {
  const files = changedFiles.map((file) => file.trim()).filter(Boolean);
  if (files.length === 0) return full;

  const slugs = new Set<string>();
  for (const file of files) {
    const slug = postSlug(file);
    if (slug === undefined) return full;
    slugs.add(slug);
  }
  return { mode: "posts", posts: [...slugs].sort() };
}
