export type MdastNode = {
  type: string;
  value?: string;
  children?: MdastNode[];
  alt?: string;
  attributes?: unknown;
};

const skipped = new Set([
  "code",
  "math",
  "inlineMath",
  "html",
  "yaml",
  "toml",
  "mdxjsEsm",
  "mdxFlowExpression",
  "mdxTextExpression",
]);

const word = /[\p{L}\p{N}]/u;

function wordsIn(value: string): number {
  let count = 0;
  for (const token of value.split(/\s+/)) {
    if (word.test(token)) count += 1;
  }
  return count;
}

export function countWords(tree: MdastNode): number {
  if (skipped.has(tree.type)) return 0;

  let count = 0;
  if (
    (tree.type === "text" || tree.type === "inlineCode") &&
    tree.value !== undefined
  ) {
    count += wordsIn(tree.value);
  }

  for (const child of tree.children ?? []) {
    count += countWords(child);
  }

  return count;
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}
