export const fixtureMd = {
  href: "/blog/fixture-md/",
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
  title: "Fixture de MDX",
  published: "03.jan.2000",
  keys: ["distill-multimodal", "astro-unified"],
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
