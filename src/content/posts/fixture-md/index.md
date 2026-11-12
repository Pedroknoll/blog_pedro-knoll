---
title: "Fixture de Markdown"

description: "Post de prova em Markdown, com títulos aninhados, código, fórmula, referências e apêndice."

pubDate: 2000-01-02

updatedDate: 2000-01-09

folio: 901
kind: playbook
level: 2

tags: [fixture, md]

references:
  - key: chave-a
    authors:
      - Ada Lovelace
      - Grace Hopper
    title: Notas sobre a fixture
    year: 2000
    venue: Caderno de prova
    url: https://example.com/chave-a
  - key: chave-b
    authors:
      - Alan Turing
    title: Segunda nota da fixture
    year: 2000
    venue: Caderno de prova
    url: https://example.com/chave-b

appendices:
  - title: Notas da fixture
    paragraphs:
      - A citação no texto é um número entre colchetes. O número é a posição da obra na lista, e o link leva ao item no fim do post.
---

Este post exercita o Markdown publicado: títulos, código, fórmula e citação.

## Camada de seção

A primeira referência entra nesta camada [@chave-a].

### Camada intermediária

A segunda referência entra nesta camada [@chave-b].

#### Camada de detalhe

O detalhe fica neste quarto nível, depois do terceiro.

```ts title=dobro.ts
function dobro(n: number): number {
  return n * 2;
}
```

Para gerar o site, um comando basta:

```sh
pnpm build
```

A soma dos quadrados de $x_i$ é a norma ao quadrado:

$$
\sum_{i=1}^{n} x_i^2 = \lVert x \rVert^2
$$
