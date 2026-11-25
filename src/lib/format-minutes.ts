export function formatMinutes(minutes: number): string {
  return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
}
