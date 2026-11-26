// Cores da ficha da imagem OG (BRAND §4 e §11, tema claro), para o gerador
// da T-23. O sharp desenha fora do CSS e não lê as variáveis de
// src/styles/global.css; por isso o hex fica aqui, com os desenhos da marca.
export const OG_COLORS = {
  surface: "#FAF9F5",
  ink: "#2A2118",
  muted: "#5E5345",
  accent: "#1F4B7A",
  line: "rgba(60,40,20,0.16)",
  grid: "rgba(31,75,122,0.03)",
  gridStrong: "rgba(31,75,122,0.065)",
} as const;
