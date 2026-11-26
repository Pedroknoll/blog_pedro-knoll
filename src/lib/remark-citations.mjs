import { applyCitations } from "./citations.ts";

export function remarkCitations() {
  return (tree, file) => {
    applyCitations(tree, file.data.astro.frontmatter.citations, file.path);
  };
}
