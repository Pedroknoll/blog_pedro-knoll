# Spec — Blog técnico estilo Hugging Face (Astro + marimo + Cloudflare)

Oct 6, 2026 · @Pedro Knoll · revisado em 28/10/2026

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

## 1. Visão geral

O produto é um blog técnico estático, no estilo do [Hugging Face Blog](https://huggingface.co/blog), em que cada post pode trazer notebooks marimo executáveis no navegador e visualizações interativas, servido pela edge da Cloudflare com custo de hospedagem perto de zero.

Este documento é a fonte de verdade da implementação (spec-driven): cada requisito tem um ID, cada tarefa do roadmap aponta para IDs, e nenhuma feature entra no código sem estar aqui primeiro.

### Objetivos

- Publicar posts em Markdown/MDX com a mesma ergonomia de leitura do HF Blog: listagem em cards, página de post com TOC, autor, tags e data.
- Permitir que um post embuta um notebook marimo interativo em iframe (Python no browser via WebAssembly), sem servidor Python em produção.
- Permitir gráficos D3 interativos encapsulados em componentes Svelte, hidratados só quando visíveis.
- Deploy automático a cada push, com preview por pull request.

### Não-objetivos (v1)

- Posts da comunidade com login, upvotes e comentários nativos (o HF tem; aqui fica para v2).
- CMS visual. A autoria é via Git.
- Execução de código Python no servidor ou GPU.
- Captura de e-mail (newsletter).
- Peças gráficas que não são o site (YouTube, rede, slide, certificado, pergaminho, adesivo).
- Manifesto PWA.

### Personas


| Persona    | Precisa de                                                     | Como mede sucesso                                              |
| ---------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| Leitor     | Ler rápido no celular, achar posts por tag, rodar o exemplo    | Página carrega em < 2 s em 4G; notebook roda sem instalar nada |
| Autor      | Escrever em Markdown e notebook, ver preview antes de publicar | Do `git push` ao preview em < 5 min                            |
| Mantenedor | Pouca manutenção, custo previsível                             | Build verde, US$ 0 de hospedagem no plano free                 |


### Métricas de sucesso

- Lighthouse ≥ 95 em Performance, Accessibility, Best Practices e SEO na home e num post sem notebook.
- JavaScript inicial ≤ 50 KB (gzip) em post sem islands.
- Notebook marimo interativo em ≤ 10 s em desktop banda larga (download do runtime Pyodide incluso).

## 2. Premissas e decisões em aberto

A spec parte de seis premissas; as respostas de 06/10, 09/10, 14/10 e 22/10 já estão incorporadas e só o domínio segue em aberto, então a Fase 0 pode começar já.

### Premissas assumidas


| #   | Premissa                                                                              | Por quê                                                                                                                                             | Se estiver errada                              |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| P1  | Site 100% estático (`output: 'static'`), sem adapter SSR                              | Blog não precisa de render por request; custo zero e cache total                                                                                    | Adicionar `@astrojs/cloudflare` (ADR-05)       |
| P2  | Hospedar em **Cloudflare Workers com Static Assets**, não em Pages                    | A [doc do Astro](https://docs.astro.build/en/guides/deploy/cloudflare) e a Cloudflare recomendam Workers para projetos novos; Pages segue suportado | Trocar só o passo de deploy; o build é o mesmo |
| P3  | Svelte é a camada de **UI interativa** (islands); as content collections são do Astro | Content collections são um recurso nativo do Astro (schemas Zod + loaders), não do Svelte                                                           | — (esclarecimento de papel, ver ADR-03)        |
| P4  | Autoria via Git (Markdown/MDX + notebooks `.py` no repositório)                       | Mesmo modelo do repositório [huggingface/blog](https://github.com/huggingface/blog)                                                                 | Avaliar CMS headless + live collections        |
| P5  | Idioma único pt-BR na v1, estrutura pronta para i18n                                  | Reduz escopo; Astro tem roteamento i18n nativo                                                                                                      | Ativar i18n na Fase 3                          |
| P6  | Gerenciadores: pnpm (JS) e uv (Python)                                                | uv é exigido pelo export WASM do marimo para resolver dependências e módulos locais                                                                 | —                                              |


### Decisões de 06/10/2026

- [x] **Q1 — Notebooks:** os dois modos, `inline` e `iframe`, foram a decisão de 06/10. Substituída em 14/10/2026: o modo inline foi adiado e o blog fica só com iframe (ver decisões de 14/10).
- [x] **Q2 — Autores:** autor único; sem collection `authors` nem páginas de autor (seção 6).
- [x] **Q3 — Comunidade:** fora do sprint 01; Giscus entra na Fase 4 do roadmap.
- [x] **Q4 — Ambientes:** sem staging; só preview por PR e produção.
- [ ] **Q4b — Domínio:** em aberto; falta confirmar se o domínio já está na Cloudflare. Bloqueia só a T-27. Até lá, a URL canônica vem da variável `SITE_URL`, que aponta para o endereço `workers.dev` do Worker, e as tarefas de SEO, RSS e sitemap seguem sem esperar.
- [x] **Q5 — Hospedagem:** Workers com Static Assets (P2 confirmada).
- [x] **Q6 — Volume:** blog pessoal, bem abaixo de 1.000 posts; build e paginação atuais bastam.
- [x] **Q7 — Notebooks pesados:** sim; implicações e estratégias na seção 7.

### Decisões de 09/10/2026

- [x] **Q8 — Versão do Astro:** Astro 7 com o processador `unified()` (ADR-01 revisado). O Astro 6 está em `specs/adr/ADR-01-v1-astro-6.md`.
- [x] **Q9 — Notebook inline:** em 09/10, declarado como `{ mode: inline }`, sem `src`. Substituída em 14/10/2026: o modo inline foi adiado (ver decisões de 14/10).
- [x] **Q10 — Rota de paginação:** fica `/page/2`. É a única rota fora do pt-BR, por decisão explícita.

### Decisões de 14/10/2026

- [x] **Q11 — Notebook inline adiado:** o modo inline fica adiado por custo de manutenção (T-03, `specs/spikes/T-03-mdx-marimo.md`). O blog segue só com notebooks marimo em iframe (`marimo export html-wasm`). Reavaliar quando o mdx-marimo chegar a 0.1, ou quando houver uma opção pública para controlar Python e projeto no build (T-32).

### Decisões de 22/10/2026

- [x] **Q12 — Identidade:** a identidade visual e verbal está em `specs/BRAND.md`. Em conflito de comportamento, a SPEC ganha. Tags no lugar de temas; `minutesRead` permanece junto de `benchMinutes`; imagem OG só quando não há capa; newsletter fora da v1; sem `dark:` nos componentes; chaves de frontmatter em inglês; `kind` no enum inglês (`concept`, `tutorial`, `lab`, `playbook`).

## 3. Requisitos funcionais

A v1 entrega 12 requisitos Must; o restante entra por ordem de prioridade sem bloquear o lançamento. Os itens espelham o que o HF Blog oferece hoje, menos a camada social.


| ID    | Requisito                                                                             | Prioridade | Critério de aceite                                                                                                      |
| ----- | ------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| RF-01 | Home com saudação, post em destaque e grid de cards (fólio, tipo, nível, capa, título, data, tags) | Must       | Saudação na home; cards ordenados por data desc; destaque via `featured: true`; o card soma fólio, tipo e nível e mantém capa, data e tags; título do card em Cormorant 600 desde 22 px |
| RF-02 | Filtro por tag e página `/tags/[tag]`                                                 | Must       | Cada tag usada gera uma página; tag inexistente é 404                                                                   |
| RF-03 | Paginação da listagem                                                                 | Must       | 12 posts por página; a página 1 é `/` e as seguintes são `/page/2`, `/page/3`… (exceção à regra de rotas em pt-BR, Q10) |
| RF-04 | Página do post com título, autor, linha `Fól. 006 · 21.out.2026`, tipo, nível, datas e tempo de leitura | Must       | A linha traz fólio, data visível, tipo e nível; o tempo de leitura permanece; os campos vêm do frontmatter validado. Quando o post tem `benchMinutes`, `material` ou `track`, o cabeçalho mostra a ficha da seção 9.3 do BRAND só com os itens presentes; `track` mostra a posição e o total de posts publicados com o mesmo `track` |
| RF-05 | TOC lateral fixa (h2–h3) com seção ativa destacada                                    | Must       | Funciona sem JS (links âncora); destaque é melhoria progressiva                                                         |
| RF-06 | Syntax highlighting com botão copiar                                                  | Must       | Shiki em build time, temas `pk-claro` e `pk-escuro`. Uma cerca com a meta `title=<arquivo>` depois da linguagem (```` ```py title=fol-001_embeddings.py ````) mostra o nome do arquivo na barra do bloco; sem `title=`, a barra não mostra nome. O botão diz Copiar e vira Copiado por 1,5 s; o `aria-label` é `Copiar código` |
| RF-07 | Matemática LaTeX inline e em bloco                                                    | Must       | `remark-math` + `rehype-katex` no processador `unified()`, render no build                                              |
| RF-08 | Notebook marimo interativo no post, em iframe                                         | Must       | Iframe via `marimo export html-wasm`; pôster estático até "Executar"; Python só dentro do export (seção 7)             |
| RF-09 | Visualizações Svelte + D3 usadas dentro do MDX                                        | Must       | Hidratam com `client:visible`; têm fallback estático (seção 8)                                                          |
| RF-10 | Feed RSS e sitemap                                                                    | Must       | `/rss.xml` válido no W3C Validator; `sitemap-index.xml` gerado                                                          |
| RF-11 | Rascunhos (`draft: true`) visíveis só em preview                                      | Must       | Build de produção exclui drafts de páginas, feed e sitemap                                                              |
| RF-12 | SEO por post: title, description, canonical, Open Graph, JSON-LD `BlogPosting`        | Must       | O `<title>` do post é o título do post. Home `{site.title} · {autor}`, post `{título} · {site.title} · {autor}`, `/page/n/` `Blog — página N · {site.title} · {autor}`, tag `Tag: <tag> · {site.title} · {autor}`. `og:image` e `image` do JSON-LD só existem quando há capa, até a T-23. Validado no Rich Results Test; URLs absolutas montadas a partir de `SITE_URL` |
| RF-13 | Link "Editar no GitHub" por post                                                      | Should     | URL aponta para o arquivo-fonte na branch `main`                                                                        |
| RF-14 | Página Sobre `/sobre` com bio, foto e links                                           | Should     | Dados vêm do config do site (autor único)                                                                               |
| RF-15 | Busca full-text estática                                                              | Should     | Pagefind indexa só o corpo dos posts; sem backend                                                                       |
| RF-16 | Imagem OG gerada por post quando não houver capa                                      | Should     | Com capa, a capa ganha. Sem capa, PNG 1200×630 no layout da seção 11 do BRAND; o gerador é hipótese da T-23 |
| RF-17 | Tema escuro com controle segmentado, respeitando `prefers-color-scheme`               | Should     | O controle Claro/Escuro grava a escolha em `localStorage` e aplica `data-theme` na raiz. Sem escolha gravada, segue `prefers-color-scheme`. Sem flash de tema errado no carregamento |
| RF-18 | Posts relacionados ao fim (por tags em comum)                                         | Could      | Até 3 posts, nunca o próprio                                                                                            |
| RF-19 | Comentários e reações via Giscus                                                      | Could      | Fase 4, pós-sprint 01; carregamento lazy                                                                                |
| RF-20 | Embed de Hugging Face Spaces e iframes genéricos                                      | Could      | Componente `<Embed>` com `loading="lazy"` e aspect ratio                                                                |
| RF-21 | Artigos da comunidade com login e upvote                                              | Won't (v1) | Fora da v1; exigiria D1 + auth                                                                                          |
| RF-22 | `Callout` com `variant` `note`, `caution` ou `result`                                 | Should     | Rótulos visíveis `// NOTA DE BANCADA`, `[!] CUIDADO` e `= RESULTADO`, tudo em tinta                                    |


## 4. Requisitos não-funcionais

Cada RNF tem um número verificável no CI; o que não dá para medir automaticamente vira item de checklist de revisão.


| ID     | Área             | Requisito                                                                                                                                                               | Como verificar                                                                                                                                                                                                                             |
| ------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RNF-01 | Performance      | LCP < 2,0 s e CLS < 0,05 em 4G simulado (home e post sem notebook)                                                                                                      | Lighthouse CI no job `lighthouse`, contra o `dist/` do build servido localmente (`staticDistDir`), na home e nos dois posts publicados. Perfil mobile padrão do Lighthouse, com throttling simulado "Slow 4G" (150 ms de RTT, 1,6 Mbps, CPU 4×), mediana de 3 execuções. As quatro categorias ≥ 95 também são asserção `error` desde a T-13                                                                                                                                                                                                             |
| RNF-02 | Performance      | JS inicial ≤ 50 KB gzip **por página** sem islands; cada island D3 ≤ 40 KB gzip. O runtime marimo fica fora desse budget e só existe em páginas com notebook            | `pnpm check:js` (`scripts/check-page-js.mjs` sobre a função pura `src/lib/page-js.ts`) soma, por página de `dist/` fora de `notebooks/`, o JS que o HTML referencia: `<script src>`, script inline executável, `modulepreload` e os imports estáticos transitivos; `import()` dinâmico não conta. Limite de 50.000 bytes gzip. Página com `astro-island`, JS externo ou referência inexistente falha a verificação. O `size-limit` com uma entrada por island entra com a primeira island (T-19), que também decide como contar páginas com island. Um glob único sobre `dist/_astro/*.js` não serve: somaria chunks de páginas diferentes |
| RNF-03 | Performance      | Pyodide e runtime marimo carregam só em páginas que usam notebook e só após o primeiro paint                                                                            | Teste E2E: home e post sem notebook não requisitam `/pyodide                                                                                                                                                                               |
| RNF-04 | Acessibilidade   | WCAG 2.2 AA; gráficos D3 com `role="img"`, `aria-label` e tabela de dados alternativa. Animações da marca respeitam `prefers-reduced-motion`. Lápis não é texto menor que 24 px sobre folha clara | axe-core no Playwright, zero violações serious/critical; E2E com `prefers-reduced-motion: reduce` nas animações da marca |
| RNF-05 | SEO              | HTML semântico, um `h1` por página, URLs estáveis `/blog/[slug]`                                                                                                        | Teste de build + Lighthouse SEO ≥ 95                                                                                                                                                                                                       |
| RNF-06 | Segurança        | Headers: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`                                                                                                         | `dist/_headers` gerado no build e conferido por teste de artefato; securityheaders.com em produção                                                                                                                                         |
| RNF-07 | Segurança        | CSP com `wasm-unsafe-eval` e as origens do Pyodide só em `/notebooks/*` (o iframe), não na página do post; o `dist/_headers` gerado tem no máximo 100 regras (limite da Cloudflare) | Teste de artefato: rotas sem notebook não têm `wasm-unsafe-eval`; o build falha acima de 100 regras                                                                                                                                        |
| RNF-08 | Build            | Build completo < 5 min com 200 posts e 20 notebooks                                                                                                                     | Medido no CI; cache de exports marimo por hash do `.py` + `uv.lock`                                                                                                                                                                        |
| RNF-09 | Confiabilidade   | Build falha se frontmatter for inválido, link interno quebrar ou notebook falhar no `marimo check`                                                                                   | Zod + `astro check` + verificador de links + `marimo check`                                                                                                                                                                                |
| RNF-10 | Custo            | US$ 0/mês até o limite do plano free (static assets não são cobrados)                                                                                                   | Revisão mensal no dashboard Cloudflare                                                                                                                                                                                                     |
| RNF-11 | Privacidade      | Analytics sem cookies                                                                                                                                                   | Cloudflare Web Analytics                                                                                                                                                                                                                   |
| RNF-12 | Manutenibilidade | TypeScript strict, ESLint + Prettier, Ruff para Python                                                                                                                  | Gates no CI                                                                                                                                                                                                                                |


## 5. Arquitetura e decisões de stack

A arquitetura é um build estático em duas linguagens: Python gera os artefatos marimo, Astro gera o HTML, e a Cloudflare só serve arquivos. Nada roda no servidor em produção na v1.

```mermaid
flowchart LR
  subgraph repo["Repositório"]
    mdx["posts: index.mdx"]
    nb["notebooks leves: .py"]
    heavy["exports/ pesados<br/>commitados + export.lock"]
  end
  local["Máquina do autor<br/>uv run build-notebooks.py --heavy"] --> heavy
  local --> r2[("R2<br/>arquivos > 25 MiB")]
  subgraph ci["GitHub Actions"]
    bn["uv run build-notebooks.py<br/>leves, cache por hash<br/>copia os pesados"]
    ab["astro build<br/>gera dist/_headers"]
    pf["pagefind"]
  end
  nb --> bn --> ab
  heavy --> bn
  mdx --> ab
  ab --> pf --> dist["dist/"]
  dist -- "wrangler deploy" --> cf["Cloudflare Workers<br/>Static Assets"]
  cf --> br["Navegador"]
  r2 --> br
  cdn["CDN do Pyodide"] -. "só em posts com notebook" .-> br

```



Python só existe no build; em produção, o único código que executa é o do navegador, e o Pyodide só baixa em posts que declaram notebook.

### ADRs


| ADR    | Decisão                                                                                                                                                                                | Alternativas descartadas                                                                                          | Motivo                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-01 | **Astro 7**, `output: 'static'`, content collections com loader `glob` e schemas Zod 4 (`astro/zod`). Markdown e MDX passam pelo processador `unified()` de `@astrojs/markdown-remark` | Next.js, Hugo, Docusaurus; Astro 6 (ver `specs/adr/ADR-01-v1-astro-6.md`); processador Sätteri, padrão do Astro 7 | Islands nativos, zero JS por padrão, MDX de primeira classe. O [Astro 7](https://docs.astro.build/en/guides/upgrade-to/v7/) saiu em 22/06/2026 e a doc do Astro 6 virou snapshot sem manutenção. O `unified()` mantém `remark-math`, `rehype-katex` e o tempo de leitura sem precisar portá-los para o Sätteri. Revisado em 09/10/2026 (Q8) |
| ADR-02 | **marimo só via `marimo export html-wasm` em iframe**                                                                                                                          | Jupyter + nbconvert estático; Thebe/Binder; mdx-marimo no meio do texto (adiado, ver `specs/adr/ADR-02-v1-mdx-marimo.md` e `specs/spikes/T-03-mdx-marimo.md`) | O export WASM isola o runtime e o marimo fica travado no `uv.lock` ([docs](https://docs.marimo.io/guides/exporting/webassembly_html/)). O modo inline foi adiado em 14/10/2026 por custo de manutenção (T-03): o build do mdx-marimo ignora o `uv.lock` |
| ADR-03 | **Svelte 5** para islands interativos; **D3 v7** só para cálculo (escalas, eixos, layouts), com o Svelte dono do DOM                                                                   | React + D3; Observable Plot puro                                                                                  | Svelte compila para bundles pequenos; D3 manipulando DOM brigaria com a reatividade. Content collections ficam no Astro, não no Svelte. Não há segundo framework de UI                                                                                                                                                      |
| ADR-04 | **Cloudflare Workers com Static Assets** (`wrangler.jsonc` com `assets.directory: ./dist`)                                                                                             | Cloudflare Pages, Vercel, Netlify                                                                                 | [Recomendação atual](https://docs.astro.build/en/guides/deploy/cloudflare) para projetos novos; static assets não são cobrados; caminho direto para D1/KV no futuro. Confirmado em 06/10 (Q5)                                                                                                                                                                                                            |
| ADR-05 | Sem SSR na v1                                                                                                                                                                          | `@astrojs/cloudflare` desde o início                                                                              | YAGNI. Se vierem upvotes/comentários próprios, adiciona-se o adapter `@astrojs/cloudflare` compatível com a versão do Astro em uso, e D1                                                                                                                                                                                                                                                                 |
| ADR-06 | **Pagefind** para busca                                                                                                                                                                | Algolia, Orama                                                                                                    | Indexa o `dist/` no pós-build, roda 100% no cliente, sem custo                                                                                                                                                                                                                                                                                                                                           |
| ADR-07 | **Tailwind CSS v4** + plugin `typography` para a prosa                                                                                                                                 | CSS Modules, UnoCSS                                                                                               | O HF Blog usa Tailwind; tipografia de artigo pronta                                                                                                                                                                                                                                                                                                                                                      |


### Riscos técnicos

- **Modo inline adiado** na T-03, por custo de manutenção. O blog usa só iframe. Reavaliação na T-32 (`specs/spikes/T-03-mdx-marimo.md`).
- **Pyodide pesa** dezenas de MB no primeiro acesso. Mitigação: saída estática pré-renderizada e botão "Ativar interatividade" quando o notebook for grande.
- **Pacotes sem wheel WASM** não rodam no browser. Mitigação: `marimo check --select MW` no CI (regras `MW001` import incompatível, `MW002` chamada de sistema insegura, `MW003` dependência sem wheel WASM) e cache de execução (seção 7).
- **Astro 7 é estrito com HTML.** O compilador Rust recusa tags não fechadas e não corrige aninhamento inválido; o padrão `compressHTML: 'jsx'` remove espaço entre elementos inline. Mitigação: `astro check` no CI e revisão visual do preview.
- **Cache de células com `torch`** não funciona no marimo 0.25.1, ver T-04. Mitigação: `precomputed`, a validar na T-33, ou `onnx` e `static`.

## 6. Modelo de conteúdo

A v1 tem uma única collection, `posts`. O autor é único e vem de `src/site.config.ts`; tags são derivadas dos posts. Todo campo é validado por Zod no build, e um frontmatter inválido quebra o build (RNF-09). O schema inclui `folio`, `kind` e `level`. A unicidade de `folio` não é um `refine` de entrada única: fica na função descrita nas regras derivadas. O schema abaixo é o do `content.config.ts` desde a T-45.

### Convenção de pastas

Cada post é uma pasta: o slug é o nome da pasta, e capa, imagens, dados e notebooks moram junto do texto.

```text
src/
├── site.config.ts
└── content/posts/
    └── 2026-10-intro-a-embeddings/
        ├── index.mdx
        ├── cover.png
        ├── figs/
        ├── data/              # JSON/CSV dos gráficos
        └── notebooks/
            └── treino.py      # notebook iframe

```

### Schemas (`src/content.config.ts`)

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod'; // Zod 4
import { KINDS } from './lib/kind';
import { postIdFromEntry } from './lib/post-id';

// Iframe: notebook inteiro num .py da pasta do post, exportado com html-wasm.
const notebook = z.strictObject({
  mode: z.literal('iframe'),
  src: z.string(),
  // estratégia de execução, ver seção 7
  compute: z.enum(['browser', 'cache', 'precomputed', 'onnx', 'static']).default('browser'),
  gpuUrl: z.url().optional(), // botão "Rodar com GPU" (molab, Colab, HF Space)
});

const posts = defineCollection({
  loader: glob({
    pattern: '**/index.{md,mdx}',
    base: './src/content/posts',
    // id = nome da pasta, validado por postIdFromEntry; é o slug de /blog/[slug]
    generateId: ({ entry }) => postIdFromEntry(entry),
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(90),
        description: z.string().min(50).max(160),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        folio: z.int().min(1), // exibido como "Fól. 006"
        kind: z.enum(KINDS), // concept | tutorial | lab | playbook, em src/lib/kind.ts
        level: z.int().min(1).max(3),
        tags: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(6).default([]),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
        benchMinutes: z.int().min(1).optional(), // não substitui minutesRead
        material: z.string().optional(),
        track: z.string().regex(/^[a-z0-9-]+$/).optional(), // mesma regra de tags; sem rota
        // declara os iframes do post
        notebooks: z.array(notebook).default([]),
        canonical: z.url().optional(),
      })
      .refine((d) => !d.cover || d.coverAlt, {
        error: 'coverAlt é obrigatório quando há cover',
        path: ['coverAlt'],
      })
      .refine((d) => d.kind !== 'lab' || d.notebooks.length > 0, {
        error: 'kind lab exige ao menos um item em notebooks',
        path: ['notebooks'],
      }),
});

export const collections = { posts };

```

Notas de Zod 4: `z.url()` substitui `z.string().url()`, e o parâmetro `error` substitui `message`. As formas antigas ainda funcionam, mas estão depreciadas.

### Autor (`src/site.config.ts`)

```ts
export const site = {
  title: 'pk.log',
  // até a Q4b fechar, SITE_URL aponta para o endereço workers.dev do Worker
  url: import.meta.env.SITE_URL ?? 'https://blog.exemplo.com',
  author: {
    name: 'Pedro Knoll',
    avatar: '/avatar.jpg',
    bio: 'Aprendizados e experimentos em IA',
    github: 'usuario',
    huggingface: 'usuario',
  },
} as const;

```

Os literais `pk.log`, `Pedro Knoll` e a descrição curta entraram na T-43. `github` e `huggingface` seguem placeholder.

### Exemplo de frontmatter

```yaml
---
title: "Embeddings na prática: similaridade de cosseno"
description: "Como calcular e visualizar similaridade entre frases, com um notebook marimo que roda no seu navegador."
pubDate: 2026-10-20
folio: 6
kind: lab
level: 2
tags: [nlp, embeddings]
cover: ./cover.png
coverAlt: "Pontos coloridos agrupados num plano 2D"
notebooks:
  - { mode: iframe, src: ./notebooks/treino.py, compute: precomputed, gpuUrl: "https://colab.research.google.com/..." } # a validar na T-33
---

```

### Regras derivadas

- `getPublishedPosts()` é o único acesso à collection nas páginas. Antes do filtro de publicados, chama `assertUniqueFolios` (`src/lib/folio.ts`) sobre todas as entradas da collection, rascunho incluído. Dois fólios iguais falham o build com a mensagem `Fólio repetido: <n> em <id1>, <id2>`, com os ids em ordem crescente e vários conflitos separados por `; `. Em seguida filtra `draft` quando `SHOW_DRAFTS` não é `true` e ordena por `pubDate` desc, com desempate por `id` crescente.
- `folio` é inteiro e a exibição é `Fól. 006`: três dígitos até 999 e o número inteiro acima disso (`formatFolio`, em `src/lib/folio.ts`). **Fól. 001** é `2026-10-por-que-este-blog` ("Por que este blog existe"). **Fól. 002** é `2026-10-como-o-blog-e-feito`. Os dois entram como `kind: concept` e `level: 1`. O rascunho `2026-10-rascunho-de-teste` é Fól. 999, com `kind: concept` e `level: 1`: ele nunca será publicado, e o 003 fica para o próximo post. Fixture ou rascunho novo também precisa de fólio único.
- `kind` usa o enum inglês. Os rótulos pt-BR (`Conceito`, `Tutorial`, `Lab`, `Playbook`) ficam em `KIND_LABELS`, em `src/lib/kind.ts`, ao lado de `KINDS`, que o schema usa. Não vão no frontmatter. Os rótulos de nível (`Iniciante`, `Intermediário`, `Avançado`) e a hachura ficam em `src/lib/level.ts` (`LEVEL_LABELS` e `levelHatch`).
- `benchMinutes` não substitui `minutesRead`. `track` não ganha rota. Temas da marca são rótulo em `src/data/tags.ts`, não um segundo campo. Colab continua `gpuUrl`: não há campo `marimo` nem `colab`.
- A data visível é `21.out.2026`. O dia tem dois dígitos (`05.out.2026`), o mês vem de uma lista fixa em minúsculas e sem ponto, e o ano tem quatro dígitos, sempre em UTC. A função é `formatPubDate`, em `src/lib/format-date.ts`, sem `Intl`. Vale para a publicação e para o "Atualizado em". O atributo `datetime` continua ISO.
- O slug é o `id` gerado pelo `generateId` do loader (nome da pasta). `postIdFromEntry` exige exatamente dois segmentos (`pasta/index.md` ou `pasta/index.mdx`) e pasta `^[a-z0-9-]+$`; caso contrário o build falha citando o entry. Nenhuma página recalcula slug por conta própria.
- O tempo de leitura é calculado por um plugin remark do projeto (`src/lib/remark-reading-time.mjs`), registrado nos dois `unified()`, o do Markdown e o do MDX. Ele grava o valor em `minutesRead`, que a página lê em `remarkPluginFrontmatter`.
  - **Conta:** o texto de nós `text` e `inlineCode`, inclusive dentro de headings, listas, links, citações e componentes MDX.
  - **Não conta:** blocos de código, fórmulas (`math` e `inlineMath`), HTML cru, frontmatter, `import`/`export` e expressões do MDX, atributos de componentes e `alt` de imagens.
  - **Palavra:** um trecho entre espaços com pelo menos uma letra ou um dígito.
  - **Resultado:** `max(1, ceil(palavras / 200))`.
- `hasCode` é calculado por um plugin remark do projeto (`src/lib/remark-has-code.mjs`), registrado nos dois `unified()`, depois do `remark-math`. Ele grava o booleano em `hasCode`, que a página lê em `remarkPluginFrontmatter`. O `PostLayout` só inclui o script de copiar quando `hasCode` é verdadeiro. O botão é criado pelo script, como melhoria progressiva; sem JavaScript não há botão.
  - **Conta:** nós `code` do mdast, com ou sem `lang` (`lang: null` é cerca sem linguagem), inclusive dentro de `blockquote` e de `list`/`listItem`.
  - **Não conta:** `inlineCode` nem `code` com `lang === "math"`.
- Tags são validadas pelo schema, com `^[a-z0-9-]+$` e até 6 por post, e o build falha fora disso; não há normalização. Um arquivo `src/data/tags.ts` opcional dá rótulo e descrição para as páginas de tag.
- A página `/tags/<tag>/` existe para cada tag de post publicado e lista todos os posts publicados com a tag, na ordem de `getPublishedPosts()`, sem paginação, com h1 `Tag: <tag>`. Não há página `/tags/`. As tags aparecem como links na página do post e nos cards.
- `/`, `/page/n/` e as páginas de tag têm a barra "Filtrar por tag", só com links e sem JavaScript, com "Todos" e as tags dos posts publicados em ordem alfabética. O filtro ativo leva `aria-current="true"`.
- A home mostra como destaque o post mais recente com `featured: true`, só em `/`, e ele sai da lista paginada. Sem nenhum `featured`, não há destaque.
- A página 1 da listagem é `/`; as seguintes são `/page/2/`, `/page/3/`…; `/page/1/` não é gerada.
- Links internos usam barra final (`/blog/<slug>/`, `/page/2/`): sem ela, a Cloudflare responde 307 (T-05).

## 7. Pipeline marimo

O blog embute notebooks marimo em iframe. O Python roda no navegador via Pyodide, dentro do export; a página do post não executa o kernel. Nenhum notebook precisa de servidor.

O modo inline foi adiado em 14/10/2026 por custo de manutenção (T-03). Ver `specs/spikes/T-03-mdx-marimo.md`.

### Processador Markdown e MDX

`astro.config.mjs` usa o processador `unified()` para Markdown e MDX:

```js
import pkClaro from './src/styles/shiki/pk-claro.json';
import pkEscuro from './src/styles/shiki/pk-escuro.json';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';
import { remarkHasCode } from './src/lib/remark-has-code.mjs';

const remarkPlugins = [remarkMath, remarkReadingTime, remarkHasCode];
const rehypePlugins = [rehypeKatex];

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://blog.exemplo.com',
  output: 'static',
  markdown: {
    shikiConfig: {
      themes: { light: pkClaro, dark: pkEscuro },
      defaultColor: false,
    },
    processor: unified({ remarkPlugins, rehypePlugins }),
  },
  integrations: [
    mdx({ processor: unified({ remarkPlugins, rehypePlugins }) }),
    svelte(),
    sitemap(),
  ],
  vite: { plugins: [tailwindcss()] },
});

```

As opções `markdown.remarkPlugins` e `markdown.rehypePlugins` estão depreciadas no Astro 7; os plugins vão dentro de `unified()`. O Shiki fica em `markdown.shikiConfig`, fora do `unified()`; o MDX herda essa opção (`extendMarkdownConfig` tem default `true`) e não repete `shikiConfig`. Temas próprios entram como objeto importado do JSON, não pelo nome. `themes` aceita o JSON importado, sem `with { type: "json" }` (confirmado na T-41). A T-41 trocou os temas embutidos por esses arquivos, porque o `github-light` ficava abaixo de 4,5 sobre `sheet`. Com `defaultColor: false`, cada token sai só com `--shiki-light` e `--shiki-dark`. `markdown.syntaxHighlight` permanece no padrão. O CSS do KaTeX entra por import de `katex/dist/katex.min.css` no `PostLayout`, sem CDN, e a home não o recebe.

### Modo iframe

1. `scripts/build-notebooks.py` percorre os posts e, para cada notebook `iframe` com `compute: browser`, roda `marimo check --select MW` e depois `marimo export html-wasm <nb>.py -o public/notebooks/<slug>/<nome>/ --mode run --no-show-code`.
2. O resultado é cacheado pelo SHA-256 do `.py` + `uv.lock`; notebook sem mudança não é reexportado (RNF-08). `public/notebooks/` é gerado e fica no `.gitignore`.
3. O componente `<MarimoFrame>` aponta para `/notebooks/<slug>/<nome>/`, com barra final, e define largura e altura. Sem dimensões, o iframe sai com 300 × 150 px. Renderiza com `loading="lazy"` e um pôster estático até o usuário clicar em "Executar".
4. Dados do notebook são lidos via `mo.notebook_location()`, para funcionar local e no WASM. Módulos `.py` locais importados pelo notebook entram no export como wheel em `public/wheels` (exige uv).

A v1 não tem interrupts. O marimo em WASM usa `SharedArrayBuffer`, que exige isolamento de origem (`Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp` ou `credentialless`). Sem isso, o leitor não consegue parar uma célula em execução. Ver `specs/spikes/T-05-headers.md`.

### Notebooks pesados (torch, GPU, dados grandes)

Notebook pesado nunca roda inteiro no navegador do leitor: o Pyodide só instala pacotes com wheel WebAssembly, o `torch` não tem, e não há GPU disponível para ele. Então a parte pesada roda **antes**, na sua máquina, e o leitor recebe os resultados prontos, com as partes leves ainda interativas.

#### O que isso implica

- **A execução sai do CI.** Os runners padrão do GitHub Actions não têm GPU, e treinar a cada push deixaria o build lento. Notebook pesado é executado localmente e o export é commitado.
- **Interatividade parcial.** Células que dependem de `torch` não podem ser reexecutadas pelo leitor. No export, um valor que o navegador não consegue restaurar vira um stub, e usar o stub tenta recomputar a célula (e falha sem `torch`). O que reage a sliders precisa operar sobre resultados já calculados (arrays numpy, tabelas).
- **É um snapshot.** Mudou uma célula cacheada ou um dado de entrada, o cache invalida: é preciso reexecutar e reexportar.
- **Limites de arquivo.** A Cloudflare serve até 25 MiB por arquivo e 20.000 arquivos por versão no plano free ([limites](https://developers.cloudflare.com/workers/platform/limits/)). Pesos de modelo e datasets maiores vão para um bucket R2 com domínio próprio e CORS liberado.
- **Peso para o leitor.** Pyodide mais numpy/pandas somam dezenas de MB no primeiro acesso; post pesado abre com a saída estática e um botão "Ativar interatividade".

#### Estratégias (campo `compute` de notebooks `iframe`)


| `compute`          | Como funciona                                                                                                                                                                                                                 | O leitor pode                                             | Quando usar                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| `browser` (padrão) | Tudo roda no Pyodide; exportado no CI                                                                                                                                                                                         | Tudo, inclusive editar código                             | numpy, pandas, scikit-learn, matplotlib                     |
| `cache`            | `cache_cells = true` + `marimo export html-wasm --execute`; o marimo copia o cache para `public/cache/` **dentro do diretório do export**                                                                                     | Interagir com células leves que leem os valores cacheados | Treino curto, embeddings, métricas de avaliação. Não funciona com treino em `torch` no marimo 0.25.1, ver T-04             |
| `precomputed`      | `@mo.persistent_cache(method="lazy")` numa função indexada pelos controles; uma célula guardada por `sys.platform != "emscripten"` aquece todas as combinações antes do export (`method="pickle"` não empacota bem para WASM) | Trocar qualquer opção de slider/dropdown sem recomputar   | Poucos estados conhecidos (ex.: 3 modelos × 4 temperaturas) |
| `onnx`             | Modelo cacheado como ONNX com `moutils.onnx.OnnxRuntime`; no navegador a inferência roda em onnxruntime-web                                                                                                                   | Rodar inferência de verdade com entradas novas            | Modelos pequenos, abaixo do limite de 25 MiB                |
| `static`           | `marimo export html`, sem WASM                                                                                                                                                                                                | Só ler                                                    | Resultados finais que não justificam o Pyodide              |


Complemento para qualquer estratégia: um botão "Rodar com GPU" apontando para molab, Colab ou um HF Space, para quem quiser reproduzir o treino completo fora do blog.

A barra do lab (T-18) é a pele em cima de `notebooks` e `gpuUrl`: sem campo `marimo` nem `colab`, e "Abrir no Colab" só com `gpuUrl`. A primeira célula do lab é convenção no `AGENTS.md` de `src/components/marimo/` (antes da T-14) e no post da T-21, com `src/components/marimo/pk.css`.

#### Fluxo de um post pesado

1. Declarar no frontmatter `notebooks: [{ mode: iframe, src: ./notebooks/treino.py, compute: precomputed }]`.
2. Marcar dependências nativas no bloco PEP 723 para que o export WASM as ignore:

```python
# /// script
# dependencies = [
#     "marimo",
#     "numpy",
#     "torch; sys_platform != 'emscripten'",
# ]
# [tool.marimo.runtime]
# cache_cells = true
# ///

```

1. Rodar localmente `uv run scripts/build-notebooks.py --heavy <slug>`: executa com torch (CPU ou GPU), exporta para `exports/<slug>/<nome>/` e grava `exports/<slug>/<nome>/export.lock` com o SHA-256 do `.py`, do `uv.lock` e a versão do marimo.
2. Commitar `exports/<slug>/`; arquivos acima de 25 MiB são enviados ao R2 pelo mesmo script e substituídos por referência.
3. No CI, notebooks com `compute` diferente de `browser` não são executados. O CI confere se o `export.lock` bate com os hashes atuais (falha se o export estiver desatualizado) e o `build-notebooks.py` copia `exports/<slug>/<nome>/` para `public/notebooks/<slug>/<nome>/`, onde fica junto dos exports leves.

A mecânica de cache e pré-cômputo está descrita na [documentação do marimo](https://docs.marimo.io/guides/exporting/webassembly_html/). O spike T-04 mostrou que o `--execute` instala e roda o `torch` num sandbox isolado, mas a célula que treina com `torch` não entra no cache no marimo 0.25.1. Ver `specs/spikes/T-04-html-wasm.md`.

### Ordem do build

```bash
pnpm build   # = uv run scripts/build-notebooks.py && astro build && pagefind --site dist

```

`pnpm dev` não gera notebooks. Para ver um notebook iframe no servidor de dev, rode antes `uv run scripts/build-notebooks.py` (só leves, com cache) ou `pnpm build && npx wrangler dev`.

## 8. Visualizações interativas (Svelte + D3)

Cada gráfico é um componente Svelte 5 que usa módulos D3 só para cálculo e desenha o SVG no próprio template. Assim o Astro renderiza o SVG no build (o leitor vê o gráfico sem JS) e o island só adiciona interatividade ao ficar visível.

### Regras

- Importar módulos D3 avulsos (`d3-scale`, `d3-shape`, `d3-array`, `d3-format`), nunca o pacote `d3` inteiro (RNF-02).
- Proibido `d3-selection` para criar ou mudar elementos; o DOM é do Svelte. Exceção documentada: `d3-zoom`/`d3-drag` via action do Svelte.
- Dados vêm por props, importados no MDX a partir de JSON/CSV na pasta do post; nada de `fetch` em runtime.
- Datas chegam como string ISO (é o que JSON e CSV entregam); o componente converte para `Date`. O autor não converte nada no MDX.
- Todo gráfico recebe `title` e `summary` (vira `aria-label`) e oferece "Ver dados" com a tabela (RNF-04).
- Hidratação padrão `client:visible`; `client:load` só com justificativa no PR.
- Cores via variáveis CSS do tema, para respeitar modo escuro.

### Contrato do componente

```svelte
<!-- src/components/viz/LineChart.svelte -->
<script lang="ts">
  import { scaleLinear, scaleUtc } from 'd3-scale';
  import { line } from 'd3-shape';
  import { extent } from 'd3-array';

  type RawPoint = { date: string | Date; value: number }; // string ISO vinda de JSON/CSV
  type Point = { date: Date; value: number };

  let { data, title, summary, width = 640, height = 320 }:
    { data: RawPoint[]; title: string; summary: string; width?: number; height?: number } = $props();

  const m = { top: 16, right: 16, bottom: 28, left: 40 };
  let hover = $state<Point | null>(null);

  const points = $derived<Point[]>(data.map((d) => ({ date: new Date(d.date), value: d.value })));
  const x = $derived(scaleUtc(extent(points, (d) => d.date) as [Date, Date], [m.left, width - m.right]));
  const y = $derived(scaleLinear(extent(points, (d) => d.value) as [number, number], [height - m.bottom, m.top]).nice());
  const path = $derived(line<Point>((d) => x(d.date), (d) => y(d.value))(points));
</script>

<figure>
  <svg viewBox="0 0 {width} {height}" role="img" aria-label={summary}>
    <title>{title}</title>
    <path d={path} fill="none" stroke="var(--viz-1)" stroke-width="2" />
    <!-- eixos, pontos e tooltip controlados por `hover` -->
  </svg>
  <figcaption>{title}</figcaption>
</figure>

```

### Uso no post

```mdx
import LineChart from '~/components/viz/LineChart.svelte';
import serie from './data/latencia.json'; // [{ "date": "2026-10-01", "value": 120 }, …]

<LineChart client:visible data={serie} title="Latência p95 por dia" summary="Latência caiu de 120 ms para 45 ms após o cache." />

```

### Biblioteca inicial (Fase 2)


| Componente   | Uso típico                                      | Módulos D3             |
| ------------ | ----------------------------------------------- | ---------------------- |
| `LineChart`  | Séries temporais, curvas de treino              | scale, shape, array    |
| `BarChart`   | Comparação entre modelos ou benchmarks          | scale, array, format   |
| `Scatter`    | Embeddings 2D, correlações                      | scale, array, zoom     |
| `Heatmap`    | Matrizes de atenção e confusão                  | scale, scale-chromatic |
| `Explorable` | Wrapper com sliders que alimentam outro gráfico | —                      |


Antes da T-19, crie `src/components/viz/AGENTS.md` a partir desta seção e da seção 9.8 de `specs/BRAND.md`. Isso não cria dependência da T-19 com a Fase 1b.

## 9. Estrutura do repositório e convenções

Um único repositório com dois ambientes (Node e Python) que se encontram no `public/` e no `dist/`. A spec mora no próprio repo em `specs/`, para que mudanças de requisito e de código passem pelo mesmo PR.

```text
.
├── AGENTS.md                 # manual para agentes de código (Cursor lê este e os aninhados)
├── .cursorignore             # exports/ e artefatos que não devem entrar no contexto
├── .github/
│   ├── workflows/ci.yml
│   └── pull_request_template.md   # campo "Requisitos afetados"
├── .node-version  ·  .python-version
├── specs/
│   ├── SPEC.md               # este documento
│   ├── ROADMAP.md            # tarefas, dependências, status e handoff
│   ├── BRAND.md              # identidade; em conflito de comportamento, esta spec ganha
│   ├── spikes/               # resultados de T-03 e T-04
│   └── adr/                  # só ADRs substituídos; os vigentes ficam na seção 5
├── src/
│   ├── site.config.ts        # título, URL (SITE_URL) e autor
│   ├── content.config.ts
│   ├── content/posts/
│   ├── assets/brand/         # símbolo e ícones; ver a árvore da marca abaixo
│   ├── components/
│   │   ├── ui/               # .astro: Card, TagList, Toc, AuthorBadge
│   │   ├── viz/              # .svelte: gráficos D3 (AGENTS.md próprio, criado antes da T-19)
│   │   └── marimo/           # MarimoFrame, RunOnGpu (AGENTS.md próprio, criado antes da T-14)
│   ├── integrations/
│   │   └── headers.ts        # gera dist/_headers no astro:build:done (CSP por rota)
│   ├── layouts/              # BaseLayout, PostLayout
│   ├── pages/
│   │   ├── index.astro
│   │   ├── page/[page].astro
│   │   ├── blog/[slug].astro
│   │   ├── tags/[tag].astro
│   │   ├── sobre.astro
│   │   ├── rss.xml.ts
│   │   └── robots.txt.ts
│   ├── lib/                  # getPublishedPosts, readingTime, seo; unicidade de folio
│   └── styles/
│       ├── global.css
│       └── shiki/            # pk-claro.json, pk-escuro.json
├── scripts/
│   └── build-notebooks.py    # leves no CI; --heavy <slug> para export local
├── exports/                  # pesados, commitados: <slug>/<nome>/ + export.lock
├── public/
│   ├── favicon.svg
│   ├── favicon.ico
│   ├── favicon-16.png
│   ├── favicon-32.png
│   ├── apple-touch-icon.png
│   ├── _redirects
│   └── notebooks/            # gerado no build (leves exportados + pesados copiados); no .gitignore
├── tests/                    # vitest (unit) e playwright (e2e)
├── astro.config.mjs
├── wrangler.jsonc
├── package.json  ·  pnpm-lock.yaml
└── pyproject.toml  ·  uv.lock

```

Arquivos da marca, sem `icon-192.png` e sem `icon-512.png`:

```text
specs/BRAND.md
src/assets/brand/pklog-simbolo{,-escuro,-currentcolor,-construcao,-pixel}.svg
src/assets/brand/icones/aceno.svg
src/assets/brand/icones/icone-{conceito,tutorial,lab,playbook}.svg
src/assets/brand/icones/icone-{conceito,tutorial,lab,playbook}-parado.svg
src/styles/shiki/pk-claro.json
src/styles/shiki/pk-escuro.json
public/favicon.svg · favicon.ico · favicon-16.png · favicon-32.png · apple-touch-icon.png
```

### Convenções

- **Commits:** Conventional Commits citando o requisito, ex.: `feat(post): TOC com seção ativa [RF-05]`.
- **Branches:** `main` = produção; toda mudança via PR com preview. Nome de branch: `t-XX-descricao-curta`.
- **Componentes:** `.astro` para tudo que é estático; `.svelte` só quando houver estado no cliente.
- **Rotas:** em pt-BR (`/sobre`, `/tags/[tag]`), com `/blog/[slug]` e a exceção `/page/[n]` (Q10).
- **Alias:** `~/` aponta para `src/`.
- **Versões:** Node LTS fixado em `.node-version`; Python fixado em `.python-version`; marimo travado no `uv.lock`. O iframe usa os assets do próprio export, então já sai alinhado.
- **Mudança de spec:** PR que altera comportamento atualiza `specs/SPEC.md` no mesmo commit; o template de PR tem o campo "Requisitos afetados".

### Dependências pré-aprovadas

Um agente pode instalar, sem perguntar, as dependências abaixo, na versão estável atual. Qualquer outra exige pergunta (AGENTS.md, "Pare e pergunte").


| Área           | npm                                                                                                                                                                          | Python (uv)                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Núcleo         | `astro`, `@astrojs/mdx`, `@astrojs/markdown-remark`, `@astrojs/svelte`, `svelte`, `@astrojs/sitemap`, `@astrojs/rss`, `@astrojs/check`, `typescript`, `sharp` (serviço de imagem do `astro:assets`; com pnpm, precisa ser dependência direta) | `marimo`                                                          |
| Estilo         | `tailwindcss`, `@tailwindcss/vite`, `@tailwindcss/typography`                                                                                                                | —                                                                 |
| Conteúdo       | `remark-math`, `rehype-katex`, `katex`                                                                                                                                       | —                                                                 |
| Gráficos       | `d3-scale`, `d3-shape`, `d3-array`, `d3-format`, `d3-zoom`, `d3-scale-chromatic`                                                                                             | —                                                                 |
| Busca e deploy | `pagefind`, `wrangler`                                                                                                                                                       | —                                                                 |
| Qualidade      | `eslint`, `prettier` (e os plugins oficiais para Astro e Svelte), `vitest`, `@testing-library/svelte`, `@playwright/test`, `@axe-core/playwright`, `size-limit`, `@lhci/cli`, `linkinator`, `@types/node` | `ruff`                                                            |
| Notebooks      | —                                                                                                                                                                            | `moutils` (só em notebooks com `compute: onnx`, no bloco PEP 723) |


Dependências de notebook (numpy, torch etc.) ficam no bloco PEP 723 de cada `.py`, não no `pyproject.toml`.

Fontes: a opção `fonts` no topo do `defineConfig`, estável desde o Astro 6, e não `experimental.fonts`. Com `fontProviders.fontsource()`, o build baixa Cormorant Garamond (600 normal; 500 e 600 itálico; fallback `serif`), IBM Plex Sans (400 e 600 normal; 400 itálico; fallback `sans-serif`), IBM Plex Mono (400 normal; fallback `monospace`) e Caveat (500 e 600 normal; fallback `cursive`), subset `latin` e `woff2`, e o site serve os arquivos de `/_astro/fonts/`, sem fonte de outra origem. Preload só de IBM Plex Sans 400 normal. Os tokens `--font-display`, `--font-sans`, `--font-mono` e `--font-hand` apontam para as variáveis das famílias; componente e página usam o token, e a troca de `--font-sans` e `--font-mono` é o que põe a IBM Plex Sans no texto e a IBM Plex Mono no código. Pacotes `@fontsource/*` não entram nesta lista. Não se usa `fontProviders.google()`. Cada arquivo de fonte que a página baixa antes do LCP custa cerca de um degrau de 150 ms no Lantern em HTTP/1.1, e arquivo maior custa mais; `font-display` e preload não mudam isso (T-52). Nas páginas de `pagesForTheme`, as faces da marca carregadas cabem nesta lista: Plex Sans 400 normal, Plex Sans 600 normal, Plex Sans 400 itálico, Plex Mono 400 normal e Cormorant 600 normal. O teto é 3 arquivos e 61.000 bytes na home e na página de tag, e 5 arquivos e 110.000 bytes nos posts. A guarda é `tests/e2e/font-budget.spec.ts`, nas páginas que ela confere: a home, os posts publicados e a primeira página de tag. A Caveat, a Cormorant 500 itálico e a Cormorant 600 itálico continuam no config e ficam fora das páginas até uma tarefa medir.

## 10. Deploy, CI/CD e ambientes

O deploy roda no GitHub Actions, e não no build nativo da Cloudflare, porque o build precisa de Node e de Python com uv no mesmo job. A Cloudflare recebe só o `dist/` pronto via Wrangler.

### `wrangler.jsonc` (site estático, sem Worker)

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "blog",
  "compatibility_date": "2026-10-06",
  "workers_dev": true,
  "preview_urls": true,
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}

```

`workers_dev: true` mantém o subdomínio `workers.dev` mesmo quando uma rota for adicionada: sem `route` nem `routes` o default já é `true`, e com rota o default passa a `false`. `preview_urls: true` liga as Version URLs. Omitir esse campo não altera a configuração que o Worker já tem na Cloudflare.

### Headers e redirecionamentos

A [doc da Cloudflare](https://developers.cloudflare.com/workers/static-assets/headers/) confirma `_headers` e `_redirects` em Static Assets, lidos do diretório de assets (`dist/`). Três regras dela orientam o desenho:

- Uma requisição que casa com várias regras herda os headers de todas. Header repetido tem os valores **unidos por vírgula**: duas CSPs viram uma lista, e o navegador aplica as duas (vence a mais restritiva).
- `! Nome-Do-Header` numa regra remove um header herdado de regra mais ampla.
- Limite de **100 regras** e 2.000 caracteres por linha.

Por isso o `_headers` é **gerado no build** pela integração `src/integrations/headers.ts`, no hook `astro:build:done`, escrevendo em `dist/_headers`:

1. Regra `/*` com a CSP estrita (sem `wasm-unsafe-eval`), HSTS, `X-Content-Type-Options`, `Referrer-Policy` e `frame-ancestors 'self'`. Não usar `X-Frame-Options: DENY`: os iframes de notebook são do mesmo domínio.
2. A CSP de notebook medida na T-05 vai numa regra por export, `/notebooks/<slug>/<nome>/*`, cada uma com `! Content-Security-Policy` e os hashes do próprio export. A página do post não executa Pyodide e não recebe essa CSP. Diretivas: `default-src 'none'`; `script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net` mais os hashes `sha256` dos scripts inline; `style-src 'self' 'unsafe-inline'`; `img-src 'self' data:`; `font-src 'self' data:`; `connect-src 'self' https://wasm.marimo.app https://cdn.jsdelivr.net https://files.pythonhosted.org`; `worker-src 'self'`; `frame-ancestors 'self'`; `base-uri 'none'`; `form-action 'none'`. Os hashes dependem do `index.html` de cada export. Cada linha do `_headers` tem limite de 2.000 caracteres: a linha medida tem 577 com 4 hashes, cerca de 55 por hash. A T-16 implementa essas regras, calcula os hashes no build e confere o limite de 100 regras e de 2.000 caracteres por linha. Hash em `style-src` não entra: com um hash na diretiva, o navegador ignora `'unsafe-inline'`. `'unsafe-inline'` em `style-src` não contradiz o RNF-07; `script-src` não tem `'unsafe-inline'` nem `'unsafe-eval'`.
3. Regras de cache (abaixo) e `X-Robots-Tag: noindex` para `https://:version.:subdomain.workers.dev/*` depois que o domínio próprio existir.
4. O build falha se o arquivo passar de 100 regras (RNF-07).

A T-05 confirmou o detach: `! Content-Security-Policy` seguido de nova CSP no mesmo bloco entrega uma única CSP, com `wasm-unsafe-eval`, na rota do notebook; a página que embute o iframe fica só com a CSP global. Headers repetidos chegaram como linhas separadas, não unidos por vírgula; os testes da T-16 contam ocorrências. Ver `specs/spikes/T-05-headers.md`. O plano B não foi necessário. Transform Rules exigem zona, e o `workers.dev` não é uma zona da conta: só depois da T-27. Até lá, se o detach falhar, a alternativa são regras explícitas por rota (`/`, `/blog/*`, `/tags/*`, `/page/*`, `/sobre`, `/_astro/*`…). `_redirects` continua versionado em `public/`.

### Ambientes


| Ambiente | Gatilho                         | URL                                                         | Drafts   |
| -------- | ------------------------------- | ----------------------------------------------------------- | -------- |
| Local    | `pnpm dev` / `npx wrangler dev` | `localhost:4321` / `:8787`                                  | Visíveis |
| Preview  | Cada PR                         | URL de versão do Worker, comentada no PR                    | Visíveis |
| Produção | Merge em `main`                 | `SITE_URL`: `workers.dev` até a Q4b, depois domínio próprio | Ocultos  |


### Pipeline (`.github/workflows/ci.yml`)

1. **Setup:** pnpm, Node LTS, uv; cache de `~/.cache/uv`, `node_modules` e `public/notebooks` (chave = hash dos `.py` + `uv.lock`).
2. **Lint e tipos:** `pnpm lint`, `astro check`, `ruff check`, `marimo check --select MW` em todos os notebooks.
3. **Testes unitários:** `vitest` em `src/lib`.
4. **Build de produção:** `pnpm build` sem `SHOW_DRAFTS` (notebooks leves → Astro → Pagefind; notebooks pesados não executam, só têm o `export.lock` conferido e são copiados).
5. **Verificações do artefato:** dois jobs sobre o `dist/` do passo 4 (artifact), em paralelo ao E2E. `artifact-checks` roda os links internos (`pnpm check:links`, linkinator com fragmentos) e o JS por página (`pnpm check:js`); o segundo roda mesmo se o primeiro falhar. `lighthouse` roda o Lighthouse CI com budgets e guarda o relatório no artifact `lighthouse-report` (14 dias). As regras do `dist/_headers` entram com a T-16 e o `size-limit` com a T-19 (RNF-01/02/05/06/07).
6. **E2E:** Playwright + axe, só no Chromium, contra `astro preview` do `dist/` do passo 4 (artifact), o que inclui o cenário de rascunhos.
7. **Deploy:** em PR, um segundo `astro build` com `SHOW_DRAFTS=true` (reaproveita os notebooks do passo 4) seguido de `wrangler versions upload`, que gera a URL de preview. Em `main`, o deploy espera o E2E, o `lighthouse` e o `artifact-checks` e faz `wrangler deploy` do build do passo 4. O preview do PR não espera nenhum dos três.

`SHOW_DRAFTS` não tem prefixo `PUBLIC_`: só o build a lê, e ela não deve ir para o cliente.

Segredos necessários no repositório: `CLOUDFLARE_API_TOKEN` (Account API token com o papel Workers · Editor) e `CLOUDFLARE_ACCOUNT_ID`. Variável: `SITE_URL`.

### Cache na edge

- `/_astro/*` e `/notebooks/:slug/:nome/assets/*`: `Cache-Control: public, max-age=31536000, immutable` (nomes com hash). A Cloudflare aceita um splat por URL; a forma com dois `*` não vale. Use um placeholder por segmento.
- HTML: o padrão da Cloudflare já é `public, max-age=0, must-revalidate` com `ETag`; não precisa de regra.

## 11. Critérios de aceite e testes

Uma tarefa só fecha quando seus cenários passam no CI. Os cenários abaixo cobrem os requisitos de maior risco; os demais usam o critério da tabela da seção 3.

### Cenários (Given/When/Then)

```gherkin
Funcionalidade: Notebook marimo em iframe [RF-08, RNF-03]
  Cenário: post sem notebook não carrega runtime
    Dado um post sem o campo notebooks
    Quando a página carrega
    Então nenhuma requisição casa com /pyodide|marimo/

Funcionalidade: Notebook pesado [RF-08, RNF-09]
  Cenário: export desatualizado
    Dado um notebook com compute: precomputed
    E o .py mudou depois do último export local
    Quando o CI roda
    Então o build falha pedindo para rodar build-notebooks.py --heavy <slug>

  Cenário: leitor interage com notebook cacheado
    Dado um notebook com compute: precomputed aberto no navegador
    Quando o leitor muda um controle que só depende de valores cacheados
    Então a saída atualiza sem nenhuma requisição de pacote torch

Funcionalidade: CSP por rota [RNF-06, RNF-07]
  Cenário: rota sem notebook
    Dado o dist/_headers gerado
    Quando inspeciono os headers efetivos de / e de um post sem notebook
    Então a CSP não contém wasm-unsafe-eval

  Cenário: rota com notebook
    Dado um post com { mode: iframe } e o export em /notebooks/
    Quando inspeciono os headers efetivos da página do post e de /notebooks/
    Então a página do post não contém wasm-unsafe-eval
    E /notebooks/ tem uma única CSP, com wasm-unsafe-eval

Funcionalidade: Rascunhos [RF-11]
  Cenário: draft em produção
    Dado um post com draft: true
    Quando o build roda sem SHOW_DRAFTS
    Então o post não aparece na home, nas tags, no RSS nem no sitemap

Funcionalidade: Gráfico acessível [RF-09, RNF-04]
  Cenário: leitor sem JavaScript
    Dado um post com <LineChart client:visible>
    Quando JavaScript está desabilitado
    Então o SVG está presente no HTML com aria-label igual ao summary

```

### Pirâmide de testes


| Nível      | Ferramenta                                                                   | O que cobre                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit       | Vitest                                                                       | `src/lib` (ordenação, filtros, `SHOW_DRAFTS` ligado e desligado, readingTime, SEO, geração do `_headers`), helpers de escala                      |
| Componente | Vitest + `@testing-library/svelte`                                           | Props e estados dos gráficos                                                                                                                     |
| Notebook   | `marimo check` + export nativo                                               | Notebook executa e é compatível com WASM                                                                                                         |
| E2E        | Playwright + axe-core                                                        | Cenários acima, navegação, busca, tema                                                                                                           |
| Artefato   | Lighthouse CI, size-limit, JS por página, link checker, regras do `_headers` | RNF-01, 02, 05, 06, 07                                                                                                                           |


### Definition of Done

- [ ] Requisito(s) citado(s) no PR e na mensagem de commit
- [ ] Testes do nível adequado escritos, vistos falhando antes e passando depois (spikes e tarefas de infraestrutura provam pelo doc de spike ou pelo pipeline rodando, ver AGENTS.md)
- [ ] Preview revisado em mobile (360 px) e desktop
- [ ] Budgets de performance e acessibilidade verdes
- [ ] `specs/SPEC.md` atualizado se o comportamento mudou
- [ ] `specs/ROADMAP.md` com a tarefa marcada como concluída e a linha de handoff, no mesmo PR

## 12. Roadmap

As tarefas, dependências, gates e o status de cada uma estão em `specs/ROADMAP.md`. Cada tarefa é uma unidade de PR e cita os IDs de requisito desta spec que entrega; esta spec define o quê, o roadmap define a ordem.

O lançamento leva cerca de 6 a 7 semanas para uma pessoa, em quatro fases com um gate cada. A Fase 0 existe para matar o maior risco (integração do marimo) antes de escrever features. O modo inline foi adiado na T-03 e a Fase 2 segue só com iframe.

## Fontes

Conferidas em 09/10/2026.

- [Upgrade to Astro v7](https://docs.astro.build/en/guides/upgrade-to/v7/): Vite 8, compilador Rust, Sätteri como padrão, `compressHTML: 'jsx'`, `src/fetch.ts` reservado
- [Markdown in Astro](https://docs.astro.build/en/guides/markdown-content/): `markdown.processor` com `unified()` ou `satteri()`
- [Content Loader API](https://docs.astro.build/en/reference/content-loader-reference/): opções do `glob()`, incluindo `generateId`
- [astro/zod](https://docs.astro.build/en/reference/modules/astro-zod/): re-export do Zod 4
- [Syntax Highlighting](https://docs.astro.build/en/guides/syntax-highlighting/): `markdown.shikiConfig` com `themes`
- [Zod 4: migration guide](https://zod.dev/v4/changelog): `z.url()`, parâmetro `error`, `z.strictObject()`
- [Deploy your Astro Site to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare): Workers recomendado, `wrangler.jsonc`
- [Cloudflare Workers: Headers](https://developers.cloudflare.com/workers/static-assets/headers/): `_headers`, união por vírgula, detach com `!`
- [Cloudflare Workers: Limits](https://developers.cloudflare.com/workers/platform/limits/): 25 MiB por arquivo, 20.000 arquivos, 100 regras de `_headers`
- [Workers vs. Pages (compatibility matrix)](https://developers.cloudflare.com/workers/static-assets/compatibility-matrix): Cloudflare
- [WebAssembly HTML](https://docs.marimo.io/guides/exporting/webassembly_html/): export WASM, `--execute`, `--include-cloudflare`, cache, pré-cômputo, `MW001–003`, islands
- [moutils](https://github.com/marimo-team/moutils#onnx-runtime-adapter): adaptador ONNX
- [huggingface/blog](https://github.com/huggingface/blog): referência de modelo de autoria

