export function formatPubDate(date: Date): { text: string; datetime: string } {
  const text = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return {
    text,
    datetime: `${year}-${month}-${day}`,
  };
}
