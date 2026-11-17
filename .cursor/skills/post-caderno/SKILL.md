---
name: post-caderno
description: Caderno marimo de um post do blog (degraus 4 e 5). notebooks/<nome>.py com bloco PEP 723, o componente Notebook no MDX (navegador ou gpu), marimo check --strict e a sessão para a prévia do molab. Use quando um post tiver código para o leitor rodar.
paths:
  - "src/content/posts/**"
---

# post-caderno

Degraus 4 e 5 de um post em `src/content/posts/<pasta>/`. A escada está na SPEC §8.

Leia `src/components/marimo/AGENTS.md` ("O componente" e "O caderno"), a SPEC §7 ("Caderno no molab") e a BRAND §9.7. Não copie o link do molab nem o texto da faixa.

O agente escreve o `.py`. O autor revisa. Fólio e título vêm do frontmatter, e a assinatura é a da BRAND §9.7. O texto de apresentação da primeira célula vem do autor, nesta conversa. Sem frase provisória. Só arquivos dentro da pasta do post (RNF-14). Sem `git add`, commit ou push.

## Arquivo

`notebooks/<nome>.py`. O nome usa `a-z`, `0-9`, `_` e `-`. Bloco PEP 723 com o `marimo` e as dependências. Primeira célula com o cabeçalho da BRAND §9.7. Parâmetros como `mo.ui.*`. Modelo: `src/content/posts/fixture-mdx/notebooks/prova.py`.

O autor edita com `uv run marimo edit --sandbox <arquivo>`.

## Dados

Na pasta do caderno, lidos com `mo.notebook_dir()` ou por caminho relativo. `mo.notebook_location()` não lê no `/wasm` (SPEC §7).

## No MDX

O import usa este nome:

```mdx
import Notebook from "~/components/marimo/Notebook.astro";

<Notebook src="./notebooks/<nome>.py" />
```

Pergunte ao autor se o caderno precisa de pacote sem wheel WebAssembly ou de GPU. Se precisar, `<Notebook src="./notebooks/<nome>.py" gpu />`: o leitor precisa de conta no molab. Um post com caderno é `.mdx`.

## Antes do commit

`uv run marimo check --strict <arquivo>` e `uv run ruff check <arquivo>`.

Sessão, para a prévia estática mostrar saídas:

```sh
uv run marimo export session --sandbox <arquivo>
```

Confira o código 0 e a linha `ok:` antes do commit. Sem os dois, pare e mostre a saída. Exporte de novo só quando o caderno mudar.

## Link

O link só abre depois do push. No preview do PR, a ref é o commit; depois do merge, a `main` (SPEC §7).

## Onde parar

Mudar `Notebook.astro`, o plugin ou o `molabUrl` não é post: é tarefa, e o post espera. Sem `css_file`. Sem commit nem push.
