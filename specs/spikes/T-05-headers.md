# T-05 — `_headers` e `_redirects` em Static Assets

## Veredito

O desenho da SPEC §10 funciona em Workers Static Assets. Na regra `/notebooks/*`, `! Content-Security-Policy` seguido de uma nova CSP no mesmo bloco entrega uma única CSP, com `wasm-unsafe-eval`. A página que embute o iframe fica com a CSP global, sem `wasm-unsafe-eval` (RNF-07). Com a CSP de notebook final, o export da T-04 roda no iframe sem nenhuma violação de CSP e chega ao mesmo estado da T-04. Foram usados 2 dos 3 ajustes de CSP permitidos. O plano B não é necessário. Primeiro critério do Gate 0 cumprido: preview num PR real, com `_headers` aplicado e detach de CSP.

Medido no preview do PR #5 (rascunho, fechado sem merge): `https://pr-5-blog.p-giacometo.workers.dev`. O export é o da variante B da T-04 (`915ee3d`), copiado para `public/notebooks/t04/treino/` sem o `CLAUDE.md` (492 arquivos), para imitar `/notebooks/<slug>/<nome>/`.

## P1 — Detach e nova CSP no mesmo bloco

Funciona. `curl` com GET em `/notebooks/t04/treino/`: um único header `Content-Security-Policy`, com um único `default-src`, contendo `wasm-unsafe-eval`. A CSP global não aparece.

Em `/t05-host/`, a página que embute o iframe, só a CSP global: `default-src 'none'; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'`, sem `wasm-unsafe-eval`.

## P2 — Headers repetidos

O header marcador `X-T05-Rule`, presente nas regras `/*` e `/notebooks/*`, voltou em duas linhas no HTTP/2: `x-t05-rule: global` e `x-t05-rule: notebooks`. Não veio como uma linha só, unida por vírgula, como a doc descreve. Pela semântica HTTP, as duas formas são equivalentes, e para a CSP dá no mesmo: duas linhas são duas políticas. Consequência para a T-16: o teste de artefato e o teste no preview contam ocorrências do header e de `default-src`, em vez de procurar vírgula.

## P3 — Barra final e cache

`wrangler.jsonc` sem `html_handling`, ou seja, `auto-trailing-slash`.

| Pedido | Status | `Location` | CSP |
|---|---|---|---|
| `/notebooks/t04/treino` | 307 | `/notebooks/t04/treino/` | de notebook |
| `/notebooks/t04/treino/` | 200 | — | de notebook |
| `/notebooks/t04/treino/index.html` | 307 | `/notebooks/t04/treino/` | de notebook |

O `index.html` explícito redireciona direto para a forma com barra, num salto só. A tabela da doc sugeria `/pasta`. As regras valem para a URL pedida, inclusive em respostas de redirect e em 404: os 307 carregam a CSP de notebook, e o 301 do `_redirects` e os 404 carregam a global. Consequência para a T-15: o `MarimoFrame` usa `/notebooks/<slug>/<nome>/`, com barra.

Cache: `/notebooks/t04/treino/assets/index-DafnX1Xx.js` recebeu `Cache-Control: public, max-age=31536000, immutable` pela regra `/notebooks/:slug/:nome/assets/*`. O HTML ficou no padrão da Cloudflare, `public, max-age=0, must-revalidate`. A regra da SPEC §10, `/notebooks/*/assets/*`, tem dois splats, e a doc da Cloudflare permite um só por URL. A forma com placeholders é a correção.

## P4 — CSP de notebook com `wasm-unsafe-eval` e as origens do Pyodide

Funciona, com dois ajustes.

1. CSP inicial, montada só com as origens da T-04. O console do iframe recusou quatro scripts inline do `index.html` do export, um deles a configuração de montagem do marimo (`mount config not found`, o app não sobe); estilo inline do `index.html` e de `tooltip-*.js`; e uma fonte `data:`.
2. Ajuste 1 (`6ca364d`): os quatro hashes `sha256` informados pelo Chrome em `script-src`, `style-src 'unsafe-inline'` e `font-src data:`. O notebook monta e o Pyodide carrega Pygments, docutils, jedi, numpy, parso e pyodide-http. Sobra uma violação: `img-src` recusando `data:image/x-icon`, o favicon de status do marimo (`panels-*.js`).
3. Ajuste 2 (`fbdac0a`): `img-src data:`. Nenhuma violação de CSP no console.

Nenhuma violação envolveu `cdn.jsdelivr.net`, `files.pythonhosted.org` ou `wasm.marimo.app`: as origens da T-04 bastam. `worker-src 'self'` basta; o worker do marimo é do próprio host.

Estado final do notebook, igual ao da T-04: `vblA` falha com `ModuleNotFoundError: No module named 'torch'`, e `Xref`, `PKri` e `bkHC` mostram `Ancestor raised`. São erros do `torch`, não da CSP. No iframe, em modo `run`, a tela passa por três estágios:

1. As saídas pré-renderizadas pelo `--execute` aparecem: a perda final (`0.0025567165575921535`), o slider em 0 e `xs[0] = -3.0`.
2. Quando o kernel reexecuta `vblA` e falha, aparece "An internal error occurred. See console for details."
3. Fica só o slider; as saídas que dependem do treino somem.

Ou seja, o leitor vê o resultado do treino por alguns segundos e depois o perde. Isso reforça a T-33: com `compute: cache` e `torch`, o export é pior que um `static`.

