# T-97 — caderno no molab

## Veredito

Seguir com o molab, só no navegador (`/wasm`). O `leve.py/wasm` abre sem login e roda sozinho. Ficou interativo em 6,9 s de mediana (6854 ms, 3 rodadas), abaixo do teto de 10 s da SPEC (Métricas de sucesso). O servidor fica fora do caminho padrão: pede login, pede dois cliques ("Run it now" e depois "Run on server") e a GPU nasce em "None", escolhida à mão no painel Compute. Das 3 rodadas logadas do `leve.py` sem `/wasm`, 1 ficou pronta (9 s), uma passou de 5 min e uma não iniciou.

| Pergunta | /wasm | Servidor |
|---|---|---|
| Login | Não pediu. Rodou sem clique (M1) | Pede login. Sem ele, "Run on server" abre a página de entrar (M2) |
| Tempo até ficar interativo | Mediana 6,9 s (6854 ms), 3 rodadas do `leve.py` | 9 s, uma acima de 5 min e uma que não iniciou. A da GPU: 11 s, 1 rodada, a partir de "Apply and restart" |
| Dados | `mo.notebook_location()` falhou (M1). `mo.notebook_dir()` e `public/pontos.csv` leram 5 linhas, soma de y = 55 (M7) | Na rodada que ficou pronta: 5 linhas, soma de y = 55, caminho `/marimo/public/pontos.csv` (M2) |
| `css_file` | Não aplicado (M1) | Não aplicado na rodada que ficou pronta (M2) |
| PEP 723 | `humanize` 4.9.0 (M1) | `humanize` 4.9.0 na rodada que ficou pronta e na da GPU (M2, M3) |
| `torch` com GPU | `ModuleNotFoundError` (M4, 1 rodada) | `torch` 2.11.0+cu130, GPU NVIDIA RTX PRO 6000 Blackwell Server Edition, matmul 11,9 ms. A GPU foi escolhida à mão (M3, 1 rodada) |
| Versões | marimo 0.25.2, Python 3.14.2, `emscripten` | marimo 0.25.2, Python 3.13.11, `linux` |

O link sem `/wasm` abre a prévia estática. O servidor com GPU é outro passo, depois do login e da escolha no painel. A T-99 corrige a SPEC; este spike não a edita:

- (a) O atributo `gpu`. O link sem `/wasm` abre a prévia estática, e o servidor com GPU fica atrás do login, dos dois cliques e do painel Compute (Q18, RF-08, §7 itens 1 e 2, §11 no cenário "o botão aponta para o molab", ADR-02). A T-99 decide se o atributo fica, e com que texto.
- (b) Os dados. No `/wasm`, `mo.notebook_dir()` e o caminho relativo `public/pontos.csv` leem o arquivo; `mo.notebook_location()` não (§7 item 3 e o item marimo das Armadilhas do AGENTS).
- (c) O `css_file` não foi aplicado nos dois modos. O `pk.css` não nasce (§7 item 4, BRAND §9.7, a linha do `pk.css` no Mapa do AGENTS e a linha da T-18 no ROADMAP).

## Pergunta

O molab abre o caderno a partir do arquivo no GitHub, com e sem `/wasm`, e roda sem login? Em quanto tempo fica interativo? Lê o arquivo de dados com `mo.notebook_location()`? Aplica o `css_file`? Instala o `humanize==4.9.0` do bloco PEP 723? O `torch` roda no servidor com GPU? Qual é a versão do marimo de lá?

## O que foi medido

Em 16/11/2026 (horários do Mac, UTC−3), no branch `t-97-spike-molab`. Commits: cadernos `e6b5cfd` (`e6b5cfdd802d44418c761c834d9dba76de61ec6c`) e sonda de dados `a32301b` (`a32301baf99e49f310a46ab97cc2a603532d1851`). Mac, Chrome 157.0.8103.51 (versão oficial, arm64). A rede, no fast.com, deu 920 Mbps de download, medida uma vez no fim da sessão, depois do M3.

Base dos links: `https://molab.marimo.io/github/Pedroknoll/blog_pedro-knoll/blob/t-97-spike-molab/src/content/posts/fixture-mdx/notebooks/`.

