const titleToken = /(?:^| )title=(?:"([^"]*)"|'([^']*)'|([^ ]*))/;

export function codeTitle(meta: string | undefined): string | undefined {
  if (meta == null || meta === "") return undefined;
  const match = titleToken.exec(meta);
  if (!match) return undefined;
  const value = match[1] ?? match[2] ?? match[3] ?? "";
  if (value.trim() === "") return undefined;
  return value;
}