Hash de estilo não entra: com um hash na diretiva, o navegador ignora `'unsafe-inline'`, e os estilos aplicados por JS voltariam a ser bloqueados. `'unsafe-inline'` em `style-src` não contradiz o RNF-07; `script-src` não tem `'unsafe-inline'` nem `'unsafe-eval'`.

Os hashes dependem do conteúdo exato do `index.html` de cada export. Consequência para a T-16: a integração calcula os hashes dos scripts inline de cada export no build.

`_headers` final, do commit `fbdac0a`:

```text
/*
  Content-Security-Policy: default-src 'none'; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-T05-Rule: global

/notebooks/*
  ! Content-Security-Policy
  Content-Security-Policy: default-src 'none'; script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net 'sha256-J66DGBNYRlkjF6eeQbWMJ8sqzD39RgU33eE7Djfk+M8=' 'sha256-wNw1OS5Za9EAkraslcOYnQGFkuy3QICydhaL3nPEhV4=' 'sha256-Hgm6BtGJry2U0mS4Dxl2bRkghgiWqDdmJCR4Is8WHFU=' 'sha256-TXmhmuKLq9jvARc+ijzS59YJJaxsyhdMnGvrPsOvOlQ='; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://wasm.marimo.app https://cdn.jsdelivr.net https://files.pythonhosted.org; worker-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'
  X-T05-Rule: notebooks

/notebooks/:slug/:nome/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

A CSP global acima serve só à página hospedeira estática do spike. A CSP global das páginas do Astro é da T-16.

## P5 — `_redirects`

`/t05-redirect` respondeu 301 com `Location: /notebooks/t04/treino/`. `/_headers` e `/_redirects` responderam 404: não são servidos como assets.

## P6 — Aviso de interrupts

O aviso `Not running in a secure context; interrupts are not available.` se repetiu em HTTPS, dentro de um iframe da mesma origem. A causa não é falta de HTTPS. Os interrupts do marimo em WASM usam `SharedArrayBuffer`, que exige isolamento de origem (`Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp` ou `credentialless`). Os valores de `isSecureContext` e `crossOriginIsolated` no contexto do iframe não foram registrados; a decisão não dependia deles.

Decisão: v1 sem interrupts. O leitor não consegue parar uma célula em execução, o que pouco importa em modo `run` com `compute: precomputed`. Habilitar exigiria COOP e COEP; pela spec HTML, não conferida neste spike, o isolamento de um iframe depende também do documento de topo, o que afetaria a página do post e embeds de terceiros (T-28, T-29). Não testado.

## Achados

- `curl -I` (HEAD) voltou vazio em `/t05-host/` e travou em `/notebooks/t04/treino`; com GET (`curl -sS -o /dev/null -D -`), tudo respondeu. Não investigado. Os testes da T-13 e da T-16 usam GET.
- O export do marimo traz um `CLAUDE.md` com as instruções do assistente de IA do marimo. Entrou no `b8d736c`, o primeiro commit de export da T-04. Foi removido da cópia do spike: seria publicado e poderia ser lido como instrução pelo agente do Cursor. Pendência da T-14: remover de cada export, ou usar uma opção do marimo que o evite, e avaliar `public/notebooks/` no `.cursorignore`.
- `pnpm astro check` derrubou o Node localmente (provável falta de memória) ao analisar os JS do export: o `tsconfig.json` tem `include: ["**/*"]` e só exclui `dist` e `node_modules`. No CI, o job `lint` falhou. Com `public/notebooks` no `exclude`, só neste branch (`4cae8ee`): 9 arquivos, 0 erros. ESLint e Prettier já ignoram `public/notebooks/` (`pnpm lint` em 0,63 s). Proposta de tarefa nova: excluir `public/notebooks/` e `exports/` do `tsconfig.json` antes da T-14; o `exports/` é commitado e quebraria o CI na T-17.
- Um iframe sem dimensões é desenhado com 300 × 150 px. Consequência para a T-15: o `MarimoFrame` define largura e altura.
- Plano B da SPEC §10: Transform Rules são configuradas por zona, e o `workers.dev` não é uma zona da conta. Até a T-27, a alternativa seria trocar `/*` por regras explícitas por rota (`/`, `/blog/*`, `/tags/*`, `/page/*`, `/sobre`, `/_astro/*`…). Não foi necessária.
- Avisos do console sem relação com a CSP: `tool.marimo.export in script metadata is ignored for security reasons` e `LazyLoader verification='on' degraded to 'off' because the 'cryptography' package is not installed` (já na T-04).
- O branch do spike foi publicado para o preview rodar. O GitHub mantém a ref do PR #5 mesmo com o branch remoto apagado, então o export fica no histórico público do repositório.

## Perguntas abertas

- Interrupts com COOP e COEP: o que precisaria mudar na página do post e nos embeds.
- Por que HEAD falhou no preview.
- Se o marimo tem opção para não gerar o `CLAUDE.md` no export.

## Evidência

Branch `t-05-spike-headers`, PR #5 (rascunho, fechado sem merge). Commits: `12c939f` (export), `76ac8a2` (`_headers`, `_redirects` e página hospedeira), `4cae8ee` (`tsconfig`), `6ca364d` (ajuste 1), `fbdac0a` (ajuste 2). Este branch não entra na `main`.
