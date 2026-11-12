# Agent

Blog técnico estático no estilo do Hugging Face Blog: Astro 7 gera o HTML, Python (marimo) gera os notebooks no build, a Cloudflare só serve arquivos. Autor único, conteúdo em pt-BR.

- **O quê:** `[specs/SPEC.md](specs/SPEC.md)` é a fonte de verdade. Requisitos têm IDs (`RF-xx`, `RNF-xx`, `ADR-xx`).
- **Identidade:** `[specs/BRAND.md](specs/BRAND.md)`, só a seção citada pela tarefa. Se a marca e a SPEC discordarem no comportamento, seguir a SPEC e avisar.
- **Em que ordem:** `[specs/ROADMAP.md](specs/ROADMAP.md)` tem as tarefas (`T-xx`), dependências, gates e status.
- **Este arquivo:** como trabalhar no repositório. Pastas com regras próprias têm um `AGENTS.md` aninhado, que complementa este e prevalece no que for mais específico.



## Trilhas

Toda mudança entra por uma de três trilhas. Na dúvida, a completa.

| Trilha | Quando | Branch | Prova | ROADMAP |
| --- | --- | --- | --- | --- |
| **Post** | Só arquivos dentro de `src/content/posts/<slug>/` | `post/<slug>` | CI verde e preview olhado a 360 px e no desktop | Não entra: sem ID e sem handoff |
| **Tarefa leve** | Docs, dependência da lista da SPEC §9, correção sem mudança de comportamento | `t-XX-descricao-curta` | CI verde; plano de uma linha e a saída que prova, no PR | Tarefa `concluída` e handoff de 1 linha |
| **Tarefa completa** | Comportamento novo (RF ou RNF), infraestrutura, budget, CSP, schema | `t-XX-descricao-curta` | Os passos abaixo | Tarefa `concluída` e handoff de até 3 linhas |

Um post que precisa mudar algo fora da pasta dele não é post: a mudança vira tarefa, e o post espera (RNF-14). O detalhe de uma tarefa (o que foi medido, tentado e descartado) fica na descrição do PR; o handoff guarda só o que a próxima tarefa precisa saber.

## Como trabalhar uma tarefa completa

1. Leia a linha da tarefa no `ROADMAP.md` e o registro de handoff das tarefas de que ela depende. O das tarefas fechadas até 10/11/2026 está em `specs/arquivo/handoff-ate-2026-11-10.md`.
2. Leia só as seções da SPEC ligadas aos requisitos citados. Não leia a spec inteira por hábito. Se a tarefa citar o BRAND, leia só essa seção.
3. **Antes de editar código**, apresente um plano curto e espere confirmação: arquivos a criar ou mudar, o que fica fora, como vai provar. O mesmo plano vai para a descrição do PR.
4. Testes primeiro, nas tarefas que entregam comportamento (RF ou RNF). Tire o `test.fixme` dos cenários da tarefa, ou escreva os testes a partir dos critérios de aceite da SPEC §3, §4 e §11. **Rode-os e mostre que falham antes de implementar**: um teste que já passa sem o código não prova nada.
  - Exceções: spikes (T-03, T-04, T-05) provam com o doc em `specs/spikes/`; tarefas de infraestrutura (T-01, T-02, T-13, T-36, T-50, T-59) provam com o comando ou o pipeline rodando e com a saída colada no PR. Não invente testes artificiais para elas.
5. Implemente até os testes e os gates ficarem verdes.
6. Feche: tarefa `concluída` e entrada de handoff de até 3 linhas no `ROADMAP.md`; `SPEC.md` atualizado se o comportamento mudou; tudo no mesmo PR.

Uma tarefa = um PR, num branch `t-XX-descricao-curta`. Trabalho descoberto no caminho vira tarefa nova no roadmap, não escopo extra. Na tarefa leve, o passo 3 vira uma linha de plano na descrição do PR, e os passos 4 e 5 viram o CI verde.

