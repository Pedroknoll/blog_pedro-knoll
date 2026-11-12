# Agent — src/components/viz/

Complementa o `AGENTS.md` da raiz e prevalece no que for mais específico. Fontes: SPEC §8 (visualizações) e seção 9.8 do BRAND (diagramas). Em conflito de comportamento, vale a SPEC.

## Os dois modos

- O mesmo `.svelte` sem `client:*` é figura estática (degrau 1, 0 JS); com `client:visible` é explorável (degrau 3). Nos dois, o SVG sai no HTML do build.
- `client:load` só com justificativa no PR. Nada de `client:only`: ele tira o SVG do HTML.
- O `astro-island` tem `display: contents` e não tem caixa. Em teste, role até a figura ou meça a figura, nunca o island.
- Os controles de um explorável saem `disabled` no HTML do build e habilitam quando o componente hidrata. A figura não muda de tamanho (CLS) e não há botão que não faz nada.
- Dados por props, importados no MDX de JSON ou CSV da pasta do post; nada de `fetch`. Datas chegam como string ISO e o componente converte. O controle lê uma tabela pré-calculada e não recalcula modelo no navegador (RNF-13). A tabela sai do `data/build.py` do post, rodado pelo `scripts/build-data.py`, e fica em `data/`, conferida pelo `data.lock` (SPEC §8); a prova da T-73 é o `data/attention.json` da `fixture-mdx`, `{ tokens, weights }`, uma matriz 5 × 5, formato fixado na T-20 e lido pelo `Explorable`.

## Contrato

- Svelte 5 com runes (`$props()`, `$state`, `$derived`, `$effect`) e eventos como atributo (`onclick`). `lang="ts"` só com recursos de tipo, sem `enum`; o projeto não tem `svelte.config.js`.
- O `svg` raiz leva `data-viz="<nome>"`, `role="img"`, `aria-label={summary}` e, como primeiro filho, `<title>{title}</title>`. Todo gráfico recebe `title` e `summary` (RNF-04).
- Na figura estática, o dono do `svg` raiz é o `Figure.astro`; num explorável, o próprio `.svelte`, e o `Figure` vai no modo island (T-20).
- `Stepper` (Anterior e Próximo sobre uma `Matrix`, com os passos por props) e `Explorable` (controle deslizante que escolhe a linha do `Heatmap`) são donos do `svg` e só existem com `client:visible`; a figura estática é a primitiva dentro do `Figure`. A lógica fica em `src/lib/viz/steps.ts` e `src/lib/viz/heatmap.ts`.
- Primitivas (`Vector`, `Matrix`, `Tensor`, `Arrow`, `Grid`): `.svelte` com `<svelte:options namespace="svg" />`, sem estado, que desenham um `<g>` no sistema da raiz. No MDX, entram autocontidas no slot do `Figure`: filhos do MDX para um `.svelte` chegam embrulhados em `astro-static-slot`, que não desenha dentro de um `svg`. Id de `<pattern>` com `$props.id()` e prefixo `grade-`.
- Teto de 1.000 elementos por figura, contando o `svg` e todos os descendentes, verificado em `tests/e2e/viz.spec.ts`. Acima disso, os dados são reduzidos no Python.
- A geometria fica em funções puras de `src/lib/viz/`, testadas no Vitest; o `.svelte` só desenha. Os tipos dentro do `.svelte` são conferidos pelo `pnpm check:svelte`, não pelo `astro check` (T-75).
- D3 só em módulos avulsos da SPEC §9 e só para cálculo. O DOM é do Svelte: `d3-selection` não cria nem altera elemento (exceção: `d3-zoom` e `d3-drag` por action).
- O JS de cada island cabe em 40.000 bytes gzip, medidos pelo `pnpm check:js` (componente, renderer e imports estáticos). Página sem island fica sem JS de island.

## Cor e tipo

- Só os tokens da lista fechada, pelas classes do Tailwind (`fill-ink`, `stroke-ink`, `fill-sheet`, `fill-accent`, `stroke-line`…). Sem hex, sem variável `--viz-*` e sem `dark:`.
- Tinta para os elementos; `accent` para um único destaque por figura; tracejado fino para guias.
- Rótulos em IBM Plex Mono 400; no máximo duas notas em IBM Plex Sans itálico; nenhuma face nova.
- Sem sombra, gradiente ou 3D. Prefira classes do Tailwind a `<style>` no componente.
- A grade usa `stroke-grid` e `stroke-grid-strong`; a cota vem de `dimension()` em `src/lib/viz/geometry.ts`. Medidas e vocabulário na BRAND §9.8.
- `Heatmap`: células `fill-ink` com `fill-opacity` pelos cinco degraus de `HEAT_OPACITY` (`src/lib/viz/heatmap.ts`); o destaque é o contorno da linha em `stroke-accent`. Sem `d3-scale-chromatic`, que devolve hex. Medidas e contraste na BRAND §9.8.
- A troca de cor usa `transition-colors motion-reduce:transition-none`.
- A guarda de cores (`tests/unit/color-tokens.test.ts`) varre os `.astro` e `.svelte` desta pasta.

## Moldura

- `Figure.astro`: props `number`, `caption`, `title`, `summary`, `name`, `width`, `height` e `data` (`columns` e `rows`). Desenha o `svg` raiz com a grade, a `<figcaption>` como último filho da `<figure>` e, logo depois da `<figure>`, o `<details>` "Ver dados" com a tabela de `data`. A `<figcaption>` dá o nome acessível da figura, por isso o "Ver dados" fica fora dela. Sem `<style>` nem atributo `style` (CSP).
- Modo island: `<Figure island number={…} caption="…" data={…}>`, sem `title`, `summary`, `name`, `width` nem `height`. Não desenha `svg` nem grade; o slot vai direto na `<figure>`, antes da `<figcaption>`, e o island leva tudo isso no próprio `.svelte`.
- As figuras de prova ficam na `fixture-mdx` (T-39): "Figuras com moldura", prova da T-72; "Uma figura em dois modos", com o `IslandProof.svelte`, prova da T-19, sem moldura; e "Passos e exploráveis", prova da T-20. O `IslandProof.svelte` só serve a ela. Os testes de figura abrem a `fixture-mdx` pelos literais de `tests/e2e/fixtures.ts`, nunca um post publicado.
