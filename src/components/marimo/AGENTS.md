# Agent — src/components/marimo/

Complementa o `AGENTS.md` da raiz e prevalece no que for mais específico. Fontes: SPEC §7 (cadernos marimo), seções 9.6, 9.7 e 10 do BRAND e o spike da T-97 (`specs/spikes/T-97-molab.md`). Em conflito de comportamento, vale a SPEC.

## O componente

- `Notebook.astro` é `.astro` sem `client:*` e sem JavaScript: uma faixa com um link para o molab. Sem iframe e sem runtime do marimo na página (RNF-03).
- No MDX do post, importado com o nome `Notebook` (`import Notebook from "~/components/marimo/Notebook.astro";`) e chamado onde o autor quiser, uma ou mais vezes: `<Notebook src="./notebooks/<nome>.py" />` roda no navegador (`/wasm`); `<Notebook src="./notebooks/<nome>.py" gpu />` leva à prévia estática do molab, de onde o leitor com conta no molab roda no servidor com GPU. Um post com caderno é `.mdx`.
- O plugin `src/lib/remark-notebook.mjs`, nos dois `unified()`, acha cada `<Notebook>`, confere que o `src` é `./notebooks/<nome>.py` (nome em `a-z`, `0-9`, `_` e `-`) e que o arquivo existe, e troca o `src` pelo caminho no repositório (`src/content/posts/<slug>/notebooks/<nome>.py`). Senão, o build falha com `Caderno fora de ./notebooks/<nome>.py: <src> em <arquivo>` ou `Caderno não encontrado: <src> em <arquivo>`. Importado com outro nome, o plugin não acha o componente, e o build falha com `Caderno sem o caminho do repositório: <src> (importe o componente como Notebook)`.
- O link sai de `molabUrl` (`src/lib/notebook.ts`): `https://molab.marimo.io/github/Pedroknoll/blog_pedro-knoll/blob/<ref>/<caminho>`, com `/wasm` no fim sem `gpu` e sem `/wasm` com `gpu`.
- A `<ref>` vem de `NOTEBOOK_REF`, sem prefixo `PUBLIC_` (`notebookRef`): `main` sem a variável (produção, local e o job `build`); no job `preview`, o commit do PR (`github.event.pull_request.head.sha`), porque o molab não abre caderno de branch com `/` no nome, nem com `%2F`, e os branches de post são `post/<slug>` (T-97). Uma ref com `/` quebra o build de uma página com caderno.
- O link abre na mesma aba, sem `target`. O nome acessível é o texto do botão.

## Marca

- Faixa com filete em cima e embaixo (`border-y border-line`) e fundo `sheet` (BRAND §4, a faixa do caderno): o texto à esquerda e o botão à direita; numa tela estreita, o botão desce para baixo do texto.
- Sem `gpu`: "Este caderno roda no navegador. Mude os parâmetros e anote o que acontecer." e o botão **Abrir no marimo**, fundo tinta e texto papel (`bg-ink text-surface`).
- Com `gpu`: "Este caderno roda num servidor com GPU. Para rodar, é preciso uma conta no molab; a GPU se escolhe no painel Compute." e o botão **Abrir com GPU**, com borda tinta (`border border-ink text-ink`).
- Botões em IBM Plex Mono 12,5 px, cantos retos e 44 px de altura, com sublinhado no hover e no foco, como o link da página 404 (BRAND §9.11). O foco é o global (BRAND §9.10).
- Só os tokens da lista fechada, sem hex e sem `dark:`. A guarda de cores (`tests/unit/color-tokens.test.ts`) varre esta pasta.

## O caderno

- O `.py` fica em `notebooks/` na pasta do post, com as dependências no bloco PEP 723 dele. O blog não exporta nem hospeda caderno.
- O molab lê o arquivo do GitHub: o repositório segue público, e o caderno só existe para o molab depois do push, no commit do link. Na T-97, o link de um branch apagado quebrou na hora, e o molab não guarda cópia.
- Primeira célula: cabeçalho renderizado com a assinatura, o fólio do post e o título. Parâmetros como controles do marimo (`mo.ui.slider` etc.), não como constantes soltas (BRAND §9.7).
- Dados na pasta do caderno, lidos com `mo.notebook_dir()` ou pelo caminho relativo; `mo.notebook_location()` não lê no `/wasm` (T-97).
- Sem `pk.css` e sem `css_file`: o molab não aplica o CSS do caderno em nenhum dos modos (T-97). O caderno fica com o estilo do molab, e a marca entra pelo cabeçalho da primeira célula.
- No navegador (`/wasm`), só pacotes com wheel WebAssembly; `torch` e treino pesado vão com `gpu`. O molab roda a versão do marimo dele (0.25.2 em 16/11/2026, T-97).
- As saídas só aparecem na prévia estática com o `__marimo__/session/` commitado (`marimo export session`); é opcional.
