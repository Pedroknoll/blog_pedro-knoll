export const siteTitle = "pk.log";
export const authorName = "Pedro Knoll";
export const authorGithub = "https://github.com/Pedroknoll";
export const authorLinkedin =
  "https://www.linkedin.com/in/pedro-henrique-knoll-giacometo/";
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

export const notFoundIntro =
  "O endereço pode ter mudado, ou esta página ainda não foi escrita. O resto do caderno continua aqui.";

export const kindSlugs = {
  concept: "conceito",
  tutorial: "tutorial",
  lab: "lab",
  playbook: "playbook",
} as const;

export function kindPath(kind: keyof typeof kindSlugs): string {
  return `/tipos/${kindSlugs[kind]}/`;
}

export const vizStaticTitle = "Grade 5 por 5, estática";
export const vizStaticSummary =
  "Grade de 5 por 5 células com a primeira em destaque.";
export const vizExplorableTitle = "Grade 5 por 5, explorável";
export const vizExplorableSummary =
  "Grade de 5 por 5 células; Anterior e Próximo movem o destaque.";
export const vizPrevious = "Anterior";
export const vizNext = "Próximo";
export const vizCellIdle = "Célula 1 de 25";
export const vizCellNext = "Célula 2 de 25";

export const vizDataLabel = "Ver dados";
export const figureWidth = 280;

export const figureMatrixVector = {
  name: "t72-matrix-vector",
  title: "Matriz 4 por 4 que vira um vetor de 4",
  summary:
    "Uma matriz de 4 por 4 células, uma seta e um vetor coluna de 4 células, com a cota [4].",
  caption: "Uma matriz 4 × 4 vira um vetor de 4 elementos.",
  columns: ["Elemento", "Formato"],
  rows: [
    ["Matriz", "4 × 4"],
    ["Vetor", "4"],
  ],
};

export const figureTensor = {
  name: "t72-tensor",
  title: "Tensor 3 por 4 por 4",
  summary: "Três camadas de 4 por 4 células empilhadas, com a cota [3, 4, 4].",
  caption: "Um tensor de formato [3, 4, 4]: três matrizes 4 × 4 empilhadas.",
  columns: ["Eixo", "Tamanho"],
  rows: [
    ["camadas", "3"],
    ["linhas", "4"],
    ["colunas", "4"],
  ],
};
