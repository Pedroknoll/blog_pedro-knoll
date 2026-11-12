export const fixtureMd = {
  href: "/blog/fixture-md/",
  folio: 901,
  title: "Fixture de Markdown",
  published: "02.jan.2000",
  updated: "09.jan.2000",
  keys: ["chave-a", "chave-b"],
  referenceTitles: ["Notas sobre a fixture", "Segunda nota da fixture"],
  authorLines: [
    "Ada Lovelace e Grace Hopper, 2000. Caderno de prova.",
    "Alan Turing, 2000. Caderno de prova.",
  ],
  appendixHeading: "Apêndice A · Notas da fixture",
} as const;

export const fixtureMdx = {
  href: "/blog/fixture-mdx/",
  folio: 902,
  title: "Fixture de MDX",
  published: "03.jan.2000",
  keys: ["distill-multimodal", "astro-unified"],
} as const;

export const fixtureSemTitulos = {
  href: "/blog/fixture-sem-titulos/",
  folio: 903,
  title: "Fixture sem títulos",
  published: "01.jan.2099",
  keys: [],
} as const;
