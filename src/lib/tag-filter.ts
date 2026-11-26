import { withParam } from "./list-order";

export type Noun = { one: string; many: string };

export function selectedTag(
  search: string,
  allowed: readonly string[],
): string | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const value = new URLSearchParams(query).get("tag");
  if (!value || !allowed.includes(value)) return null;
  return value;
}

export function countLabel(shown: number, total: number, noun: Noun): string {
  const word = total === 1 ? noun.one : noun.many;
  if (shown === total) return `${total} ${word}`;
  return `${shown} de ${total} ${word}`;
}

// Grava a tag em `?tag=` e mantém os outros parâmetros, como `?ordem=`
// (T-133).
export function searchWith(tag: string | null, current = ""): string {
  return withParam(current, "tag", tag);
}

export function allLinkName(total: number, noun: Noun): string {
  if (total === 1) return `O único ${noun.one}`;
  return `Todos os ${total} ${noun.many}`;
}

export function tagsOf(
  posts: readonly { tags: readonly string[] }[],
): string[] {
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) tags.add(tag);
  }
  return [...tags].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}
