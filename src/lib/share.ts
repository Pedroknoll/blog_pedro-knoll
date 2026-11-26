// Compartilhar no fim do post (RF-23, T-130, BRAND §9.14): links com o título
// e a URL do post, sem script de terceiro.

export interface ShareLink {
  label: string;
  href: string;
}

/** X, LinkedIn e e-mail, nessa ordem. O LinkedIn só lê a URL (o título vem do Open Graph). */
export function shareLinks(title: string, url: string): ShareLink[] {
  const text = encodeURIComponent(title);
  const link = encodeURIComponent(url);
  return [
    {
      label: "X.com",
      href: `https://x.com/intent/tweet?text=${text}&url=${link}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${link}`,
    },
    { label: "E-mail", href: `mailto:?subject=${text}&body=${link}` },
  ];
}

/** O filete que fecha o cabeçalho saiu da tela por cima: o bloco da lateral aparece. */
export function isPastHeader(entry: {
  isIntersecting: boolean;
  top: number;
}): boolean {
  return !entry.isIntersecting && entry.top < 0;
}
