const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 7;

// NOVO: publicado hoje ou nos 6 dias anteriores, pela data UTC (BRAND §9.2).
export function isNew(datetime: string, now: Date): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datetime);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }
  const published = Date.UTC(year, month - 1, day);
  const check = new Date(published);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return false;
  }
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const days = Math.round((today - published) / DAY);
  return days >= 0 && days < WINDOW_DAYS;
}