- **/wasm.** Script `medir-wasm.cjs` (Playwright do projeto, canal `chrome`). Um Chrome novo e limpo por rodada, no mesmo espírito de uma janela anônima, sem tocar na página. O tempo é `pronto` (última célula, relógio do Mac) menos `t0` (relógio do Mac logo antes de abrir o link), em ms. O `performance.timeOrigin` sai junto. No M1 ele fica 6 ms, 3 ms e 4 ms acima do `t0`. Versões do script: v1 no M1 e no M4, v2 no M5b e no M6, v7 no M7. As v3 a v5 só serviram às tentativas do M2 sem login, e as v3 e v4 não valem como tempo.
- **Servidor.** À mão, no Chrome normal do autor, já logado. Cronômetro do celular, do clique em "Run on server" (M2) ou em "Apply and restart" (M3) até aparecer o `pronto`. Precisão de cerca de 0,5 s, pelo reflexo.
- **Teto.** O da SPEC (Métricas de sucesso): caderno interativo em até 10 s, em desktop de banda larga. Vale para os dois modos. Os começos de contagem são os de cima.
- **Prévia estática.** Sem `__marimo__/session/` commitado, o link sem `/wasm` mostra o código das células e o markdown renderizado, e fica sem as saídas das células de código. É o que a SPEC §7 item 5 descreve. Não é falha.

O `pesado.py/wasm` (M4) e a sonda (M7) tiveram 1 rodada cada. O M3 teve 1 rodada; as rodadas 2 e 3 não foram feitas. Safari, Firefox e celular não foram medidos.

## P1 — Login

No `/wasm` (M1) o caderno não pediu login e rodou sozinho. O frame carregado foi `https://marimo.app/gh/Pedroknoll/blog_pedro-knoll/t-97-spike-molab/e`, com `mode=edit` e o `leve.py` como entrypoint. O slider muda o número (fator × 7).

Sem `/wasm`, a primeira tela é a prévia estática, com a faixa "Read-only preview. Run it now without saving, or fork to edit in your workspace." e os menus "Preview", "Share", "Fork" e "Sign In". "Run it now" abre a janela "Run this notebook on a server?", com o aviso de caderno não verificado, o "Script metadata" (o bloco PEP 723, "3 packages") e os botões "Cancel" e "Run on server".

Sem login, "Run on server" vai para `molab.marimo.io/sign-in/`, com "Sign in to marimo", "Continue with Google", o campo de e-mail e, no rodapé, "Want early access? Join waitlist". Rodar no servidor pede login. Logado, o mesmo link abre a mesma prévia, com o menu da conta no lugar de "Sign In". Depois de "Run on server", o editor mostra "Unverified notebook", o menu "Server", o botão de specs e a faixa de que o caderno é espelho do GitHub e as mudanças não são salvas. Os prints do autor registram a prévia, a janela, a página de login e o editor.

## P2 — Tempo até ficar interativo

M1, `leve.py/wasm`, script v1, 3 rodadas. O tempo da mediana é `pronto` − `t0`.

| Rodada | t0 (ms) | timeOrigin (ms) | pronto (ms) | pronto − t0 (ms) |
|---|---|---|---|---|
| 1 | 1794846186174 | 1794846186180 | 1794846193426 | 7252 |
| 2 | 1794846194136 | 1794846194139 | 1794846200698 | 6562 |
| 3 | 1794846201218 | 1794846201222 | 1794846208072 | 6854 |

Mediana: 6854 ms, isto é 6,9 s. As três ficaram abaixo de 10 s.

Antes do script, o autor mediu o M1 à mão, com `timeOrigin` e `pronto` no console. A rodada 1 deu 6388 ms. A rodada 2 deu 25397 ms e foi descartada: o `pronto` muda quando o slider se mexe, e não se sabe se ele foi mexido. A rodada 3 à mão não foi feita.

Outras aberturas no `/wasm`, 1 rodada cada, pelo mesmo `pronto` − `t0`:

| Medida | Caderno | pronto − t0 |
|---|---|---|
| M4 | `pesado.py/wasm` | 5921 ms |
| M6a | `leve.py/wasm` no branch `t-97-apagar`, antes de apagar | 8518 ms |
| M7 | `sonda.py/wasm` | 7806 ms |

M2, `leve.py` sem `/wasm`, logado, cronômetro a partir de "Run on server":

| Rodada | Resultado |
|---|---|
| 1 | Não ficou pronto em 5 min. Às 14:07:54 ainda estava em "Starting kernel · Connecting to this notebook." |
| 2 | Pronto em 9 s |
| 3 | Não iniciou. A mensagem foi "We couldn't start your notebook.", com `reason` "EventSource connection failed", copiada em 2026-11-16T17:18:40.765Z. O tempo até o erro não foi medido |

M3, `pesado.py` sem `/wasm`, logado, com a GPU escolhida à mão. Uma rodada: 11 s do clique em "Apply and restart" até o `pronto`. As rodadas 2 e 3 não foram feitas. Os 11 s contam a partir do restart, e não da abertura do link.

## P3 — Dados

No M1 (`leve.py/wasm`), `mo.notebook_location() / "public" / "pontos.csv"` apontou para `https://marimo.app/gh/Pedroknoll/blog_pedro-knoll/t-97-spike-molab/src%2Fcontent%2Fposts%2Ffixture-mdx%2Fnotebooks%2Fleve.py/cdn/@marimo-team/frontend@0.25.2/dist/public/pontos.csv`. A leitura falhou: `KeyError: 'y'`.

