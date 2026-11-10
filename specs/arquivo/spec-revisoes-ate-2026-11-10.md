# Registro de revisões da SPEC até 10/11/2026

Arquivo, só leitura. Revisões até a Revisão 4 de 10/11/2026, movidas sem mudança do topo de `specs/SPEC.md` na reestruturação de 10/11/2026.

**Revisão 4 de 10/11/2026:** a T-21 foi cancelada. O blog não foi lançado, e o post B é a fixture provisória das figuras: os cenários "Gráfico acessível" e "Figura estática" da §11 já são testados nas provas da T-72, da T-19 e da T-20 que estão nele, e o Gate 2a foi aprovado contra elas. A §8 passa a dizer que a prova da T-19 fica sem moldura até a T-39, que tira as provas do post B; a §11 diz onde cada um dos dois cenários é testado.

**Revisão 3 de 10/11/2026:** a §8 fixa os primeiros exploráveis (T-20). O `Figure.astro` ganha o modo island (prop `island`): não desenha `svg` nem grade, e o island entra direto na `<figure>`, antes da `<figcaption>`, que segue como último filho; o `svg` raiz, a grade e os controles são do `.svelte`. O `Stepper` e o `Explorable` só existem com `client:visible`, com os controles `disabled` no HTML do build. O `Heatmap` pinta a intensidade em tinta, com `fill-opacity` em cinco degraus, e destaca a linha com um contorno em `accent`; o `d3-scale-chromatic`, que devolve cores fora dos tokens, sai da tabela da biblioteca. A troca de cor tem transição curta, desligada com `prefers-reduced-motion`. O cenário "Gráfico acessível" da §11 troca o `<LineChart>` por um explorável.

**Revisão 2 de 10/11/2026:** a §8 fixa os dados pré-calculados (T-73). O `scripts/build-data.py` roda na máquina do autor, lê as entradas de `data/raw/`, grava o JSON reduzido em `data/` e o `data/data.lock` com o SHA-256 de cada entrada e de cada saída; o `pnpm check:data`, dentro do `pnpm lint`, refaz os hashes e falha com dado desatualizado, sem rodar Python no CI. O RNF-09 passa a cobrir o dado desatualizado; a §6 descreve a pasta `data/`; a §7 alinha o `export.lock` ao formato do `data.lock`; a §9 diz como o script trava dependência; a §10 põe o `check:data` no lint.

**Revisão de 10/11/2026:** a §8 fixa a moldura da figura estática (T-72). O `Figure.astro` é dono do `svg` raiz: `data-viz`, `role="img"`, `aria-label`, `<title>` e a grade milimetrada. A legenda, numerada pela prop `number`, é o último filho da `<figure>`; o "Ver dados" vem num `<details>` logo depois dela, fora da legenda, que dá o nome acessível da figura. A proporção fica reservada pelo `viewBox` e pelos atributos `width` e `height`, e a figura só encolhe. As primitivas `Vector`, `Matrix`, `Tensor`, `Arrow` e `Grid` são `.svelte` que desenham um `<g>` no sistema de coordenadas da raiz e entram autocontidas no slot do `Figure`: filhos do MDX para um `.svelte` chegam embrulhados em `astro-static-slot`, que não desenha dentro de um `svg`. O exemplo do `LineChart` perde o `<figure>` e a `<figcaption>`, que agora são do `Figure`. A figura de prova da T-19 segue sem moldura até a T-21; como o `Figure` emoldura um island que traz o próprio `svg` fica para a T-20.

**Revisão 2 de 09/11/2026:** o RNF-02 troca o `size-limit` pela conta por island no `check:js`: cada `astro-island` soma o componente, o renderer e os imports estáticos, até 40.000 bytes gzip, e os scripts inline do island contam no JS inicial da página. A §8 fixa o teto de 1.000 elementos por figura, com `data-viz` no `svg` raiz e verificação no E2E, e troca no contrato o `var(--viz-1)`, que não existe na lista fechada de cores, pela classe do token. O cenário "Figura estática" da §11 passa a exigir a figura fora de um `astro-island`, e não a página inteira sem island, porque o post da T-21 tem figura estática e explorável. A §9 tira o `size-limit` da lista pré-aprovada (T-19).

**Revisão de 09/11/2026:** a escada de interatividade usa o degrau mais baixo que explica o conceito. No artigo: 0 texto e fórmula, 1 figura estática (SVG no build, 0 JS), 2 figura em passos (Anterior/Próximo, no lugar de GIF) e 3 explorável (island Svelte com `client:visible` e dados pré-calculados). Fora do artigo: 4 notebook marimo e 5 GPU (`gpuUrl`). O mesmo componente de `src/components/viz/` sem `client:*` é figura estática e com `client:visible` é explorável. A Fase 2 se divide em 2a (storytelling visual) e 2b (lab marimo). O notebook sai do artigo e vira a página inteira em `/notebooks/<slug>/<nome>/`, aberta pela barra do lab; sem iframe, sem pôster e sem "Ativar interatividade" no post. O RF-08 continua Must só para `compute: browser`; os pesados ficam para depois do lançamento (T-17, T-33). O ADR-02 foi substituído; o texto anterior está em `specs/adr/ADR-02-v2-iframe.md`. A implementação é das tarefas da Fase 2a e 2b; até elas, o site segue o comportamento anterior (T-71).

