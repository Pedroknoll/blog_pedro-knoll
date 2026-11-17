import { fileURLToPath } from "node:url";
import { notebookRepoPath } from "./notebook.ts";

const root = fileURLToPath(new URL("../..", import.meta.url));

function visit(node, fn) {
  fn(node);
  for (const child of node.children ?? []) visit(child, fn);
}

export function remarkNotebook() {
  return (tree, file) => {
    visit(tree, (node) => {
      if (
        (node.type !== "mdxJsxFlowElement" &&
          node.type !== "mdxJsxTextElement") ||
        node.name !== "Notebook"
      )
        return;
      const attr = node.attributes.find(
        (a) => a.type === "mdxJsxAttribute" && a.name === "src",
      );
      const path = notebookRepoPath(file.path, attr?.value, root);
      attr.value = path;
    });
  };
}
