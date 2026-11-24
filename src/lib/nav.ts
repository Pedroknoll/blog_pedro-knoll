import { kindCounts, kindPath, type Kind } from "./kind";

const HEADER_LABELS: Record<Kind, string> = {
  article: "Artigos",
  prototype: "Protótipos",
};

type WithKind = { data: { kind: Kind } };

export function headerLinks<T extends WithKind>(
  posts: readonly T[],
): { href: string; label: string }[] {
  return kindCounts(posts).map(({ kind }) => ({
    href: kindPath(kind),
    label: HEADER_LABELS[kind],
  }));
}

function withTrailingSlash(path: string): string {
  return path.endsWith("/") ? path : `${path}/`;
}

export function isCurrentPath(pathname: string, href: string): boolean {
  return withTrailingSlash(pathname) === withTrailingSlash(href);
}