## Comandos


| Para                   | Comando                                                                        |
| ---------------------- | ------------------------------------------------------------------------------ |
| Servidor de dev        | `pnpm dev` (localhost:4321). Não gera as páginas de notebook                   |
| Gerar notebooks leves  | `uv run scripts/build-notebooks.py` (com cache por hash)                       |
| Rodar como em produção | `pnpm build && npx wrangler dev` (localhost:8787)                              |
| Build completo         | `pnpm build` (notebooks → Astro → Pagefind)                                    |
| Build com rascunhos    | `SHOW_DRAFTS=true pnpm build`                                                  |
| Lint e tipos           | `pnpm lint` · `pnpm astro check` · `pnpm check:svelte` · `uv run ruff check`   |
| Notebooks              | `uv run marimo check --select MW <arquivo.py>`                                 |
| Testes unitários       | `pnpm vitest run`                                                              |
| Testes E2E             | `pnpm playwright test` (contra `astro preview` do build de produção)           |
| Notebook pesado        | `uv run scripts/build-notebooks.py --heavy <slug>` (ver "Pare e pergunte")     |
| Dados pré-calculados   | `uv run scripts/build-data.py <pasta do post>` (na máquina do autor; roda o `data/build.py` do post e grava o lock; sem argumento, todos) |
| Frescor dos dados      | `pnpm check:data` (também no `pnpm lint`; confere o `data.lock` sem Python)    |


Sempre `pnpm`, nunca `npm` ou `yarn`. Sempre `uv run`, nunca `python` ou `pip` direto: o export WASM do marimo depende das dependências que o uv resolve.

## Mapa

```text
specs/                  SPEC, ROADMAP, BRAND.md, spikes/, adr/ (só ADRs substituídos), arquivo/ (handoffs e revisões antigas; não leia por hábito)
src/site.config.ts      título, URL (SITE_URL) e autor (não existe collection de autores)
src/content.config.ts   collection `posts` com schema Zod 4
src/content/posts/<slug>/index.mdx   cada post é uma pasta: texto, capa, figs/, data/, notebooks/
src/assets/brand/       pklog-simbolo{,-escuro,-currentcolor,-construcao,-pixel,-404}.svg
src/assets/brand/icones/  aceno.svg; icone-{conceito,tutorial,lab,playbook}.svg e -parado; icone-relogio.svg
src/components/ui/      .astro estáticos
src/components/viz/     primitivas e exploráveis Svelte; sem client:* é figura estática (AGENTS.md próprio, criado antes da T-19; seção 9.8 do BRAND)
src/lib/viz/            geometria pura
src/components/marimo/  LabBar (AGENTS.md próprio, criado antes da T-14; seções 9.6–9.7)
src/integrations/headers.ts   gera dist/_headers no build (CSP por rota)
src/lib/                getPublishedPosts, readingTime, seo
src/styles/shiki/       pk-claro.json, pk-escuro.json
scripts/build-notebooks.py
scripts/build-data.py   acha e roda o data/build.py de cada post e grava o data.lock; o pnpm check:data confere o lock (T-73, T-79)
exports/<slug>/<nome>/  exports pesados commitados + export.lock (não editar à mão)
public/                 favicon.svg, favicon.ico, favicon-16.png, favicon-32.png, apple-touch-icon.png
public/notebooks/       gerado no build; fica no .gitignore
tests/                  vitest (unit) e playwright (e2e)
```

Sem `icon-192.png` e sem `icon-512.png`. `src/components/marimo/pk.css` não vem no pacote da marca: nasce na convenção da T-14/T-74.



## Convenções

