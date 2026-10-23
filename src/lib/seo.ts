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

function unimplemented(...values: unknown[]): never {
  values.slice(0, 0);
  throw new Error("não implementado");
}

export function pageTitle(input: { page?: string }, site: SeoSite): string {
  return unimplemented(input, site);
}

export function absoluteUrl(
  path: string,
  site: string | URL | undefined,
): string {
  return unimplemented(path, site);
}

export function postPath(id: string): string {
  return unimplemented(id);
}

export function blogPostingJsonLd(input: BlogPostingInput): BlogPostingJsonLd {
  return unimplemented(input);
}

export function jsonLdScript(obj: unknown): string {
  return unimplemented(obj);
}

export function postToRssItem(post: RssPost): RssItem {
  return unimplemented(post);
}
