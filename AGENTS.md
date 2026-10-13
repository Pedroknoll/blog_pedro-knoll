# Agent

Blog técnico estático no estilo do Hugging Face Blog: Astro 7 gera o HTML, Python (marimo) gera os notebooks no build, a Cloudflare só serve arquivos. Autor único, conteúdo em pt-BR.

- **O quê:** `[specs/SPEC.md](specs/SPEC.md)` é a fonte de verdade. Requisitos têm IDs (`RF-xx`, `RNF-xx`, `ADR-xx`).
- **Em que ordem:** `[specs/ROADMAP.md](specs/ROADMAP.md)` tem as tarefas (`T-xx`), dependências, gates e status.
- **Este arquivo:** como trabalhar no repositório. Pastas com regras próprias têm um `AGENTS.md` aninhado, que complementa este e prevalece no que for mais específico.



## Como trabalhar uma tarefa

1. Leia a linha da tarefa no `ROADMAP.md` e o registro de handoff das tarefas de que ela depende.
2. Leia só as seções da SPEC ligadas aos requisitos citados. Não leia a spec inteira por hábito.
3. **Antes de editar código**, apresente um plano curto e espere confirmação: arquivos a criar ou mudar, o que fica fora, como vai provar. O mesmo plano vai para a descrição do PR.
4. Testes primeiro, nas tarefas que entregam comportamento (RF ou RNF). Tire o `test.fixme` dos cenários da tarefa, ou escreva os testes a partir dos critérios de aceite da SPEC §3, §4 e §11. **Rode-os e mostre que falham antes de implementar**: um teste que já passa sem o código não prova nada.
  - Exceções: spikes (T-03, T-04) provam com o doc em `specs/spikes/`; tarefas de infraestrutura (T-01, T-02, T-05, T-13) provam com o comando ou o pipeline rodando e com a saída colada no PR. Não invente testes artificiais para elas.
5. Implemente até os testes e os gates ficarem verdes.
6. Feche: tarefa `concluída` e linha de handoff no `ROADMAP.md`; `SPEC.md` atualizado se o comportamento mudou; tudo no mesmo PR.

Uma tarefa = um PR, num branch `t-XX-descricao-curta`. Trabalho descoberto no caminho vira tarefa nova no roadmap, não escopo extra.

## Comandos


| Para                   | Comando                                                                        |
| ---------------------- | ------------------------------------------------------------------------------ |
| Servidor de dev        | `pnpm dev` (localhost:4321). Não gera notebooks iframe; o modo inline funciona |
| Gerar notebooks leves  | `uv run scripts/build-notebooks.py` (com cache por hash)                       |
| Rodar como em produção | `pnpm build && npx wrangler dev` (localhost:8787)                              |
| Build completo         | `pnpm build` (notebooks → Astro → Pagefind)                                    |
| Build com rascunhos    | `SHOW_DRAFTS=true pnpm build`                                                  |
| Lint e tipos           | `pnpm lint` · `pnpm astro check` · `uv run ruff check`                         |
| Notebooks              | `uv run marimo check --select MW <arquivo.py>`                                 |
| Testes unitários       | `pnpm vitest run`                                                              |
| Testes E2E             | `pnpm playwright test` (contra `astro preview` do build de produção)           |
| Notebook pesado        | `uv run scripts/build-notebooks.py --heavy <slug>` (ver "Pare e pergunte")     |


Sempre `pnpm`, nunca `npm` ou `yarn`. Sempre `uv run`, nunca `python` ou `pip` direto: o export WASM do marimo depende das dependências que o uv resolve.

## Mapa

```text
specs/                  SPEC, ROADMAP, spikes/, adr/ (só ADRs substituídos)
src/site.config.ts      título, URL (SITE_URL) e autor (não existe collection de autores)
src/content.config.ts   collection `posts` com schema Zod 4
src/content/posts/<slug>/index.mdx   cada post é uma pasta: texto, capa, figs/, data/, notebooks/
src/components/ui/      .astro estáticos
src/components/viz/     .svelte com D3 (AGENTS.md próprio, criado antes da T-19)
src/components/marimo/  MarimoRuntime.astro, MarimoFrame, RunOnGpu (AGENTS.md próprio, criado antes da T-14)
src/integrations/headers.ts   gera dist/_headers no build (CSP por rota)
src/lib/                getPublishedPosts, readingTime, seo
scripts/build-notebooks.py
exports/<slug>/<nome>/  exports pesados commitados + export.lock (não editar à mão)
public/notebooks/       gerado no build; fica no .gitignore
tests/                  vitest (unit) e playwright (e2e)
```



## Convenções

