export const LEVEL_LABELS: Record<number, string> = {
  1: "Iniciante",
  2: "Intermediário",
  3: "Avançado",
};

export function levelHatch(level: number): { marked: string; rest: string } {
  return {
    marked: "\\".repeat(level),
    rest: "\\".repeat(3 - level),
  };
}
