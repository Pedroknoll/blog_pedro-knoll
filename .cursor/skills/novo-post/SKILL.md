---
name: novo-post
description: Cria um post novo do blog pk.log. Pergunta ao autor título, descrição, tipo e tags, e cria src/content/posts/AAAA-MM-<slug>/index.mdx com draft true. Traz a tabela de degrau e skill e o checklist de publicar. Só por /novo-post.
disable-model-invocation: true
---

# novo-post

Só por `/novo-post`. Cria a pasta do post e para. Título, descrição e tags vêm do autor, nesta conversa. Sem frase provisória no arquivo.

O slug da rota é o nome da pasta (`AAAA-MM-<slug>`), SPEC §6. Só arquivos dentro de `src/content/posts/<pasta>/` (RNF-14). Sem `git add`, commit ou push: o checklist de publicar é impresso, não executado.

## Perguntas

Uma mensagem só. Se um campo não servir, peça de novo antes de criar o arquivo.

- Título, até 90 caracteres. Acima disso, peça de novo.
- Descrição, de 50 a 160 caracteres. Conte e mostre a contagem. O schema valida também o rascunho (SPEC §6).
- Tipo: `article` (Artigo) ou `prototype` (Protótipo). Os rótulos estão em `src/lib/kind.ts`. No frontmatter entra o valor inglês.
- Tags: `^[a-z0-9-]+$`, até 6. Liste as tags dos posts publicados (pasta que não começa com `fixture-` e sem `draft: true`) para reuso.

Com as respostas, proponha o sufixo do slug a partir do título: minúsculas, sem acento, `^[a-z0-9-]+$`. Confirme antes de criar a pasta.

## Arquivo

Crie `src/content/posts/AAAA-MM-<slug>/index.mdx`. `AAAA-MM` é o ano e o mês de hoje. O corpo fica vazio.

Frontmatter na ordem do exemplo da SPEC §6. `pubDate` é a data de hoje. Sem `cover`. Capa só se o autor der `cover` e `coverAlt` juntos.

```yaml
---
title: ""
description: ""
pubDate: AAAA-MM-DD
kind: article
tags: []
draft: true
---
```

Os valores são os que o autor confirmou. `kind` acima é o lugar do campo, não uma escolha.

## Conferir

`SHOW_DRAFTS=true pnpm build` e `ls dist/blog/AAAA-MM-<slug>/index.html`. O `dist/` está no `.gitignore`.

## Degrau e skill

A escada está na SPEC §8. Para montar o post:

| Degrau | Skill |
| --- | --- |
| 0, texto | `post-prosa` |
| 1 a 3, figura | `post-figura` |
| dados de uma figura | `post-dados` |
| 4 e 5, caderno | `post-caderno` |

## Publicar

A trilha Post e a Definition of Done estão no `AGENTS.md`. Imprima este checklist e pare.

- Branch `post/AAAA-MM-<slug>`.
- `draft: false` e `pubDate` do dia da publicação. A pasta fica com o mês da criação.
- `git diff --stat main...` só com a pasta do post.
- `pnpm lint`.
- `pnpm astro check`. Se o post tiver `.svelte`, em seguida `pnpm check:svelte`. O `pnpm lint` não roda os dois.
- Com caderno, `uv run marimo check --strict <arquivo>`.
- PR, todos os checks do PR verdes, preview a 360 px e no desktop, squash merge.

## Onde parar

Criar ou mudar o `src/data/tags.ts`, um componente, o schema ou o CI não é post: é tarefa, e o post espera. Sem commit.