- **Commits:** Conventional Commits citando o requisito, ex.: `feat(post): TOC com seção ativa [RF-05]`.
- **Branches:** `main` é produção; toda mudança entra por PR com preview.
- **Componentes:** `.astro` para tudo que é estático; `.svelte` só quando houver estado no cliente. Hidratação padrão `client:visible`; `client:load` exige justificativa no PR.
- **Conteúdo:** as páginas acessam posts só por `getPublishedPosts()`, nunca por `getCollection('posts')` direto (é o que esconde rascunhos quando `SHOW_DRAFTS` não é `true`).
- **Slug:** é o `id` da entrada, gerado pelo `generateId` do loader (nome da pasta). Não recalcule slug nas páginas.
- **Nomes:** identificadores de código em inglês; texto visível e rotas em pt-BR (`/sobre`, `/tags/[tag]`). Exceções fixadas na SPEC: `/blog/[slug]` e `/page/[n]`.
- **Alias:** `~/` aponta para `src/`.
- **Dados de gráfico:** importados no MDX a partir de JSON/CSV da pasta do post; nada de `fetch` em runtime. Datas chegam como string ISO e o componente converte.
- **Notebooks:** inline é `{ mode: inline }` sem `src`, e as células são as fences ````python marimo`do`index.mdx`; iframe é` { mode: iframe, src, compute }`. Detalhes na SPEC §6 e §7.



## Armadilhas de versão

A stack é recente e a sintaxe antiga ainda domina o que os modelos viram. Antes de usar uma API de que não tem certeza, consulte a documentação atual (Context7 ou web); não invente flags nem opções. Se a SPEC citar uma API que a doc atual contradiz, pare e avise em vez de seguir a SPEC.

- **Astro 7** (não 6: a doc do 6 está congelada)
  - Markdown e MDX passam pelo processador `unified()` de `@astrojs/markdown-remark`: em `markdown.processor` e em `mdx({ processor: unified({...}) })`. O padrão do Astro 7 é o Sätteri, que não roda plugins remark/rehype. `markdown.remarkPlugins` e `markdown.rehypePlugins` estão depreciados: não use.
  - O compilador Rust recusa tags não fechadas e não corrige aninhamento inválido (nada de `<div>` dentro de `<p>`).
  - `compressHTML: 'jsx'` é o padrão: o espaço entre elementos inline some. Use `{" "}` onde o espaço importa.
  - `src/fetch.ts` é nome reservado. Não crie esse arquivo.
  - Collections em `src/content.config.ts` com `loader: glob({ ..., generateId })`, não em `src/content/config.ts`.
  - `z` vem de `astro/zod`, não de `zod`. Para renderizar, `render(entry)` importado de `astro:content`, não `entry.render()`.
- **Zod 4:** `z.url()`, não `z.string().url()`; `{ error: '...' }`, não `{ message: '...' }`; `z.strictObject()` em vez de `.strict()`.
- **TypeScript:** fica em 6.x. O 7 ainda quebra `astro check` e `typescript-eslint` (peers `^5 || ^6`). Só subir quando os dois suportarem; confira os peers antes.
- **Svelte 5:** runes (`$props()`, `$state`, `$derived`, `$effect`). Eventos como atributo (`onclick`), não `on:click`. Nada de `export let`, `createEventDispatcher` ou stores para estado local.
- **Tailwind v4:** configuração no CSS (`@import "tailwindcss"`, `@theme`, `@plugin "@tailwindcss/typography"`), integrada pelo plugin `@tailwindcss/vite`. Não existe `tailwind.config.js` e não se usa `@astrojs/tailwind`.
- **D3 v7:** importe módulos avulsos (`d3-scale`, `d3-shape`, `d3-array`, `d3-format`), nunca o pacote `d3`. O DOM é do Svelte: `d3-selection` não cria nem altera elementos (exceção: `d3-zoom`/`d3-drag` via action).
- **Cloudflare:** o site roda em **Workers com Static Assets** (`wrangler.jsonc`, `assets.directory: ./dist`). Não é Pages: nada de `wrangler pages deploy` nem `@astrojs/cloudflare` (o site é estático, sem adapter).
- **mdx-marimo no Astro:** o runtime é um custom element, carregado por `<script type="module">` a partir de `@marimo-team/mdx-marimo/element/auto?url`, mais `@marimo-team/mdx-marimo/styles.css`. Não use React nem `@astrojs/react` para ele.
- **marimo:** versão travada no `uv.lock`. Dados de notebook são lidos com `mo.notebook_location()`. Notebook com `compute` diferente de `browser` só existe em `mode: iframe`. Cache e pré-cômputo usam `cache_cells = true`, `--execute` e `@mo.persistent_cache(method="lazy")`; `method="pickle"` não empacota bem para WASM.
- **CSP e** `_headers`**:** o arquivo é gerado no build (`src/integrations/headers.ts`); não edite `dist/_headers` nem crie `public/_headers`. Na Cloudflare, header repetido em regras que casam com a mesma URL tem os valores unidos por vírgula, ou seja, vira duas CSPs. Para trocar a CSP de uma rota, a regra precisa de `! Content-Security-Policy` antes da nova. Limite de 100 regras. `wasm-unsafe-eval` só nas rotas com notebook. Iframes de notebook são do mesmo domínio: use `frame-ancestors 'self'`, não `X-Frame-Options: DENY`.



## Pare e pergunte

Não faça sem pedido explícito:

- Mudar uma decisão da SPEC §5 (ADRs) ou um requisito. Proponha a mudança no PR e espere.
- Relaxar um budget (Lighthouse, size-limit), a CSP ou um teste. Teste errado é motivo para parar, não para editar o teste.
- Adicionar dependência (npm ou Python) **fora da lista pré-aprovada da SPEC §9**. As da lista podem ser instaladas na versão estável atual.
- Subir a versão maior de Astro, Svelte, Tailwind, Zod ou marimo.
- Fazer deploy de produção. Produção só sai pelo CI, no merge em `main`.
- Rodar `build-notebooks.py --heavy`: executa treino e pode levar muito tempo.
- Editar à mão `export.lock`, `exports/`, `public/notebooks/` ou `dist/`: são gerados.
- Dar push direto em `main` ou force-push.



## Definition of Done

- [ ] Requisitos citados no PR e na mensagem de commit.
- [ ] Testes do nível adequado escritos, vistos falhando antes e passando depois (spikes e infra: prova pelo doc de spike ou pela saída do pipeline).
- [ ] Lint, tipos, testes e budgets verdes no CI.
- [ ] Preview revisado em mobile (360 px) e desktop.
- [ ] `ROADMAP.md`: tarefa `concluída`, linha de handoff e, se for o caso, status do gate.
- [ ] `SPEC.md` atualizado se o comportamento mudou.