import { countWords, readingMinutes } from "./reading-time.ts";

export function remarkReadingTime() {
  return (tree, file) => {
    file.data.astro.frontmatter.minutesRead = readingMinutes(countWords(tree));
  };
}
