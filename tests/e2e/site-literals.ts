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

const stepLabels = [
  "O destaque começa na primeira casa.",
  "O destaque anda uma coluna.",
  "O destaque desce uma linha.",
];

export const stepFigure = {
  name: "t20-stepper",
  title: "Matriz 4 por 4 em três passos",
  summary: "Matriz de 4 por 4 células; Anterior e Próximo movem o destaque.",
  caption: "Três passos movem o destaque numa matriz 4 × 4.",
  columns: ["Passo", "Descrição"],
  rows: stepLabels.map((label, index) => [String(index + 1), label]),
  live: stepLabels.map(
    (label, index) => `Passo ${index + 1} de ${stepLabels.length}: ${label}`,
  ),
  width: 124,
  height: 156,
};

export const heatFigure = {
  name: "t20-heatmap",
  title: "Atenção dos cinco tokens",
  summary: "Mapa de atenção de 5 por 5; a consulta escolhe a linha contornada.",
  caption:
    "A consulta escolhe a linha; o maior peso de cada linha está no texto ao vivo.",
  queryLabel: "Consulta",
  columns: ["Consulta", "o", "gato", "subiu", "no", "telhado"],
  rows: [
    ["o", "0,251", "0,173", "0,162", "0,236", "0,178"],
    ["gato", "0,148", "0,252", "0,244", "0,141", "0,215"],
    ["subiu", "0,132", "0,233", "0,268", "0,138", "0,228"],
    ["no", "0,240", "0,168", "0,173", "0,237", "0,182"],
    ["telhado", "0,142", "0,200", "0,222", "0,143", "0,293"],
  ],
  liveFirst: "Consulta: o · maior peso: o (0,251)",
  liveSecond: "Consulta: gato · maior peso: gato (0,252)",
  opacities: [
    ["0.6", "0.3", "0.15", "0.6", "0.3"],
    ["0.15", "0.6", "0.6", "0.15", "0.45"],
    ["0.15", "0.6", "0.75", "0.15", "0.45"],
    ["0.6", "0.3", "0.3", "0.6", "0.3"],
    ["0.15", "0.45", "0.45", "0.15", "0.75"],
  ].flat(),
  width: 216,
  height: 248,
};
