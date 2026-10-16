export const site = {
  title: "Nome do blog QUEBRA",
  // até a Q4b fechar, SITE_URL aponta para o endereço workers.dev do Worker
  url: import.meta.env.SITE_URL ?? "https://blog.exemplo.com",
  author: {
    name: "Seu Nome",
    avatar: "/avatar.jpg",
    bio: "Uma linha sobre você.",
    github: "usuario",
    huggingface: "usuario",
  },
} as const;
