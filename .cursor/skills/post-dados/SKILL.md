---
name: post-dados
description: Dados pré-calculados de um post do blog. data/build.py com bloco PEP 723, entradas em data/raw/, uv run scripts/build-data.py com a pasta do post e pnpm check:data. Use quando uma figura ou um explorável de um post precisar de números calculados.
paths:
  - "src/content/posts/**"
---

# post-dados

Números calculados de uma figura ou de um explorável, na pasta `data/` do post. A regra está na SPEC §8.

O agente escreve o `data/build.py`. O autor revisa. Texto que aparece na página não entra aqui. Só arquivos dentro de `src/content/posts/<pasta>/` (RNF-14). Sem `git add`, commit ou push.

## Pasta

`data/build.py`, entradas em `data/raw/`, saídas e `data/data.lock` ao lado do script. Modelo: `src/content/posts/fixture-mdx/data/build.py`. Não copie o cálculo da fixture.

## build.py

Bloco PEP 723. Lê `raw/`. Grava ao lado de si o JSON: 3 casas, chaves ordenadas, `indent=2`, UTF-8, LF. A serialização é do script.

Com dependência, rode `uv lock --script src/content/posts/<pasta>/data/build.py`. O `data/build.py.lock` entra no commit.

## Rodar

Sempre com a pasta:

```sh
uv run scripts/build-data.py src/content/posts/<pasta>
```

Sem argumento, o runner regrava o lock de todos os posts, fora da pasta (RNF-14). Não rode assim.

## Depois

`pnpm check:data` e `uv run ruff check src/content/posts/<pasta>`.

O JSON se importa no arquivo da figura, `figs/<Nome>.astro` (skill `post-figura`): `import <nome> from "../data/<arquivo>.json";`.

## Gerados

Saídas e `data.lock` não se editam à mão. Mudou a entrada ou o `build.py`, rode o runner de novo.

## Onde parar

Mudar `scripts/build-data.py` ou o `check:data` não é post: é tarefa, e o post espera. Sem commit.