No M2, rodada 2 (a que ficou pronta no servidor), o mesmo `mo.notebook_location()` apontou para `/marimo/public/pontos.csv` e a leitura deu 5 linhas, soma de y = 55. As rodadas 1 e 3 não chegaram a essa célula.

A sonda M7 (`sonda.py/wasm`, 1 rodada, 7806 ms, `sys.platform` `emscripten`) separa o que lê e o que não lê:

| Sonda | Resultado |
|---|---|
| cwd | `/marimo/src/content/posts/fixture-mdx/notebooks` |
| lista do cwd | `leve.py`, `notebook.py`, `pesado.py`, `public`, `sonda.py`, `t97.css` |
| `mo.notebook_dir()` | `/marimo/src/content/posts/fixture-mdx/notebooks` |
| `notebook_dir()/public/pontos.csv` | 5 linhas, soma de y = 55 |
| `public/pontos.csv` relativo ao cwd | 5 linhas, soma de y = 55 |
| `src/content/posts/fixture-mdx/notebooks/public/pontos.csv` relativo ao cwd | `FileNotFoundError`, errno 44 |
| busca por `pontos.csv` no disco | só `/marimo/src/content/posts/fixture-mdx/notebooks/public/pontos.csv` |
| pandas na URL raw do GitHub | 5 linhas, soma de y = 55 |
| `pyodide.http.open_url` na URL raw | 5 linhas, soma de y = 55 |

No `/wasm`, os arquivos do repositório estão no disco do Pyodide em `/marimo/<caminho no repositório>`, e o cwd é a pasta do caderno. `mo.notebook_dir()` e o caminho relativo leem o CSV. `mo.notebook_location()`, medido no M1, não lê. O `notebook.py` da lista não está no repositório.

No clone, antes das medidas, o `leve.py` rodou em sandbox (`marimo export session --sandbox`, marimo 0.25.2) e deu `humanize` 4.9.0, 5 linhas, soma 55. O `pesado.py` não rodou local: só passou no `marimo check`.

## P4 — css_file

O `leve.py` pede `css_file="t97.css"`. Com ele aplicado, os títulos sairiam em fonte monoespaçada e com sublinhado ondulado, e `--t97-css` valeria `aplicado`.

No M1 o título "Ambiente" saiu como `h2`, `font-family` "Lora, serif", `text-decoration-line` `none`, e `--t97-css` vazio. O `t97.css` não foi carregado. Os prints do autor mostram os títulos em serifa, sem sublinhado ondulado.

No M2, rodada 2, o `css_file` também não foi aplicado: títulos em serifa, sem mono nem ondulado.

A sonda 2 do M7 lista o `t97.css` no disco do `/wasm`. O arquivo está lá, e o estilo mesmo assim não entra. No clone, `marimo export html --sandbox` do `leve.py` embute o `t97.css` (`--t97-css: aplicado`, `underline wavy`): o arquivo do caderno está certo.

## P5 — PEP 723

O bloco pede `humanize==4.9.0`. Onde a célula rodou, a linha foi "humanize 4.9.0 (o bloco pede 4.9.0)": no M1 (`/wasm`), na rodada 2 do M2 (servidor) e no M3 (servidor com GPU). O `medidas.md` não traz essa linha para o M4.

## P6 — torch com GPU

No M4 (`pesado.py/wasm`, 1 rodada, 5921 ms) o `torch` falhou: `ModuleNotFoundError: No module named 'torch'`. marimo 0.25.2, Python 3.14.2, `emscripten`.

No M3 o link sem `/wasm` abre a mesma prévia do M2, e "Run it now" / "Run on server" seguem o mesmo caminho. Sem login não se chega ao painel: "Run on server" leva ao login, como no M2. Logado, o botão de specs (ícone de chip, ao lado do menu "Server") abre o painel "Compute", com CPU "4 cores", memória "32 GiB" e GPU numa lista com "None" (marcado) e "RTX Pro 6000 (Blackwell)". O print do autor, às 14:20:09, mostra o painel com o caderno ainda em "Connecting...". O caderno abre com GPU "None". O autor escolheu "RTX Pro 6000 (Blackwell)" e clicou em "Apply and restart".

A rodada 1, logado, deu 11 s desse clique até o `pronto`. Esses 11 s ficam acima do teto de 10 s, e a contagem começa no restart. Ambiente: marimo 0.25.2, Python `3.13.11 (main, Feb 3 2026, 03:08:54) [GCC 14.2.0]`, `sys.platform` `linux`. PEP 723: `humanize` 4.9.0. A célula de GPU: `torch` `2.11.0+cu130`, GPU `NVIDIA RTX PRO 6000 Blackwell Server Edition`, matmul 4096×4096 na GPU em 11,9 ms (média de 10). O `pronto` foi 1794849743149. As rodadas 2 e 3 não foram feitas.

