export const siteTitle = "Nome do blog";
export const authorName = "Seu Nome";
export const siteBio = "Uma linha sobre você.";
export const separator = " · ";

export const homeTitle = `${siteTitle}${separator}${authorName}`;

export function titled(page: string) {
  return `${page}${separator}${siteTitle}${separator}${authorName}`;
}
