import avatar from "~/assets/avatar.jpg";

export const site = {
  title: "pk.log",
  // SITE_URL é a variável do repositório; em produção, https://pedroknoll.com.
  url: import.meta.env.SITE_URL ?? "https://blog.exemplo.com",
  author: {
    name: "Pedro Knoll",
    // Importada: o astro:assets gera a variante de cada uso (T-134).
    avatar,
    bio: "Aprendizados e experimentos em IA",
    github: "https://github.com/Pedroknoll",
    linkedin: "https://www.linkedin.com/in/pedro-henrique-knoll-giacometo/",
  },
  // Comentários pelo Giscus (RF-19, T-28). Os ids são públicos: a
  // API do GitHub os devolve a qualquer um. A categoria é do tipo
  // Announcement, em que só o autor e o giscus criam discussões.
  comments: {
    repo: "Pedroknoll/blog_pedro-knoll",
    repoId: "R_kgDOVH1vrw",
    category: "Comentários",
    categoryId: "DIC_kwDOVH1vr84DMI1M",
    lang: "pt",
    discussions:
      "https://github.com/Pedroknoll/blog_pedro-knoll/discussions/categories/coment%C3%A1rios",
  },
} as const;