## P7 — Versões

O `marimo check` local, com o marimo 0.25.2, e os dois modos no molab mostraram o marimo 0.25.2. No console do M5, o `controller.js` também veio com `version=0.25.2`.

| Onde | marimo | Python | `sys.platform` |
|---|---|---|---|
| `/wasm` (M1, M4) | 0.25.2 | 3.14.2 | `emscripten` |
| Servidor (M2 rodada 2, M3) | 0.25.2 | 3.13.11 | `linux` |
| `marimo check` local | 0.25.2 | — | — |

No M1 a linha de Python apareceu cortada na tela: `3.14.2 (main, Jun 9 2026, 08:15:54) [Clang 23.0.0git …`. No servidor a linha inteira foi `3.13.11 (main, Feb 3 2026, 03:08:54) [GCC 14.2.0]`. O M7 só registrou `emscripten`.

## Para a T-18

A T-18 monta o link com o branch do build. Um branch com `/` no nome não abre, nem com `%2F`. Os branches de post são `post/<slug>`, então o preview de um post cai nesse caso.

O M5 usou o branch `spike/t-97-molab`, no commit `e6b5cfd`, com `leve.py/wasm`. A página ficou em "Something went wrong" e "Failed to fetch:". O console deu 404 em `marimo.app/gh/Pedroknoll/blog_pedro-knoll/spike/export_demos/wasm-intro.py`: o molab tomou só `spike` como branch. O script foi parado com Ctrl+C antes dos 120 s, sem json. O M5b escreveu a barra como `%2F` (`spike%2Ft-97-molab`, script v2, 1 rodada) e também não abriu: "Something went wrong · Failed to fetch:". O `%2F` não contorna.

Um branch apagado quebra o link na hora. O M6 usou `t-97-apagar`, sem `/`, no mesmo `e6b5cfd`. Antes de apagar (M6a), o `leve.py/wasm` abriu em 8518 ms, com as mesmas linhas do M1. O branch foi apagado às 13:40:57. Logo depois, o `/wasm` não abriu ("Something went wrong · Failed to fetch:") e o link sem `/wasm` também não ("Failed to Download File": o arquivo não pôde ser baixado do GitHub). O molab não guarda cópia. A medida de 15 min depois não foi feita.

A prévia estática, sem `__marimo__/session/` commitado, fica sem as saídas das células de código. É o esperado na SPEC §7 item 5.

## Achados

Os dois primeiros são da T-74. O `marimo check` da conferência, no clone, rodou nos três cadernos com `uv tool run --from marimo==0.25.2` e saiu sem aviso, com exit 0.

- O marimo está fora do `pyproject.toml` e do `uv.lock`, contra a SPEC §9 ("marimo travado no `uv.lock` para o `marimo check` e o uso local"). `uv run marimo check` não roda.
- O ruff 0.17.0 do `uv.lock`, no `leve.py` e no `pesado.py`, aponta 6 erros: 5 `PLR1711` (o `return` vazio que o marimo grava no fim da célula) e 1 `B018` (a expressão solta que é a saída da célula). Os `except Exception` do spike levam `# noqa: BLE001`.
- No `/wasm`, a pasta do caderno lista um `notebook.py` que não está no repositório (sonda 2 do M7).
- O push dos branches dos cadernos não disparou o workflow `ci` (`gh run list` devolveu "no runs found" nos dois).

## Perguntas abertas

- A página de login mostra "Want early access? Join waitlist". Não foi medido se um leitor novo cria conta na hora.
- A confiabilidade do servidor foi medida numa tarde só. Das 3 rodadas logadas do M2, uma passou de 5 min e uma não iniciou.
- As rodadas 2 e 3 do M3 não foram feitas.
- Safari, Firefox e celular não foram medidos.

## Evidência

Branch `t-97-spike-molab`, commits `e6b5cfd` (`e6b5cfdd802d44418c761c834d9dba76de61ec6c`, cadernos) e `a32301b` (`a32301baf99e49f310a46ab97cc2a603532d1851`, sonda). Os cadernos não entram na `main`.

Saídas fora do repositório, em `~/Desktop/t97-saidas/`: `medidas.md` (sha256 `60726880a0f9d2285f88bdcafa3843bee7ed59d1ea100b82ff453766b6cbfa66`), `t97-cadernos.patch` (sha256 `a2fa36f24e5c5727a23c70ce0c0a02734cf520ae84ff1a0904674425da79869a`) e `t97-sonda.patch` (sha256 `f7372c179becdc2bdbff56f83db6b7f8814d111084eff90d3786dd54d3f2dc27`). O `medidas.md` registra o sha256 de `sonda.py` começando por `58e18b0d`. Os prints do autor estão na mesma pasta.
