export type CodeTree = {
  type: string;
  lang?: string | null;
  children?: CodeTree[];
};

export function hasCodeBlock(tree: CodeTree): boolean {
  if (tree.type === "code" && tree.lang !== "math") return true;
  return (tree.children ?? []).some((child) => hasCodeBlock(child));
}
