export const siteTitle = "pk.log";
export const authorName = "Pedro Knoll";
export const siteBio = "Aprendizados e experimentos em IA";
export const separator = " · ";

export const homeTitle = `${siteTitle}${separator}${authorName}`;

export function titled(page: string) {
  return `${page}${separator}${siteTitle}${separator}${authorName}`;
}

export const homeGreeting = "Bem-vindo ao pk.log";
export const homeIntro =
  "Olá, eu sou o Pedro. Aqui documento meus aprendizados e experimentos sobre Inteligência Artificial.";

export const notFoundHeading = "Esta página foi arrancada do caderno.";
