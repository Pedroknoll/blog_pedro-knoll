# Agent — src/components/viz/

Complementa o `AGENTS.md` da raiz e prevalece no que for mais específico. Fontes: SPEC §8 (visualizações) e seção 9.8 do BRAND (diagramas). Em conflito de comportamento, vale a SPEC.

## Os dois modos

- O mesmo `.svelte` sem `client:*` é figura estática (degrau 1, 0 JS); com `client:visible` é explorável (degrau 3). Nos dois, o SVG sai no HTML do build.
- `client:load` só com justificativa no PR. Nada de `client:only`: ele tira o SVG do HTML.
- Os controles de um explorável saem `disabled` no HTML do build e habilitam quando o componente hidrata. A figura não muda de tamanho (CLS) e não há botão que não faz nada.
- Dados por props, importados no MDX de JSON ou CSV da pasta do post; nada de `fetch`. Datas chegam como string ISO e o componente converte. O controle lê uma tabela pré-calculada e não recalcula modelo no navegador (RNF-13).

## Contrato

- Svelte 5 com runes (`$props()`, `$state`, `$derived`, `$effect`) e eventos como atributo (`onclick`). `lang="ts"` só com recursos de tipo, sem `enum`; o projeto não tem `svelte.config.js`.
- O `svg` raiz leva `data-viz="<nome>"`, `role="img"`, `aria-label={summary}` e, como primeiro filho, `<title>{title}</title>`. Todo gráfico recebe `title` e `summary` (RNF-04).
- Teto de 1.000 elementos por figura, contando o `svg` e todos os descendentes, verificado em `tests/e2e/viz.spec.ts`. Acima disso, os dados são reduzidos no Python.
- A geometria fica em funções puras de `src/lib/viz/`, testadas no Vitest; o `.svelte` só desenha.
- D3 só em módulos avulsos da SPEC §9 e só para cálculo. O DOM é do Svelte: `d3-selection` não cria nem altera elemento (exceção: `d3-zoom` e `d3-drag` por action).
- O JS de cada island cabe em 40.000 bytes gzip, medidos pelo `pnpm check:js` (componente, renderer e imports estáticos). Página sem island fica sem JS de island.

## Cor e tipo

- Só os tokens da lista fechada, pelas classes do Tailwind (`fill-ink`, `stroke-ink`, `fill-sheet`, `fill-accent`, `stroke-line`…). Sem hex, sem variável `--viz-*` e sem `dark:`.
- Tinta para os elementos; `accent` para um único destaque por figura; tracejado fino para guias.
- Rótulos em IBM Plex Mono 400; no máximo duas notas em IBM Plex Sans itálico; nenhuma face nova.
- Sem sombra, gradiente ou 3D. Prefira classes do Tailwind a `<style>` no componente.
- A cota com medida real e a grade milimetrada entram com as primitivas e o token `grid` da T-72.

## Moldura

- `Figure.astro` (legenda numerada, "Ver dados" e proporção reservada) é da T-72. Até lá, a figura de prova fica sem moldura.
- `IslandProof.svelte` é a prova da T-19, usada no post B; sai na T-21.
