# Roadmap

A ordem de implementação do blog. O **quê** está em `SPEC.md`; aqui ficam as tarefas, as dependências entre elas, os gates e o status. Este arquivo muda a cada PR; a spec muda raramente.

## Como usar

1. Pegue a primeira tarefa `pendente` cujas dependências estejam todas `concluída`. Uma fase só começa depois que o gate da anterior estiver `aprovado`, salvo quando a coluna Depende de cita um gate anterior.
2. Marque-a `em andamento` no primeiro commit do PR. Branch: `t-XX-descricao-curta`.
3. Leia só as seções da SPEC ligadas aos requisitos citados na tarefa.
4. Ao fechar o PR, marque `concluída` e acrescente a entrada no [Registro de handoff](#registro-de-handoff), no mesmo PR: 1 linha na tarefa leve, até 3 na completa (AGENTS.md, Trilhas). O detalhe da tarefa fica na descrição do PR.
5. Se a tarefa revelar trabalho novo, adicione uma tarefa nova com o próximo ID livre; não amplie a tarefa atual.
6. O PR que cumpre o último critério de um gate também muda a linha **Status do gate** para `aprovado (AAAA-MM-DD)`.

Posts não são tarefas e não entram aqui: seguem a trilha Post do AGENTS.md (RNF-14).

Status de tarefa: `pendente`, `em andamento`, `concluída`, `bloqueada (motivo)`, `cancelada (motivo)`. Status de gate: `pendente`, `aprovado (data)`.

```mermaid
flowchart LR
  F0["Fase 0<br/>Fundação e spikes<br/>~1 semana"] --> G0{"Gate 0"}
  G0 --> F1["Fase 1<br/>Blog core<br/>~2 semanas"] --> G1{"Gate 1"}
  G1 --> F2a["Fase 2a<br/>Storytelling visual"] --> G2a{"Gate 2a"}
  G2a --> F2b["Fase 2b<br/>Base para conteúdo"] --> G2b{"Gate 2b"}
  G2b --> F2c["Fase 2c<br/>Cadernos marimo"] --> G2c{"Gate 2c"}
  G2c --> F3["Fase 3<br/>Lançamento"] --> G3{"Gate 3<br/>lançamento"}
  G3 -.-> F4["Fase 4<br/>Pós-lançamento"]
  F1 -.-> F1b["Fase 1b<br/>Identidade<br/>sem gate"]

```





## Resumo dos gates

As Fases 0 a 3 estão fechadas, com todas as tarefas `concluída` ou `cancelada`. As tabelas, os critérios de cada gate e as notas das fases estão em [`specs/arquivo/roadmap-fases-0-a-3.md`](arquivo/roadmap-fases-0-a-3.md), e o handoff das tarefas, nos arquivos `handoff-*` da mesma pasta.

| Fase | Nome | Gate |
| --- | --- | --- |
| 0 | Fundação e spikes | aprovado (2026-10-15) |
| 1 | Blog core | aprovado (2026-10-26) |
| 1b | Identidade | sem gate |
| 2a | Storytelling visual | aprovado (2026-11-10) |
| 2b | Base para conteúdo | aprovado (2026-11-14) |
| 2c | Cadernos marimo | aprovado (2026-11-16) |
| 3 | Lançamento | aprovado (2026-11-18) |

## Fase 4 — Pós-lançamento

A Fase 4 vem da Q17 (Should e Could depois do lançamento) e da Q20 (T-106): é o mapa do trabalho depois do Gate 3. Não tem gate, como a Fase 1b.

A ordem é T-106, T-107, T-108, T-109, T-110, T-111, T-112, T-113, T-114, T-115, T-26, T-23, T-22, T-76, T-24, T-116, T-28 e T-31. Por gatilho: a T-89 antes do primeiro post com math além do teto do KaTeX, a T-86 por volta do 7º post publicado, e a T-83 e a T-95 em folgas.

Posts novos são publicados depois da T-110, para o frontmatter não migrar duas vezes.

| ID | Tarefa | Requisitos | Depende de | Status |
| --- | --- | --- | --- | --- |
| T-106 | Decisões de produto da Fase 4 (Q20) e mapa da fase no ROADMAP. Tarefa leve, só docs. Fora: código, o arquivamento (T-107) e o texto que descreve o site como ele é hoje | RF-13, RF-14, RF-15, RF-18, RF-20, RF-23, RF-24, SPEC §1, §2 | Gate 3 | concluída |
| T-107 | Arquivar em `specs/arquivo/` as notas de revisão da SPEC (fica só a mais recente) e, do ROADMAP, as Fases 0 a 3 e os handoffs desde 10/11. O ROADMAP fica com o "Como usar", o resumo dos gates e a Fase 4. Fora: a Fase 4. Tarefa leve, só docs; prova: o texto movido sai igual | RNF-12 | T-106 | concluída |
| T-108 | Limpeza sem mudar comportamento. Sai o CSS do ícone do lab em `src/styles/global.css` (`.pkl-q0` a `.pkl-q2`, `@keyframes pkl-b0` a `pkl-b2` e o bloco de `prefers-reduced-motion` deles, sem uso desde a T-98); sai `public/notebooks/` do `.gitignore` e do `eslint.config.js`, e sai o `.cursorignore`, com a linha dele na árvore da SPEC §9; saem os exports sem uso `binaryExtensions` e `HEAT_OPACITY`, usados só no próprio arquivo, e `siteBio` e `separator`, de `tests/e2e/site-literals.ts`; sai a Caveat de `astro.config.mjs`, do `<Font>` do `BaseLayout.astro`, do `--font-hand` do `global.css`, dos testes de fonte, da SPEC §9 (fontes), do AGENTS (Fontes) e da BRAND §5 e §13. Fora: qualquer outra face. Tarefa leve. Prova pelo `dist/`: as páginas só trocam o nome do CSS e o `@font-face` da Caveat, e saem os 2 arquivos de fonte dela | RNF-12 | T-106 | pendente |
| T-109 | Revisão visual com mockups fora do repositório, como a T-63; o PR só muda `specs/`. Decide o card, o que a home lista, as listas de artigos e de protótipos e as rotas delas, se o tema tem página, a interface do filtro, o lugar da busca, o header e o footer, a "Comece aqui", o compartilhar, a área da newsletter, o layout da imagem OG, e a cor e o ícone dos tipos novos. Grava na BRAND (§8, §9) e nos critérios de aceite dos RF afetados. Fora: código | RF-01, RF-02, RF-14, RF-15, RF-16, RF-23, RF-24, BRAND §8, §9 | T-106 | pendente |
| T-110 | Modelo de conteúdo. O `kind` passa a `article`/`prototype`, com rótulos e slugs, e entra o `theme` obrigatório, com slug gerado e a falha de build para grafias que colidem. Migra os posts publicados, as 4 fixtures e o rascunho `2026-10-rascunho-de-teste` (hoje o único `tutorial`, e prova que tipo só com rascunho não gera página). A skill `novo-post` passa a perguntar o tema. Saem os ícones dos tipos atuais (animados e parados), os keyframes `pkc-*`, `pkt-*` e `pkp-*`, os tokens `kind-*` e o teste C6 do `card.spec.ts`; os ícones animados nunca são renderizados desde a T-67. Atualiza a SPEC §6 (schema, regras e as menções a `src/data/tags.ts`), a BRAND §8 e o AGENTS (Mapa e Cores). Fora: o card e as listas (T-111) | RF-01, RF-02, RF-04, SPEC §6 | T-109 | pendente |
| T-111 | Card e listas: no card, o tema no lugar do tipo e sem o resumo; a home e as listas de artigos e de protótipos, sem paginação nas listas, com as páginas de tema se a T-109 decidir. A barra "Filtrar por tipo" e as páginas `/tipos/` dão lugar às listas. Atualiza o RF-01, o RF-02 e o RF-12. Fora: o filtro (T-112) | RF-01, RF-02, RF-12 | T-110 | pendente |
| T-112 | Filtro por tema e por tag nas listas completas, por script do próprio site, com a escolha gravada na URL. Sem JavaScript, a lista inteira e os links das páginas de tag. Conta no `check:js` (RNF-02). Fora: a busca (T-22) | RF-02, RNF-02, RNF-04 | T-111 | pendente |
| T-113 | Header e footer, pela revisão da T-109. Fora: a página "Comece aqui" (T-114) e a área da newsletter (T-116) | BRAND §9 | T-109 | pendente |
| T-114 | Página "Comece aqui": estrutura definida na própria tarefa, sem link para o GitHub, com o link no header. A rota sai da T-109. Fora: a newsletter | RF-14 | T-110, T-113 | pendente |
| T-115 | Compartilhar no fim do post: X, LinkedIn e e-mail por links com o título e a URL, sem script de terceiro, e "Copiar link" por script do próprio site. Conta no `check:js` (RNF-02). O lugar no fim do post sai da T-109 | RF-23, RNF-02 | T-109 | pendente |
| T-26 | Posts relacionados pelo tema, com as tags para desempatar: até 3 do mesmo tema, nunca o próprio | RF-18 | Gate 3, T-110 | pendente |
| T-23 | Imagens OG geradas no build. A capa do autor ganha quando existe. Sem capa, o PNG segue a seção 11 do BRAND. Os SVG vêm da T-40, pela T-45. O desenho usa a fonte de display, IBM Plex Sans Condensed 600 (T-60), achada pelo `fontData`. Rasterizar com `sharp` é hipótese a provar na tarefa, inclusive se as fontes da marca existem no CI. Se a hipótese falhar, a tarefa para e pergunta. Sem Satori enquanto ninguém aprovar a dependência | RF-16 | Gate 3, T-12, T-42, T-45, T-109, T-110 | pendente |
| T-22 | Pagefind indexa só o corpo dos posts, sem backend, e pede `wasm-unsafe-eval` onde a busca roda, o que muda o RNF-07 e o teste "rota sem notebook". O lugar da busca sai da T-109. Fora: indexar título, resumo ou outras páginas | RF-15, RNF-07 | Gate 3, T-109, T-110 | pendente |
| T-76 | Cores das figuras de `src/components/viz/`. Na T-20, o autor quis rever as cores dos diagramas: folha nas células, prússia no destaque e tinta com transparência no mapa de calor (BRAND §9.8). Começa com mockup fora do repositório, com as figuras de prova do post B nos dois temas. Escopo: só as figuras; a prússia do site (links, foco, tipo Conceito) fica fora. Token novo é decisão de escopo na lista fechada (BRAND §0, §4 e §9.8), com o contraste medido na BRAND §4 e o T1 do `tests/e2e/theme.spec.ts` | RF-09, BRAND §4, §9.8 | Gate 3, T-20 | pendente |
| T-24 | Tema escuro com controle segmentado e sem flash; conferir os gráficos no escuro. A T-41 só declara as duas paletas. Até a T-24, nada no site aplica `data-theme` nem `prefers-color-scheme`. O controle é o segmentado da marca, com `localStorage`. O script inline entra sozinho na CSP: os hashes saem do build desde a T-16 | RF-17 | Gate 3, T-07, T-19, T-41, T-48, T-76 | pendente |
| T-116 | Newsletter: escolher o provedor (Beehiiv ou Kit), o formulário, a CSP (`form-action`) e o DNS (SPF e DKIM do provedor no lugar do `v=spf1 -all`, se existir). Atualiza a §1, o RNF-06 e o RNF-11. O lugar sai da T-109 | RF-24, RNF-06, RNF-11 | T-109 | pendente |
| T-28 | Giscus para comentários e reações, com carregamento lazy. A tarefa terá de decidir: a CSP de hoje (`default-src 'none'`, sem `frame-src`) bloqueia o iframe; o script de outra origem fere o RNF-06 e o `check:js`; rever o `Permissions-Policy` | RF-19 | Gate 3, T-109 | pendente |
| T-31 | Avaliar o ganho de trocar as Version URLs com alias pelo Workers Previews (`wrangler preview`), num spike com doc em `specs/spikes/`; a troca, se valer, é tarefa nova | ADR-04 | Gate 3 | pendente |
| T-89 | Math além do teto do KaTeX. O teto de 3 arquivos e 48.000 bytes (SPEC §9, T-61) só admite juntos `KaTeX_Main-Regular`, `KaTeX_Math-Italic` e `KaTeX_Size2` (47.920 bytes), e a `fixture-formulas` (T-87) está nele. Na T-87, uma variante com `\mathbf`, `\mathbb`, `\mathcal`, `\textit`, `\sum` inline e `\left…\right` alto pediu 9 arquivos do KaTeX (135.612 bytes, no clone do revisor), e um só `\sum` inline pede a `KaTeX_Size1` e leva o KaTeX a 4 arquivos e 53.388 bytes, que a guarda reprova. Antes do primeiro post com essa math, medir o custo de uma fixture com ela e decidir o teto, sem relaxar o RNF-01. Desde a T-94, o Lighthouse 13.6.0 não põe os arquivos de fonte no LCP simulado dos posts (o LCP é igual ao FCP, cerca de 905 ms no CI): a T-89 escolhe como medir esse custo. Sem dependência fora da SPEC §9 | RNF-01 | Gate 3, T-87 | pendente |
| T-86 | Escala do job `lighthouse` com o número de posts. Na T-77, o passo `Lighthouse` do CI foi de 1 min 42 s, com 9 execuções, para 2 min 53 s, com 15: cerca de 11,5 s por execução. Com 5 execuções por URL, cada post publicado soma cerca de 1 min, e o job tem `timeout-minutes: 15`. Por volta do 7º post publicado (antes do 10º, para ter folga), medir de novo e decidir como o job acompanha o número de posts, sem relaxar o RNF-01 nem tirar post da lista (RNF-14). Mudança de CI | RNF-01, RNF-14 | Gate 3, T-77 | pendente |
| T-83 | Higiene do `tsconfig.json`. O `baseUrl` está depreciado no TypeScript 6 e deixa de funcionar no 7; é o único warning do `pnpm check:svelte` (T-75). Tirar o `baseUrl` sem quebrar o alias `~/` no Astro, no Vite, no `astro check` e no `svelte-check` (sem `baseUrl`, os `paths` começam com `./`; conferir na doc atual do TypeScript e do Astro). Excluir também `playwright-report/` e `test-results/`, que cabem no `include` e são a origem dos 183 hints locais do `astro check`. Prova: `pnpm check:svelte` sem warning, `pnpm astro check` sem hints dessas pastas e o `dist/` igual por hash | RNF-12 | Gate 3, T-75 | pendente |
| T-95 | Nomes de `/_astro/fonts/` pelo conteúdo e, então, cache longo nessa pasta. No Astro 7.3.8 e no 7.4.12, o nome de cada fonte remota é o xxhash da URL que a API do Fontsource devolve, e não dos bytes, e por isso a T-91 deixou a pasta fora do `immutable` (achado da T-91). A T-91 supôs essa URL com `@latest`; a T-93 mediu a URL com a versão do pacote (`…/ibm-plex-sans@5.3.0/latin-400-normal.woff2`): uma versão nova muda o nome, mas a forma da URL é escolha da API, e não do site. Fazer o nome mudar com os bytes (versão fixa ou arquivo local) e estender a regra de cache a `/_astro/fonts/`, sem relaxar o teto de fontes (SPEC §9) nem o RNF-01. Dependência nova só pela SPEC §9 | RNF-01 | Gate 3, T-91 | pendente |
| T-25 | Página Sobre e link "Editar no GitHub". Não espera a Fase 1b. Nome e bio vêm do `site.config` da hora; `pk.log`, `Pedro Knoll` e a descrição curta `Aprendizados e experimentos em IA` entram na T-43. Sem newsletter | RF-13, RF-14 | Gate 3, T-07, T-09 | cancelada (substituída pela T-114, "Comece aqui", sem link para o GitHub; Q20) |
| T-29 | Componente `<Embed>` para HF Spaces e iframes genéricos                                                 | RF-20      | Gate 3     | cancelada (sai do projeto; Q20) |
| T-32 | Reavaliar o modo inline adiado na T-03. Gatilho: mdx-marimo a partir de 0.1, ou uma opção pública para controlar Python e projeto no build | ADR-02 | Gate 3 | cancelada (sai do projeto: o caderno abre no molab, Q18; Q20) |
| T-33 | Spike `precomputed`: a partir do `treino.py` da T-04, treino dentro de uma função com `@mo.persistent_cache(method="lazy")` que retorna `numpy`. Prazo: meio dia. Pergunta única: as células dependentes funcionam no navegador? Se não, notebooks com `torch` ficam em `onnx` ou `static`. Atualiza a SPEC §7 com o resultado. | RF-08, SPEC §7 | Gate 3 | cancelada (o molab roda torch no servidor, T-96) |
| T-17 | Modo `--heavy`: export local em `exports/<slug>/<nome>/`, `export.lock`, upload ao R2 acima de 25 MiB, verificação de frescor no CI e cópia de `exports/` para `public/notebooks/` no build; falha o build se a saída do export tiver `Cache save failed`; o `export.lock` registra o `marimo`, o `numpy` do `--execute` e o `Pyodide` | RF-08, RNF-09, SPEC §7 | T-14, T-33, T-34 | cancelada (caderno pesado roda no molab com GPU, T-96) |

RF-21 (artigos da comunidade com login e upvote) fica fora: não combina com um blog pessoal.

## Próxima fase

| ID | Tarefa | Requisitos | Depende de | Status |
| --- | --- | --- | --- | --- |
| T-30 | i18n, se fizer sentido | P5 | Gate 3 | pendente |

## Registro de handoff

Uma entrada por tarefa concluída, escrita por quem a fechou: 1 linha na tarefa leve, até 3 na completa. Diz só o que a próxima tarefa precisa saber e não está óbvio no código; o resto fica na descrição do PR. Se o número do PR ainda não existir quando a entrada for escrita, use o nome do branch.

As entradas das Fases 0 a 3 estão em `specs/arquivo/`, em ordem de fechamento: as 50 escritas até 10/11/2026, da T-01 à T-20, em [`handoff-ate-2026-11-10.md`](arquivo/handoff-ate-2026-11-10.md), e as 29 de 10/11 a 18/11/2026, da T-75 à T-105, em [`handoff-2026-11-10-a-2026-11-18.md`](arquivo/handoff-2026-11-10-a-2026-11-18.md).

- **T-106** (2026-11-18, PR #92): Só docs. A Q20 grava as decisões da Fase 4; mudaram agora só os requisitos ainda não entregues (RF-13 e RF-20 removidos, RF-14, RF-15 e RF-18 reescritos, RF-23 e RF-24 novos), a §1 e frases já falsas; o RF-01, o RF-02, o RF-04, o RF-12, a §6, a §7, as fontes da §9, a §10 e os RNF mudam na tarefa que muda o comportamento, como cada linha da Fase 4 diz. A tabela da Fase 4 está na ordem de execução, para o item 1 do "Como usar" seguir a ordem; a T-30 foi para "Próxima fase", e a T-25, a T-29 e a T-32 foram canceladas.
- **T-107** (2026-11-18, `t-107-arquivar-docs`): Só docs. As 25 notas de revisão da SPEC (da Revisão 5 de 10/11 à Revisão 5 de 17/11), as Fases 0 a 3 do ROADMAP e os handoffs da T-75 à T-105 foram para `specs/arquivo/` (`spec-revisoes-2026-11-10-a-2026-11-17.md`, `roadmap-fases-0-a-3.md` e `handoff-2026-11-10-a-2026-11-18.md`), iguais byte a byte ao texto da `main` em `2aa9b99`; no lugar das fases, o ROADMAP tem o resumo dos gates (119 KB → 16 KB; a SPEC, 117 → 105 KB), e o passo 1 do "Como trabalhar" do AGENTS aponta para o arquivo, onde estão a linha e o handoff das dependências das tarefas da Fase 4.
