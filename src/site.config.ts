export const site = {
  title: "pk.log",
  // até a Q4b fechar, SITE_URL aponta para o endereço workers.dev do Worker
  url: import.meta.env.SITE_URL ?? "https://blog.exemplo.com",
  author: {
    name: "Pedro Knoll",
    avatar: "/avatar.jpg",
    bio: "Aprendizados e experimentos em IA",
    github: "usuario",
    huggingface: "usuario",
  },
} as const;
