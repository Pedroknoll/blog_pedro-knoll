import { describe, expect, it } from "vitest";
import { postIdFromEntry } from "../../src/lib/post-id";

describe("postIdFromEntry", () => {
  it("devolve o nome da pasta de index.mdx", () => {
    expect(postIdFromEntry("minha-pasta/index.mdx")).toBe("minha-pasta");
  });

  it("devolve o nome da pasta de index.md", () => {
    expect(postIdFromEntry("minha-pasta/index.md")).toBe("minha-pasta");
  });

  it("rejeita entry com um segmento", () => {
    expect(() => postIdFromEntry("index.mdx")).toThrow(
      'Entrada de post inválida: "index.mdx" precisa ter exatamente dois segmentos (pasta/index.md ou pasta/index.mdx).',
    );
  });

  it("rejeita entry com mais de dois segmentos", () => {
    expect(() => postIdFromEntry("a/b/index.mdx")).toThrow(
      'Entrada de post inválida: "a/b/index.mdx" precisa ter exatamente dois segmentos (pasta/index.md ou pasta/index.mdx).',
    );
  });

  it("rejeita nome de pasta fora do padrão", () => {
    expect(() => postIdFromEntry("Minha_Pasta/index.mdx")).toThrow(
      'Nome de pasta inválido: "Minha_Pasta" em "Minha_Pasta/index.mdx" precisa casar com ^[a-z0-9-]+$.',
    );
  });
});
