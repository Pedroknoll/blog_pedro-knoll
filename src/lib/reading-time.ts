export type MdastNode = {
  type: string;
  value?: string;
  children?: MdastNode[];
  alt?: string;
  attributes?: unknown;
};

export function countWords(tree: MdastNode): number {
  void tree;
  throw new Error("não implementado");
}

export function readingMinutes(words: number): number {
  void words;
  throw new Error("não implementado");
}
