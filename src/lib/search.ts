const wordPattern = /([\p{L}\p{N}]+)/u;
const applePlatform = /Mac|iPhone|iPad|iPod/;
const editableTags = new Set(["INPUT", "TEXTAREA", "SELECT"]);

type ShortcutTarget = {
  tagName?: string;
  isContentEditable?: boolean;
};

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function highlightTitle(title: string, term: string): string {
  const queries = term
    .trim()
    .split(/\s+/)
    .map(fold)
    .filter((word) => [...word].length >= 3);
  return title
    .split(wordPattern)
    .map((part) => {
      const safe = escapeHtml(part);
      const folded = fold(part);
      if ([...folded].length < 3) return safe;
      const hit = queries.some(
        (query) => folded.startsWith(query) || query.startsWith(folded),
      );
      return hit ? `<mark>${safe}</mark>` : safe;
    })
    .join("");
}

export function shortcutLabel(platform: string): string {
  return applePlatform.test(platform) ? "⌘K" : "Ctrl K";
}

function isEditable(target: EventTarget | ShortcutTarget | null): boolean {
  if (!target || typeof target !== "object") return false;
  const node = target as ShortcutTarget;
  const tag = node.tagName?.toUpperCase();
  if (tag && editableTags.has(tag)) return true;
  return node.isContentEditable === true;
}

export function isSearchShortcut(event: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  target: EventTarget | ShortcutTarget | null;
}): boolean {
  if (event.altKey || event.shiftKey) return false;
  if (event.key !== "k" && event.key !== "K") return false;
  if (event.metaKey === event.ctrlKey) return false;
  return !isEditable(event.target);
}