**Revisão 3 de 06/11/2026:** a §9 fixa um só `katex` no lock: um `overrides` no `pnpm-workspace.yaml` leva o `rehype-katex` e o `remark-math` à versão do `katex` direto, a mesma do CSS e das fontes do KaTeX (T-68).

**Revisão 2 de 06/11/2026:** o RF-01 ganha a lateral da home: de `lg` em diante, na home e nas páginas de tipo, a saudação fica numa coluna sticky de 15rem à esquerda, com a mão acima do `h1` e os links do autor em texto (RSS, GitHub e LinkedIn); abaixo de `lg`, fica em cima da barra. A §6 troca os placeholders `github` e `huggingface` de `src/site.config.ts` pelas URLs do GitHub e do LinkedIn (T-69).

**Revisão de 06/11/2026:** o RF-12 define o `<title>` da página de tipo, `Tipo: <rótulo> · {site.title} · {autor}`, e a §6, a descrição e o nome acessível da lista dela, e tira da barra o ícone de cada tipo, que fica com o nome e a contagem. O rascunho de teste passa a `kind: tutorial`, para o cenário de rascunhos provar que tipo só com rascunho não gera página nem entra na barra. A §9 acrescenta `/tipos/[tipo]` às rotas, a página de tipo e o `KindFilter` à árvore, e a primeira página de tipo à guarda de fontes, com o teto da home; a §10 acrescenta `/tipos/*` ao plano B (T-64).

**Revisão 5 de 05/11/2026:** a §9 dá às fontes do KaTeX um teto próprio na guarda de fontes, de 3 arquivos e 48.000 bytes por página, separado do teto das fontes da marca, que não muda. A URL de pior caso com fórmula no Lighthouse CI fica para a T-39 (T-61).

**Revisão 4 de 05/11/2026:** na §6, a área de apêndice fica fora do `article`, logo depois dele, numa `section` com nome acessível `Apêndice`; a lista de referências é um `ol` nativo, e só o título de cada referência é link (T-66).

**Revisão 3 de 05/11/2026:** no RF-04, o título aparece acima da lateral quando o `h1` e a linha fina saem da tela, e não mais quando só o `h1` sai. Com o título acima da lateral, a troca no `h1` o punha sobre a linha fina ainda visível (T-67).

**Revisão 2 de 05/11/2026:** a §9 troca o `Toc` pelo `PostRail` na árvore de componentes, e o exemplo de commit, que citava o RF-05 removido, passa a citar o RF-04 (T-65).

**Revisão de 05/11/2026:** a §9 troca a Cormorant Garamond pela IBM Plex Sans Condensed na fonte de display: 600 normal, fallback `sans-serif`, sem itálico; saem a Cormorant 500 e 600 itálico (T-60).

**Revisão 3 de 04/11/2026:** a revisão visual da T-63 troca a barra "Filtrar por tag" pela "Filtrar por tipo", com páginas `/tipos/<tipo>/` que espelham a home (RF-02 e §6). O RF-05 sai: o post não tem mais sumário, e o cabeçalho ganha uma lateral com o fólio, os metadados e o título ao rolar (RF-04). A área de apêndice sai do `div` da prosa, e cada referência traz o título antes dos autores (§6). A v1 passa a ter 11 requisitos Must. A implementação é das T-64, T-65 e T-66; até elas, o site segue o comportamento anterior.

**Revisão 2 de 04/11/2026:** o RF-04 troca a ficha da seção 9.3 do BRAND por referências e apêndices no fim do post. Saem do schema da §6 `benchMinutes`, `material` e `track`; entram `references` e `appendices`. A citação `[@chave]` vira `[n]` pelo plugin `remarkCitations`, registrado nos dois `unified()` da §7 (T-62).

**Revisão de 04/11/2026:** a §10 registra que o `pnpm lint` começa pela guarda de codificação de `src/`, `pnpm check:utf8` (T-59).

**Revisão de 03/11/2026:** a §9 corrige o custo das fontes no LCP: ele segue os bytes e a página, e não um degrau por arquivo, e as fontes do KaTeX também entram (T-54).

**Revisão 3 de 30/10/2026:** a árvore da marca na §9 ganha `pklog-simbolo-404.svg`, a ilustração da página 404 (T-58).

**Revisão 2 de 30/10/2026:** o RF-12 define o `<title>` da página 404 e registra que ela não tem canonical nem `og:url` e leva `noindex` (T-49).

