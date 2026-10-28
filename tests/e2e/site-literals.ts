export const siteTitle = "pk.log";
export const authorName = "Pedro Knoll";
export const siteBio = "Aprendizados e experimentos em IA";
export const separator = " · ";

export const homeTitle = `${siteTitle}${separator}${authorName}`;

export function titled(page: string) {
  return `${page}${separator}${siteTitle}${separator}${authorName}`;
}
