export type ReadingEntry =
  { slug: string } | { href: string; title: string; source?: string };

export type ReadingPost = {
  id: string;
  data: {
    title: string;
    pubDate: Date;
  };
};

export type ResolvedReading =
  | {
      kind: "post";
      slug: string;
      title: string;
      date: Date;
    }
  | {
      kind: "external";
      href: string;
      title: string;
      source: string;
    };

function isExternal(
  entry: ReadingEntry,
): entry is { href: string; title: string; source?: string } {
  return "href" in entry;
}

function httpsUrl(href: string): URL {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    throw new Error(`Leitura externa precisa de https: ${href}`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`Leitura externa precisa de https: ${href}`);
  }
  return url;
}

export function resolveReadingList(
  entries: readonly ReadingEntry[],
  posts: readonly ReadingPost[],
): ResolvedReading[] {
  const byId = new Map(posts.map((post) => [post.id, post]));
  const resolved: ResolvedReading[] = [];

  for (const entry of entries) {
    if (isExternal(entry)) {
      const url = httpsUrl(entry.href);
      resolved.push({
        kind: "external",
        href: entry.href,
        title: entry.title,
        source: entry.source ?? url.hostname.replace(/^www\./, ""),
      });
      continue;
    }

    const post = byId.get(entry.slug);
    if (!post) continue;
    resolved.push({
      kind: "post",
      slug: post.id,
      title: post.data.title,
      date: post.data.pubDate,
    });
  }

  return resolved;
}
