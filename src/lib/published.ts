export function shouldShowDrafts(value: string | undefined): boolean {
  return value === "true";
}

export function shouldShowFixtures(value: string | undefined): boolean {
  return value === "true";
}

const INDEX_GLOB = "**/index.{md,mdx}";

export function postsGlobPattern(
  showFixtures: boolean,
): string | [string, string] {
  if (showFixtures) return INDEX_GLOB;
  return [INDEX_GLOB, "!fixture-*/**"];
}

const FIXTURE_HREF = "/blog/fixture-";

function isFixtureDirectory(directory: string): boolean {
  const slash = directory.indexOf("/");
  if (slash === -1 || directory.includes("/", slash + 1)) return false;
  return (
    directory.slice(0, slash) === "blog" &&
    directory.slice(slash + 1).startsWith("fixture-")
  );
}

export function distLeaksFixtures(
  directories: readonly string[],
  texts: readonly string[],
): boolean {
  return (
    directories.some(isFixtureDirectory) ||
    texts.some((text) => text.includes(FIXTURE_HREF))
  );
}

export function selectPublished<
  T extends { id: string; data: { draft: boolean; pubDate: Date } },
>(entries: readonly T[], showDrafts: boolean): T[] {
  const visible = showDrafts
    ? [...entries]
    : entries.filter((entry) => !entry.data.draft);

  return visible.sort((a, b) => {
    const byDate = b.data.pubDate.getTime() - a.data.pubDate.getTime();
    if (byDate !== 0) {
      return byDate;
    }
    if (a.id < b.id) {
      return -1;
    }
    if (a.id > b.id) {
      return 1;
    }
    return 0;
  });
}
