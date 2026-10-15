export function postIdFromEntry(entry: string): string {
  const segments = entry.split("/");
  if (segments.length !== 2) {
    throw new Error(
      `Entrada de post inválida: "${entry}" precisa ter exatamente dois segmentos (pasta/index.md ou pasta/index.mdx).`,
    );
  }

  const [folder] = segments;
  if (!/^[a-z0-9-]+$/.test(folder)) {
    throw new Error(
      `Nome de pasta inválido: "${folder}" em "${entry}" precisa casar com ^[a-z0-9-]+$.`,
    );
  }

  return folder;
}