- **Commits:** Conventional Commits citando o requisito, ex.: `feat(post): lateral do cabeçalho com o título ao rolar [RF-04]`.
- **Branches:** `main` é produção; toda mudança entra por PR com preview.
- **Componentes:** `.astro` para tudo que é estático; `.svelte` só quando houver estado no cliente. Hidratação padrão `client:visible`; `client:load` exige justificativa no PR. Exceção: em `src/components/viz/`, sem `client:*` é figura estática (0 JS); com `client:visible` é explorável.
- **Conteúdo:** as páginas acessam posts só por `getPublishedPosts()`, nunca por `getCollection('posts')` direto (é o que esconde rascunhos quando `SHOW_DRAFTS` não é `true`).
- **Slug:** é o `id` da entrada, gerado pelo `generateId` do loader (nome da pasta). Não recalcule slug nas páginas.
- **Nomes:** identificadores de código em inglês; texto visível e rotas em pt-BR (`/sobre`, `/tags/[tag]`, `/tipos/[tipo]`). Exceções fixadas na SPEC: `/blog/[slug]` e `/page/[n]`.
- **Alias:** `~/` aponta para `src/`.
- **Dados de gráfico:** importados no MDX a partir de JSON/CSV da pasta do post; nada de `fetch` em runtime. Datas chegam como string ISO e o componente converte. Dado que pede cálculo sai do `data/build.py` do post, rodado por `uv run scripts/build-data.py <pasta do post>`: entradas em `data/raw/`, saídas e `data.lock` em `data/`; mudou a entrada ou o `build.py`, rode de novo (SPEC §8). Dependência do `build.py` fica no bloco PEP 723 dele, com o `build.py.lock` do `uv lock --script` commitado (SPEC §9).
- **Notebooks:** o notebook do post é uma página própria em `/notebooks/<slug>/<nome>/`, aberta pela barra do lab; nunca iframe no post. O campo `mode` sai do schema na T-14. Detalhes na SPEC §6 e §7.
- **Cores:** só a lista fechada do CSS global: `surface`, `sheet`, `ink`, `muted`, `pencil`, `line`, `accent`, `kind-concept`, `kind-tutorial`, `kind-lab`, `kind-playbook`, `grid`, `grid-strong`. Sem nome paralelo `--papel` / `--prussia`. Sem `dark:` e sem `@custom-variant dark`. Hex de desenho só em `src/assets/brand/`. As variáveis de `src/styles/global.css` e os JSON do Shiki também carregam hex, porque são a definição da paleta e o tema não lê variável CSS; componente, página e layout não.
- **Fontes:** Fonts API do Astro, `fontProviders.fontsource`, quatro famílias (IBM Plex Sans Condensed, IBM Plex Sans, IBM Plex Mono, Caveat). Tokens `--font-display`, `--font-sans`, `--font-mono` e `--font-hand`. As variáveis de família (`--font-plex-condensed`, `--font-plex-sans`, `--font-plex-mono`, `--font-caveat`) só aparecem no `astro.config.mjs`, no `BaseLayout.astro`, no bloco `@theme inline` do `global.css` e nos testes E2E, que leem a família pela variável. Componente e página usam o token; a IBM Plex Sans entra no texto e a IBM Plex Mono no código pela troca de `--font-sans` e `--font-mono`. Sem pacote `@fontsource` instalado à mão e sem Google Fonts. O Astro acrescenta um sufixo de hash ao nome da família; use sempre o token ou a variável do `cssVariable`, nunca o nome da família escrito à mão. A IBM Plex Mono entra só no peso 400. Tarefa que acrescenta face de fonte numa página mede antes e depois com o Lighthouse. Mudar a lista ou os tetos do `font-budget.spec.ts` é decisão de escopo.
- **Ícones:** import default do `.svg` como componente Astro. Animação no CSS global. Versão parada em lista. `prefers-reduced-motion`. O aceno da saudação fica fora do `h1`, acima dele, e leva `aria-hidden` (T-69).
- **Fonte de display:** IBM Plex Sans Condensed, só o peso 600 normal, sem itálico declarado; um trecho em itálico num título usa o itálico sintetizado. Sem tamanho mínimo próprio (T-60). Outra face nas páginas só depois de uma tarefa medir.
- **AGENTS aninhados,** quando forem criados: marimo recebe as seções 9.6–9.7 e o `pk.css`; viz recebe a seção 9.8. Isso não cria dependência da T-19 com a Fase 1b.