**Revisão de 30/10/2026:** o RF-06 registra que o `aria-label` do botão de copiar acompanha o texto visível (WCAG 2.5.3) e que a barra do bloco de código sai do build; a §7 cita o transformer da barra (T-48).

**Revisão 4 de 29/10/2026:** o card da listagem mostra fólio, data, título, resumo, tipo, nível e tempo de leitura com ícone de relógio parado, sem tags; só o destaque mostra capa; o número do fólio é Cormorant 600 desde 22 px; título do card sem sublinhado (T-56).

**Revisão 3 de 28/10/2026:** a data visível tem dia com dois dígitos e mês de uma lista fixa (`formatPubDate`); `formatFolio` mostra o número inteiro acima de 999; os rótulos e a hachura de nível ficam em `src/lib/level.ts`. A ficha do RF-04 é entregue pela T-55 (T-46).

**Revisão 2 de 28/10/2026:** o schema da §6 entrou no `content.config.ts` (T-45). `kind` usa `KINDS` de `src/lib/kind.ts`, os rótulos ficam em `KIND_LABELS`, a unicidade é `assertUniqueFolios` em `src/lib/folio.ts` e o rascunho de teste é Fól. 999.

**Revisão de 28/10/2026:** os literais `pk.log`, `Pedro Knoll` e a descrição curta entraram no `site.config.ts` na T-43.

**Revisão de 27/10/2026:** a §9 restringe a IBM Plex Mono ao peso 400 e registra o orçamento de fontes no LCP (T-52).

**Revisão 3 de 26/10/2026:** a §9 descreve as fontes da marca pela opção `fonts` no topo do `defineConfig`, com preload só de IBM Plex Sans 400 normal.

**Revisão de 26/10/2026:** o RNF-01 descreve o perfil do Lighthouse CI. O `size-limit` por island vai para a T-19. `linkinator` entra na §9. A §10 ganha os jobs `lighthouse` e `artifact-checks`, e o deploy em `main` passa a esperar os dois (T-13).

**Revisão 2 de 26/10/2026:** os temas `pk-claro` e `pk-escuro` do Shiki entram na T-41, não na T-48 (contraste sobre `sheet`).

**Revisão de 23/10/2026:** o `<title>` do post é o título do post. Home `{site.title} · {autor}`, post `{título} · {site.title} · {autor}`, `/page/n/` `Blog — página N · {site.title} · {autor}`, tag `Tag: <tag> · {site.title} · {autor}`. `og:image` e `image` do JSON-LD só existem quando há capa, até a T-23. `robots.txt.ts` entra na árvore da §9, ao lado de `rss.xml.ts`.

**Revisão de 22/10/2026:** identidade pk.log em `specs/BRAND.md` (Q12), Fase 1b no ROADMAP, RF-22 e campos `folio`, `kind` e `level` no schema.

**Revisão 2 de 15/10/2026:** detach de CSP validado em Workers Static Assets (T-05). A regra de cache de notebooks usa `/notebooks/:slug/:nome/assets/*`. A CSP de notebook leva hashes dos scripts inline, calculados no build. A v1 não tem interrupts. Gate 0 aprovado. Ver `specs/spikes/T-05-headers.md`.

**Revisão de 15/10/2026:** `compute: cache` não funciona no marimo 0.25.1 para notebooks que treinam com `torch`, ver T-04 e `specs/spikes/T-04-html-wasm.md`. Os exemplos passam a usar `precomputed`, a validar na T-33.

**Revisão de 14/10/2026:** o modo inline foi adiado por custo de manutenção (T-03). O blog fica só com notebooks marimo em iframe. O ADR-02 foi substituído; o texto anterior está em `specs/adr/ADR-02-v1-mdx-marimo.md`. Detalhes em `specs/spikes/T-03-mdx-marimo.md`.

**Revisão de 09/10/2026:** removidas as menções a `authors` e "autores" que contradiziam a Q2; Q4b reaberta (o domínio não está confirmado); o build chama o Python via `uv run`; os dois diagramas viraram Mermaid; o roadmap (seção 12) foi movido para `specs/ROADMAP.md`.

**Revisão 2 de 09/10/2026 (conferida nas docs oficiais):**

- ADR-01 passa de Astro 6 para **Astro 7**, com Markdown e MDX pelo processador `unified()`. O ADR antigo foi para `specs/adr/`.
- O modo inline (adiado em 14/10/2026) usava o runtime em custom element do mdx-marimo, sem React.
- O notebook inline (adiado em 14/10/2026) era declarado só com `{ mode: inline }`, sem `src`.
- Schemas atualizados para a API do Zod 4.
- `_headers` passa a ser gerado no build, com o limite de 100 regras.
- Exports pesados ficam em `exports/`.
- `SHOW_DRAFTS` substitui `PUBLIC_SHOW_DRAFTS`.
- `SITE_URL` destrava a T-12 enquanto a Q4b não fecha.
- Contrato do `LineChart` aceita datas ISO.
- Dependências pré-aprovadas listadas na seção 9.
