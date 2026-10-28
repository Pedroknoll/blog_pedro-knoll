export function findFolioConflicts(
  entries: { id: string; data: { folio: number } }[],
): { folio: number; ids: string[] }[] {
  const idsByFolio = new Map<number, string[]>();
  for (const entry of entries) {
    const ids = idsByFolio.get(entry.data.folio) ?? [];
    ids.push(entry.id);
    idsByFolio.set(entry.data.folio, ids);
  }

  return [...idsByFolio.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([folio, ids]) => ({ folio, ids: [...ids].sort() }))
    .sort((left, right) => left.folio - right.folio);
}

export function assertUniqueFolios(
  entries: { id: string; data: { folio: number } }[],
): void {
  const conflicts = findFolioConflicts(entries);
  if (conflicts.length === 0) return;
  throw new Error(
    conflicts
      .map(
        (conflict) =>
          `Fólio repetido: ${conflict.folio} em ${conflict.ids.join(", ")}`,
      )
      .join("; "),
  );
}