## Armadilhas de versão

A stack é recente e a sintaxe antiga ainda domina o que os modelos viram. Antes de usar uma API de que não tem certeza, consulte a documentação atual (Context7 ou web); não invente flags nem opções. Se a SPEC citar uma API que a doc atual contradiz, pare e avise em vez de seguir a SPEC.

- **Astro 7** (não 6: a doc do 6 está congelada)
  - Markdown e MDX passam pelo processador `unified()` de `@astrojs/markdown-remark`: em `markdown.processor` e em `mdx({ processor: unified({...}) })`. O padrão do Astro 7 é o Sätteri, que não roda plugins remark/rehype. `markdown.remarkPlugins` e `markdown.rehypePlugins` estão depreciados: não use.
  - O compilador Rust recusa tags não fechadas e não corrige aninhamento inválido (nada de `<div>` dentro de `<p>`).
  - `compressHTML: 'jsx'` é o padrão: o espaço entre elementos inline some. Use `{" "}` onde o espaço importa.
  - `src/fetch.ts` é nome reservado. Não crie esse arquivo.
  - Collections em `src/content.config.ts` com `loader: glob({ ..., generateId })`, não em `src/content/config.ts`.
  - `z` vem de `astro/zod`, não de `zod`. Para renderizar, `render(entry)` importado de `astro:content`, não `entry.render()`.
  - A Fonts API é `fonts` no topo do `defineConfig` e `<Font>` de `astro:assets`. `experimental.fonts` é do Astro 5.
  - O content layer guarda o HTML renderizado dos `.md` e só renderiza de novo quando o arquivo muda; o `.mdx` passa pelo Vite e é recompilado. Depois de mudar uma dependência do pipeline de Markdown (`remark-*`, `rehype-*`, `katex`), rode `pnpm build --force` antes de testar ou medir (T-68). O CI não guarda cache.
