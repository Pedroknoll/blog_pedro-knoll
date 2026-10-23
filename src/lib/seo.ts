export type SeoSite = {
  title: string;
  author: {
    name: string;
  };
};

export type BlogPostingJsonLd = {
  "@context": "https://schema.org";
  "@type": "BlogPosting";
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author: {
    "@type": "Person";
    name: string;
  };
  url: string;
  mainEntityOfPage: string;
  image?: string[];
  inLanguage: "pt-BR";
};

export type BlogPostingInput = {
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  authorName: string;
  canonical: string;
  image?: string;
};

export type RssPost = {
  id: string;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    tags: readonly string[];
  };
};

export type RssItem = {
  title: string;
  description: string;
  pubDate: Date;
  link: string;
  categories: readonly string[];
};

const separator = " · ";

export function pageTitle(input: { page?: string }, site: SeoSite): string {
  const suffix = `${site.title}${separator}${site.author.name}`;
  if (input.page === undefined) return suffix;
  return `${input.page}${separator}${suffix}`;
}

export function absoluteUrl(
  path: string,
  site: string | URL | undefined,
): string {
  if (!path.startsWith("/")) throw new Error("path sem / inicial");
  if (site === undefined) throw new Error("site indefinido");
  return new URL(path, site).href;
}

export function postPath(id: string): string {
  return `/blog/${id}/`;
}

export function blogPostingJsonLd(input: BlogPostingInput): BlogPostingJsonLd {
  const obj: BlogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    datePublished: input.pubDate.toISOString(),
    author: { "@type": "Person", name: input.authorName },
    url: input.canonical,
    mainEntityOfPage: input.canonical,
    inLanguage: "pt-BR",
  };
  if (input.updatedDate) obj.dateModified = input.updatedDate.toISOString();
  if (input.image) obj.image = [input.image];
  return obj;
}

export function jsonLdScript(obj: unknown): string {
  return JSON.stringify(obj).replaceAll("<", "\\u003c");
}

export function postToRssItem(post: RssPost): RssItem {
  return {
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    link: postPath(post.id),
    categories: post.data.tags,
  };
}
