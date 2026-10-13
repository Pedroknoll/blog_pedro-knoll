# ADR-01 (v1): Astro 6 — substituído

- **Status:** substituído em 09/10/2026 pela versão atual do ADR-01 (SPEC §5): Astro 7 com o processador `unified()`.
- **Decisão original (06/10/2026):** Astro 6, `output: 'static'`, content collections com loader `glob` e schemas Zod 4.

## Por que mudou

- O Astro 7 saiu em 22/06/2026, e a doc do Astro 6 virou um snapshot sem manutenção (`v6.docs.astro.build`). Começar um projeto novo numa versão sem doc mantida aumenta o risco de o agente seguir exemplos desatualizados.
- O exemplo oficial do mdx-marimo (`examples/with-astro`) roda em Astro 7 e configura o MDX com `processor: unified({ remarkPlugins: [remarkMarimo] })`.
- O projeto ainda não tinha código (T-01 pendente), então a troca não custa migração.

## O que muda na prática

- No Astro 7, o processador de Markdown padrão é o Sätteri. Plugins remark e rehype (`remarkMarimo`, `remark-math`, `rehype-katex`, tempo de leitura) exigem `@astrojs/markdown-remark` com `unified()` em `markdown.processor` e em `mdx({ processor })`. As opções `markdown.remarkPlugins` e `markdown.rehypePlugins` estão depreciadas.
- O compilador Rust recusa tags não fechadas e não corrige aninhamento inválido de HTML.
- O padrão `compressHTML: 'jsx'` remove o espaço entre elementos inline; use `{" "}` quando o espaço importar.
- `src/fetch.ts` é nome reservado (Advanced Routing).
- Vite 8 com Rolldown.

## Alternativas consideradas

- **Manter Astro 6:** descartada pela doc sem manutenção e por divergir do exemplo do mdx-marimo.
- **Astro 7 com Sätteri:** descartada por exigir portar ou substituir os plugins remark e rehype. Pode ser reavaliada depois do lançamento, se houver plugins Sätteri equivalentes.

## Fontes

- [Upgrade to Astro v7](https://docs.astro.build/en/guides/upgrade-to/v7/)
- [Markdown in Astro: Markdown processors](https://docs.astro.build/en/guides/markdown-content/)
- [mdx-marimo,](https://github.com/marimo-team/mdx-marimo) `examples/with-astro`