- **pnpm 12:** a configuração do pnpm (`overrides`, `allowBuilds`) fica no `pnpm-workspace.yaml`; o campo `pnpm` do `package.json` não é lido desde o pnpm 11. O `overrides` do `katex` alinha o `rehype-katex` e o `remark-math` à versão direta: ao subir o `katex`, suba o override junto (T-68).
- **Zod 4:** `z.url()`, não `z.string().url()`; `{ error: '...' }`, não `{ message: '...' }`; `z.strictObject()` em vez de `.strict()`.
- **TypeScript:** fica em 6.x. O 7 ainda quebra `astro check` e `typescript-eslint` (peers `^5 || ^6`). Só subir quando os dois suportarem; confira os peers antes. O `baseUrl` do `tsconfig.json` está depreciado no 6 e deixa de funcionar no 7; o `pnpm check:svelte` mostra esse warning até a T-83.
- **Svelte 5:** runes (`$props()`, `$state`, `$derived`, `$effect`). Eventos como atributo (`onclick`), não `on:click`. Nada de `export let`, `createEventDispatcher` ou stores para estado local. `lang="ts"` só com recursos de tipo, sem `enum`; o projeto não tem `svelte.config.js`. O `astro check` não confere tipos dentro do `.svelte`; quem confere é o `pnpm check:svelte`, que roda depois do `astro check` porque precisa do `.astro/types.d.ts` (T-75). O `astro-island` tem `display: contents` e não tem caixa: em teste, role até a figura ou meça a figura, nunca o island (T-19).
- **Tailwind v4:** configuração no CSS (`@import "tailwindcss" source("..")`, `@theme`, `@plugin "@tailwindcss/typography"`), integrada pelo plugin `@tailwindcss/vite`. O `source("..")` limita a detecção de classes a `src/` (T-50): texto em `specs/`, em `tests/` e na raiz não gera CSS, e classe escrita só fora de `src/` não é gerada. Não existe `tailwind.config.js` e não se usa `@astrojs/tailwind`.
- **D3 v7:** importe módulos avulsos (`d3-scale`, `d3-shape`, `d3-array`, `d3-format`), nunca o pacote `d3`. O DOM é do Svelte: `d3-selection` não cria nem altera elementos (exceção: `d3-zoom`/`d3-drag` via action).
- **Cloudflare:** o site roda em **Workers com Static Assets** (`wrangler.jsonc`, `assets.directory: ./dist`). Não é Pages: nada de `wrangler pages deploy` nem `@astrojs/cloudflare` (o site é estático, sem adapter).
- **Modo inline:** adiado na T-03; não instale `@marimo-team/mdx-marimo`.
- **marimo:** versão travada no `uv.lock`. Dados de notebook são lidos com `mo.notebook_location()`. Cache e pré-cômputo usam `cache_cells = true`, `--execute` e `@mo.persistent_cache(method="lazy")`; `method="pickle"` não empacota bem para WASM. Célula que treina com `torch` não entra no cache com `cache_cells` no marimo 0.25.1, ver `specs/spikes/T-04-html-wasm.md`.
- **CSP e** `_headers`**:** o arquivo é gerado no build (`src/integrations/headers.ts`); não edite `dist/_headers` nem crie `public/_headers`. Na Cloudflare, header repetido em regras que casam com a mesma URL chega em linhas separadas (a doc descreve união por vírgula; para a CSP, as duas formas são duas políticas). Os testes de headers usam GET: HEAD falhou no preview da T-05. Para trocar a CSP de uma rota, a regra precisa de `! Content-Security-Policy` antes da nova. Limite de 100 regras. Só cabe um splat por regra; use `:placeholder` por segmento (ex.: `/notebooks/:slug/:nome/assets/*`). `wasm-unsafe-eval` só nas rotas com notebook. Use `frame-ancestors 'self'`, não `X-Frame-Options: DENY`.



## Pare e pergunte

Não faça sem pedido explícito:

- Mudar uma decisão da SPEC §5 (ADRs) ou um requisito. Proponha a mudança no PR e espere.
- Relaxar um budget (Lighthouse, `check:js`), a CSP ou um teste. Teste errado é motivo para parar, não para editar o teste.
- Adicionar dependência (npm ou Python) **fora da lista pré-aprovada da SPEC §9**. As da lista podem ser instaladas na versão estável atual.
- Subir a versão maior de Astro, Svelte, Tailwind, Zod ou marimo.
- Fazer deploy de produção. Produção só sai pelo CI, no merge em `main`.
- Rodar `build-notebooks.py --heavy`: executa treino e pode levar muito tempo.
- Editar à mão `export.lock`, `exports/`, `public/notebooks/`, `dist/`, o `data.lock` ou as saídas em `data/` de um post: são gerados. As entradas em `data/raw/` e o `data/build.py` são do autor.
- Dar push direto em `main` ou force-push.



## Definition of Done

Todas as trilhas:

- [ ] Lint, tipos, testes e budgets verdes no CI.
- [ ] Preview revisado em mobile (360 px) e desktop.

Post, além disso:

- [ ] Nenhum arquivo fora de `src/content/posts/<slug>/` no diff.

Tarefa leve, além do comum:

- [ ] Requisitos citados no PR e na mensagem de commit.
- [ ] `ROADMAP.md`: tarefa `concluída` e handoff de 1 linha.

Tarefa completa, além da leve:

- [ ] Testes do nível adequado escritos, vistos falhando antes e passando depois (spikes e infra: prova pelo doc de spike ou pela saída do pipeline).
- [ ] Handoff de até 3 linhas no lugar da linha única e, se for o caso, status do gate.
- [ ] `SPEC.md` atualizado se o comportamento mudou.