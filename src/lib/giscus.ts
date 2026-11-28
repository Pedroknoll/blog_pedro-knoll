// Comentários pelo Giscus (RF-19, T-28). É a parte do client.js do
// giscus (MIT, github.com/giscus/giscus) que o site usa, reescrita para não
// carregar script de outra origem: a CSP só admite giscus.app no frame-src.
// O widget roda no iframe de giscus.app; o login é do leitor, por OAuth do
// GitHub, e a sessão fica no localStorage dele.
import type { Theme } from "~/lib/theme";

export const GISCUS_ORIGIN = "https://giscus.app";

/** Chave do localStorage, a mesma do client.js do giscus. */
export const SESSION_KEY = "giscus-session";

/** Parâmetro da URL com que o giscus devolve a sessão depois do login. */
export const SESSION_PARAM = "giscus";

export type GiscusConfig = {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  lang: string;
};

export type WidgetPage = {
  /** URL da página, sem o parâmetro da sessão e sem o hash. */
  origin: string;
  /** Mapeamento `specific`: o slug do post, com `strict`. */
  term: string;
  description: string;
  backLink: string;
  theme: string;
  session?: string | null;
};

export function widgetUrl(config: GiscusConfig, page: WidgetPage): string {
  const params = new URLSearchParams({ origin: page.origin });
  if (page.session) params.set("session", page.session);
  params.set("theme", page.theme);
  // Só comentários: sem as reações do post (decisão do autor na T-28).
  params.set("reactionsEnabled", "0");
  params.set("emitMetadata", "0");
  params.set("inputPosition", "top");
  params.set("repo", config.repo);
  params.set("repoId", config.repoId);
  params.set("category", config.category);
  params.set("categoryId", config.categoryId);
  params.set("strict", "1");
  params.set("description", page.description);
  params.set("backLink", page.backLink);
  params.set("term", page.term);
  return `${GISCUS_ORIGIN}/${config.lang}/widget?${params.toString()}`;
}

/** Temas embutidos sem borda, um por tema do site (RF-17). */
export function giscusTheme(theme: Theme): string {
  return theme === "dark" ? "noborder_dark" : "noborder_light";
}

export function sessionFromSearch(search: string): string | null {
  return new URLSearchParams(search).get(SESSION_PARAM);
}

/** A sessão gravada é um JSON de string; outro valor é descartado. */
export function parseStoredSession(raw: string | null): {
  session: string | null;
  invalid?: true;
} {
  if (raw === null) return { session: null };
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value === "string" && value !== "") return { session: value };
  } catch {
    // Cai no inválido abaixo.
  }
  return { session: null, invalid: true };
}

/** A URL da página sem o parâmetro da sessão e sem o hash. */
export function pageOrigin(href: string): string {
  const url = new URL(href);
  url.searchParams.delete(SESSION_PARAM);
  url.hash = "";
  return url.href;
}

export type GiscusMessage =
  { kind: "resize"; height: number } | { kind: "signOut" };

// Erros do widget que pedem nova sessão, como no client.js do giscus.
const SESSION_ERRORS = [
  "Bad credentials",
  "Invalid state value",
  "State has expired",
];

export function readMessage(event: {
  origin: string;
  data: unknown;
}): GiscusMessage | null {
  if (event.origin !== GISCUS_ORIGIN) return null;
  const data = event.data;
  if (typeof data !== "object" || data === null || !("giscus" in data)) {
    return null;
  }
  const giscus: unknown = data.giscus;
  if (typeof giscus !== "object" || giscus === null) return null;
  if ("resizeHeight" in giscus) {
    const height = giscus.resizeHeight;
    if (typeof height === "number" && Number.isFinite(height) && height >= 0) {
      return { kind: "resize", height };
    }
    return null;
  }
  if ("signOut" in giscus) return { kind: "signOut" };
  if ("error" in giscus && typeof giscus.error === "string") {
    const error = giscus.error;
    if (SESSION_ERRORS.some((item) => error.includes(item))) {
      return { kind: "signOut" };
    }
  }
  return null;
}

export function setConfigMessage(theme: string): {
  giscus: { setConfig: { theme: string } };
} {
  return { giscus: { setConfig: { theme } } };
}
