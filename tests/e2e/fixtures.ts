export const fixtureMd = {
  href: "/blog/fixture-md/",
  title: "Fixture de Markdown",
  description:
    "Post de prova em Markdown, com títulos aninhados, código, fórmula, citações e apêndice.",
  published: "02.jan.2000",
  updated: "09.jan.2000",
  // chave-a é video e chave-b é paper: o grupo Papers vem antes, e a ordem
  // dos números inverte a do frontmatter (T-117).
  keys: ["chave-b", "chave-a"],
  groups: ["Papers · 1", "Vídeos · 1"],
  citationTitles: ["Segunda nota da fixture", "Notas sobre a fixture"],
  authorLines: [
    "Alan Turing, 2000. Caderno de prova.",
    "Ada Lovelace e Grace Hopper, 2000. Caderno de prova.",
  ],
  appendixHeading: "Apêndice A · Notas da fixture",
  bodyTerm: "exercita",
  descriptionTerm: "aninhados",
} as const;

export const fixtureMdx = {
  href: "/blog/fixture-mdx/",
  title: "Fixture de MDX",
  published: "03.jan.2000",
  // Na ordem dos grupos: Modelos, Papers, Textos. O gpt2 não tem marcador no
  // texto (citação indireta, T-117).
  keys: ["gpt2", "distill-multimodal", "astro-unified"],
  groups: ["Modelos · 1", "Papers · 1", "Textos · 1"],
  appendixHeading: "Apêndice A · Como as citações funcionam",
  notebook:
    "https://molab.marimo.io/github/Pedroknoll/blog_pedro-knoll/blob/main/src/content/posts/fixture-mdx/notebooks/prova.py",
} as const;

export const fixtureSemTitulos = {
  href: "/blog/fixture-sem-titulos/",
  title: "Fixture sem títulos",
  published: "01.jan.2099",
  keys: [],
} as const;

export const fixtureFormulas = {
  href: "/blog/fixture-formulas/",
  title: "Fixture de fórmulas",
  published: "04.jan.2000",
  inline: 30,
  display: 10,
  katex: ["KaTeX_Main-Regular", "KaTeX_Math-Italic", "KaTeX_Size2-Regular"],
  brandFiles: 5,
} as const;

export const fixtureTag = "fixture";
export const fixtureTagMath = "math";
