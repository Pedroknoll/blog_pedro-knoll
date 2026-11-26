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
} as const;
