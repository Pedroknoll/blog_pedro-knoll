import { applyCitations } from "./references.ts";

export function remarkCitations() {
  return (tree, file) => {
    applyCitations(tree, file.data.astro.frontmatter.references, file.path);
  };
}
