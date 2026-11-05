export type CitationNode = {
  type: string;
  value?: string;
  url?: string;
  children?: CitationNode[];
  data?: {
    hProperties?: Record<string, string>;
  };
};

export type Reference = {
  key: string;
  authors: readonly string[];
  title: string;
  year: number;
  venue: string;
  url: string;
};

export type Appendix = {
  title: string;
  paragraphs: readonly string[];
};

export type AppendixSection = {
  id: string;
  text: string;
  paragraphs: string[];
};

export type ReferenceItem = {
  id: string;
  authors: string;
  year: number;
  title: string;
  url: string;
  venue: string;
};

export type PostAppendixModel = {
  appendices: AppendixSection[];
  references?: {
    id: "referencias";
    text: "Referências";
    items: ReferenceItem[];
  };
};

const skipped = new Set([
  "code",
  "inlineCode",
  "math",
  "inlineMath",
  "html",
  "mdxjsEsm",
  "mdxFlowExpression",
  "mdxTextExpression",
]);

const marker = /\[@([^\]\s]+)\]/;

function hasMarker(node: CitationNode): boolean {
  if (skipped.has(node.type)) return false;
  if (
    node.type === "text" &&
    node.value !== undefined &&
    marker.test(node.value)
  ) {
    return true;
  }
  return (node.children ?? []).some(hasMarker);
}

function indexesOf(references: readonly { key: string }[]) {
  const indexes = new Map<string, number>();
  references.forEach((reference, index) => {
    if (!indexes.has(reference.key)) indexes.set(reference.key, index);
  });
  return indexes;
}

function splitText(
  value: string,
  inLink: boolean,
  indexes: Map<string, number>,
  cited: Set<string>,
  filePath: string,
): CitationNode[] | undefined {
  const matches = [...value.matchAll(/\[@([^\]\s]+)\]/g)];
  if (matches.length === 0) return undefined;

  const parts: CitationNode[] = [];
  let cursor = 0;
  for (const match of matches) {
    const key = match[1];
    const start = match.index;
    if (key === undefined || start === undefined) continue;
    if (inLink) {
      throw new Error(`Citação dentro de link: @${key} em ${filePath}`);
    }
    const index = indexes.get(key);
    if (index === undefined) {
      throw new Error(`Citação sem referência: @${key} em ${filePath}`);
    }
    cited.add(key);
    if (start > cursor) {
      parts.push({ type: "text", value: value.slice(cursor, start) });
    }
    const n = index + 1;
    parts.push({
      type: "link",
      url: `#ref-${key}`,
      data: { hProperties: { "aria-label": `Referência ${n}` } },
      children: [{ type: "text", value: `[${n}]` }],
    });
    cursor = start + match[0].length;
  }
  if (cursor < value.length) {
    parts.push({ type: "text", value: value.slice(cursor) });
  }
  return parts;
}

function walk(
  node: CitationNode,
  inLink: boolean,
  indexes: Map<string, number>,
  cited: Set<string>,
  filePath: string,
) {
  if (skipped.has(node.type) || !node.children) return;
  const inside =
    inLink || node.type === "link" || node.type === "linkReference";
  const next: CitationNode[] = [];
  for (const child of node.children) {
    if (child.type === "text" && child.value !== undefined) {
      next.push(
        ...(splitText(child.value, inside, indexes, cited, filePath) ?? [
          child,
        ]),
      );
      continue;
    }
    walk(child, inside, indexes, cited, filePath);
    next.push(child);
  }
  node.children = next;
}

export function applyCitations(
  tree: CitationNode,
  references: readonly { key: string }[] | undefined,
  filePath: string,
): CitationNode {
  const list = references ?? [];
  if (list.length === 0 && !hasMarker(tree)) return tree;

  const cited = new Set<string>();
  walk(tree, false, indexesOf(list), cited, filePath);
  for (const reference of list) {
    if (!cited.has(reference.key)) {
      throw new Error(`Referência não citada: ${reference.key} em ${filePath}`);
    }
  }
  return tree;
}

export function formatAuthors(authors: readonly string[]): string {
  if (authors.length <= 1) return authors[0] ?? "";
  const head = authors.slice(0, -1).join(", ");
  return `${head} e ${authors.at(-1)}`;
}

export function postAppendix(
  references?: readonly Reference[],
  appendices?: readonly Appendix[],
): PostAppendixModel | undefined {
  const refs = references ?? [];
  const notes = appendices ?? [];
  if (refs.length === 0 && notes.length === 0) return undefined;

  const sections = notes.map((note, index) => {
    const letter = String.fromCharCode(65 + index);
    return {
      id: `apendice-${letter.toLowerCase()}`,
      text: `Apêndice ${letter} · ${note.title}`,
      paragraphs: [...note.paragraphs],
    };
  });

  if (refs.length === 0) return { appendices: sections };

  const items = refs.map((reference) => ({
    id: `ref-${reference.key}`,
    authors: formatAuthors(reference.authors),
    year: reference.year,
    title: reference.title,
    url: reference.url,
    venue: reference.venue,
  }));
  return {
    appendices: sections,
    references: { id: "referencias", text: "Referências", items },
  };
}

export function duplicateReferenceKeys(
  references: readonly { key: string }[],
): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const reference of references) {
    if (seen.has(reference.key)) {
      if (!duplicates.includes(reference.key)) duplicates.push(reference.key);
    } else {
      seen.add(reference.key);
    }
  }
  return duplicates;
}
