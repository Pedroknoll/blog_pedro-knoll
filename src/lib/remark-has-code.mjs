import { hasCodeBlock } from "./has-code.ts";

export function remarkHasCode() {
  return (tree, file) => {
    file.data.astro.frontmatter.hasCode = hasCodeBlock(tree);
  };
}
