export function shouldShowDrafts(value: string | undefined): boolean {
  throw new Error("não implementado");
}

export function selectPublished<
  T extends { id: string; data: { draft: boolean; pubDate: Date } },
>(entries: readonly T[], showDrafts: boolean): T[] {
  throw new Error("não implementado");
}
