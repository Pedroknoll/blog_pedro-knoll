export type CodeTree = {
  type: string;
  lang?: string | null;
  children?: CodeTree[];
};

export function hasCodeBlock(tree: CodeTree): boolean {
  void tree;
  throw new Error("não implementado");
}
