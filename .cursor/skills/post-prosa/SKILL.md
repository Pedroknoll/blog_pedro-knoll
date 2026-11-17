---
name: post-prosa
description: Blocos de texto de um post do blog (degrau 0). Callout (note, caution, result), bloco de código com title=, fórmula KaTeX dentro do teto de fontes, imagem com alt, referências com a citação [@chave] e apêndices. Use ao escrever ou revisar o index.mdx de um post em src/content/posts/.
paths:
  - "src/content/posts/**"
---

# post-prosa

Degrau 0 de um post em `src/content/posts/<pasta>/`. A escada está na SPEC §8.

O texto que vai para a página (título, descrição, conteúdo do Callout, alt, citação) vem do autor, nesta conversa, e entra onde ele disser. Sem frase provisória. Só arquivos dentro da pasta do post (RNF-14). Sem `git add`, commit ou push.

## Callout

`import Callout from "~/components/ui/Callout.astro";`

`variant`: `note` (Nota de bancada), `caution` (Cuidado) ou `result` (Resultado). No `result`, `value` é opcional (RF-22). Linha em branco antes e depois do conteúdo. Modelo: os três Callouts de `src/content/posts/fixture-mdx/index.mdx`, antes de "Figuras com moldura".

```mdx
<Callout variant="note">

Texto do autor.

</Callout>
```

## Código

Cerca com a linguagem. Se o autor quiser o nome do arquivo na barra, `title=<arquivo>`, como `title=dobro.ts` em `src/content/posts/fixture-md/index.md` (RF-06).

````md
```ts title=arquivo.ts
```
````

## Fórmula

`$…$` na linha e `$$…$$` em bloco. O teto do KaTeX está na SPEC §9. Se o autor pedir `\mathbf`, `\mathbb`, `\mathcal`, `\textit`, um operador grande inline (como `\sum`) ou um delimitador alto (`\left…\right`), pare e avise: isso espera a T-89.

## Imagem

Arquivo em `figs/`, sempre com alt. O alt é do autor.

## Referências e apêndices

`references` e `appendices` ficam no frontmatter (SPEC §6). No texto, `[@chave]`. Duas seguidas: `[@a] [@b]`.

Quebram o build: citação sem referência, referência não citada, citação dentro de link, chave repetida. Os nomes das falhas estão na SPEC §6, "Regras derivadas".

## Antes de gravar

Ênfase com `_…_`. O Prettier reprova `*…*`. Link interno com barra final (SPEC §6).

`pnpm exec prettier --write src/content/posts/<pasta>`

O `.prettierignore` já tira `data/` e `__marimo__/`.

## Onde parar

Mudar `src/components/ui/Callout.astro`, um plugin remark ou o teto de fontes não é post: é tarefa, e o post espera. Sem commit.
