import { z } from "astro/zod";

export type CitationNode = {
  type: string;
  value?: string;
  url?: string;
  children?: CitationNode[];
  data?: {
    hProperties?: Record<string, string>;
  };
};

// Ordem dos grupos no fim do post (T-117).
export const CITATION_TYPES = [
  "model",
  "dataset",
  "paper",
  "article",
  "course",
  "video",
] as const;

export type CitationType = (typeof CITATION_TYPES)[number];

// `article` é "Textos" para não colidir com o tipo de post "Artigo".
export const CITATION_TYPE_LABELS: Record<CitationType, string> = {
  model: "Modelos",
  dataset: "Datasets",
  paper: "Papers",
  article: "Textos",
  course: "Cursos",
  video: "Vídeos",
};

export type Citation = {
  key: string;
  type: CitationType;
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
  label: string;
  title: string;
  paragraphs: string[];
};

export type CitationItem = {
  id: string;
  n: number;
  authors: string;
  year: number;
  title: string;
  url: string;
  venue: string;
};

export type CitationGroup = {
  type: CitationType;
  label: string;
  count: number;
  start: number;
  items: CitationItem[];
};

export type PostAppendixModel = {
  appendices: AppendixSection[];
  citations?: {
    id: "citacoes";
    text: "Citações";
    groups: CitationGroup[];
  };
};

export function duplicateCitationKeys(
  citations: readonly { key: string }[],
): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const citation of citations) {
    if (seen.has(citation.key)) {
      if (!duplicates.includes(citation.key)) duplicates.push(citation.key);
    } else {
      seen.add(citation.key);
    }
  }
  return duplicates;
}

// Tudo o que o post cita, direta ou indiretamente; o [@chave] no texto é
// opcional.
export const citationSchema = z.strictObject({
  key: z.string().regex(/^[a-z0-9-]+$/), // mesma regra de tags
  type: z.enum(CITATION_TYPES),
  authors: z.array(z.string().min(1)).min(1),
  title: z.string().min(1),
  year: z.int(),
  venue: z.string().min(1),
  url: z.url(),
});

export const citationsSchema = z
  .array(citationSchema)
  .refine((items) => duplicateCitationKeys(items).length === 0, {
    error: (iss) =>
      `Chave de citação repetida: ${Array.isArray(iss.input) ? duplicateCitationKeys(iss.input)[0] : ""}`,
  })
  .default([]);

function typeIndex(type: unknown): number {
  const index = CITATION_TYPES.indexOf(type as CitationType);
  return index === -1 ? CITATION_TYPES.length : index;
}

// Ordem estável: pelo grupo e, dentro dele, pela ordem do frontmatter. O
// plugin lê o frontmatter cru, antes do schema; um tipo desconhecido vai para o
// fim, e o schema reprova o build.
export function orderCitations<T extends { type?: unknown }>(
  citations: readonly T[],
): T[] {
  return citations
    .map((citation, index) => ({ citation, index }))
    .sort(
      (a, b) =>
        typeIndex(a.citation.type) - typeIndex(b.citation.type) ||
        a.index - b.index,
    )
    .map(({ citation }) => citation);
}

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

function numbersOf(citations: readonly { key: string; type?: unknown }[]) {
  const numbers = new Map<string, number>();
  orderCitations(citations).forEach((citation, index) => {
    if (!numbers.has(citation.key)) numbers.set(citation.key, index + 1);
  });
  return numbers;
}

function splitText(
  value: string,
  inLink: boolean,
  numbers: Map<string, number>,
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
    const n = numbers.get(key);
    if (n === undefined) {
      throw new Error(`Chave citada sem citação: @${key} em ${filePath}`);
    }
    if (start > cursor) {
      parts.push({ type: "text", value: value.slice(cursor, start) });
    }
    parts.push({
      type: "link",
      url: `#cit-${key}`,
      data: { hProperties: { "aria-label": `Citação ${n}` } },
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
  numbers: Map<string, number>,
  filePath: string,
) {
  if (skipped.has(node.type) || !node.children) return;
  const inside =
    inLink || node.type === "link" || node.type === "linkReference";
  const next: CitationNode[] = [];
  for (const child of node.children) {
    if (child.type === "text" && child.value !== undefined) {
      next.push(
        ...(splitText(child.value, inside, numbers, filePath) ?? [child]),
      );
      continue;
    }
    walk(child, inside, numbers, filePath);
    next.push(child);
  }
  node.children = next;
}

export function applyCitations(
  tree: CitationNode,
  citations: readonly { key: string; type?: unknown }[] | undefined,
  filePath: string,
): CitationNode {
  if (!hasMarker(tree)) return tree;
  walk(tree, false, numbersOf(citations ?? []), filePath);
  return tree;
}

export function formatAuthors(authors: readonly string[]): string {
  if (authors.length <= 1) return authors[0] ?? "";
  const head = authors.slice(0, -1).join(", ");
  return `${head} e ${authors.at(-1)}`;
}

export function postAppendix(
  citations?: readonly Citation[],
  appendices?: readonly Appendix[],
): PostAppendixModel | undefined {
  const list = citations ?? [];
  const notes = appendices ?? [];
  if (list.length === 0 && notes.length === 0) return undefined;

  const sections = notes.map((note, index) => {
    const letter = String.fromCharCode(65 + index);
    return {
      id: `apendice-${letter.toLowerCase()}`,
      label: `Apêndice ${letter}`,
      title: note.title,
      paragraphs: [...note.paragraphs],
    };
  });

  if (list.length === 0) return { appendices: sections };

  const groups: CitationGroup[] = [];
  orderCitations(list).forEach((citation, index) => {
    let group = groups.at(-1);
    if (group?.type !== citation.type) {
      group = {
        type: citation.type,
        label: CITATION_TYPE_LABELS[citation.type],
        count: 0,
        start: index + 1,
        items: [],
      };
      groups.push(group);
    }
    group.count += 1;
    group.items.push({
      id: `cit-${citation.key}`,
      n: index + 1,
      authors: formatAuthors(citation.authors),
      year: citation.year,
      title: citation.title,
      url: citation.url,
      venue: citation.venue,
    });
  });

  return {
    appendices: sections,
    citations: { id: "citacoes", text: "Citações", groups },
  };
}
