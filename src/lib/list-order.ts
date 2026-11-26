// Ordenação das listas inteiras (T-133, RF-02, BRAND §9.2). O padrão é a
// ordem do HTML (mais recentes) e não vai para a URL; as outras ficam em
// `?ordem=`.

export type Order = "antigos" | "votados";

export const ORDERS: readonly { value: Order | ""; label: string }[] = [
  { value: "", label: "Mais recentes" },
  { value: "antigos", label: "Mais antigos" },
  { value: "votados", label: "Mais votados" },
];

export const ORDER_PARAM = "ordem";

export type OrderRow = {
  index: number;
  slug: string;
  date: string;
};

function params(search: string): URLSearchParams {
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}

export function orderFromSearch(
  search: string,
  available: readonly string[],
): Order | null {
  const value = params(search).get(ORDER_PARAM);
  if (!value || !available.includes(value)) return null;
  return value as Order;
}

export function withParam(
  search: string,
  key: string,
  value: string | null,
): string {
  const next = params(search);
  if (value === null) next.delete(key);
  else next.set(key, value);
  const text = next.toString();
  return text === "" ? "" : `?${text}`;
}

function bySlug(left: OrderRow, right: OrderRow): number {
  return left.slug < right.slug ? -1 : left.slug > right.slug ? 1 : 0;
}

function byNewest(left: OrderRow, right: OrderRow): number {
  if (left.date !== right.date) return left.date < right.date ? 1 : -1;
  return bySlug(left, right);
}

export function sortRows<T extends OrderRow>(
  rows: readonly T[],
  order: Order | null,
  votes: Readonly<Record<string, number>> = {},
): T[] {
  const sorted = [...rows];
  if (order === null) return sorted.sort((a, b) => a.index - b.index);
  if (order === "antigos") {
    return sorted.sort((a, b) =>
      a.date !== b.date ? (a.date < b.date ? -1 : 1) : bySlug(a, b),
    );
  }
  return sorted.sort((a, b) => {
    const diff = (votes[b.slug] ?? 0) - (votes[a.slug] ?? 0);
    return diff !== 0 ? diff : byNewest(a, b);
  });
}
