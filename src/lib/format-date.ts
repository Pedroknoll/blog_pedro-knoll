const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

export function formatPubDate(date: Date): { text: string; datetime: string } {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const dayText = String(date.getUTCDate()).padStart(2, "0");
  const monthName = MONTHS[date.getUTCMonth()];

  return {
    text: `${dayText}.${monthName}.${year}`,
    datetime: `${year}-${month}-${day}`,
  };
}

// Nas listas inteiras o ano fica no rótulo do grupo: `21 out` (T-131, Q24).
export function formatShortDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${day} ${MONTHS[date.getUTCMonth()]}`;
}
