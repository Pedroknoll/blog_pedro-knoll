export function shouldShowDrafts(value: string | undefined): boolean {
  return value === "true";
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
