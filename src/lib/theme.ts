/**
 * Tema do site (RF-17, T-24). O script inline do `BaseLayout.astro` repete
 * `resolveTheme` em JavaScript puro, porque roda antes de qualquer módulo.
 */
export type Theme = "light" | "dark";

export const THEME_KEY = "pk-theme";

export const DARK_QUERY = "(prefers-color-scheme: dark)";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** A escolha gravada vence; sem ela (ou com valor inválido), vale o sistema. */
export function resolveTheme(
  stored: string | null,
  prefersDark: boolean,
): Theme {
  if (isTheme(stored)) return stored;
  return prefersDark ? "dark" : "light";
}
