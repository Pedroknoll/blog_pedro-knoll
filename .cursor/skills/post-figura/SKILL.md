---
name: post-figura
description: Figuras de um post do blog (degraus 1 a 3). Figura estática com Figure e as primitivas Vector, Matrix, Tensor, Arrow e Grid; figura em passos com Stepper; explorável com Explorable e client:visible; cada figura num arquivo figs/<Nome>.astro, importado no MDX; figura livre com SVG nesse arquivo, componente Svelte na pasta do post ou imagem pronta. Use quando um post precisar mostrar algo visual.
paths:
  - "src/content/posts/**"
---

# post-figura

Degraus 1 a 3 de um post em `src/content/posts/<pasta>/`. A escada está na SPEC §8.

`title`, `summary`, `caption` e as colunas do "Ver dados" vêm do autor, nesta conversa. Sem frase provisória. `number` segue a sequência do post. `name` é único no post. Só arquivos dentro da pasta do post (RNF-14). Sem `git add`, commit ou push.

## Degrau

Com o autor, escolha o degrau mais baixo que mostra o que ele quer (SPEC §8). Proponha e confirme antes de escrever.

Não use `IslandProof` nem a seção "Uma figura em dois modos" da fixture: aquele componente só serve a ela.

As props do `Figure` estão na seção "Moldura" de `src/components/viz/AGENTS.md`. Modelo: "Figuras com moldura" e "Passos e exploráveis" de `src/content/posts/fixture-mdx/index.mdx`.

## Arquivo da figura

Cada figura fica em `figs/<Nome>.astro`, com o `Figure` e o desenho dentro, e recebe o número pela prop (`const { number } = Astro.props;`). O JSON de `data/` e o `.svelte` local, com o `client:visible`, se importam nesse arquivo. No MDX entram só o import e uma linha, onde o autor quiser: `<Nome number={n} />`.

Não escreva o `Figure` nem SVG no MDX. O Prettier quebra cada `<text>` em linhas, o MDX faz de uma linha solta um `<p>`, e o `<p>` fecha o `svg` no navegador: a figura sai quebrada, e o CI não reprova. A fixture tem o `Figure` no MDX, sem `<text>`: ela serve de modelo para as props, não para o lugar.

```astro
---
import Figure from "~/components/viz/Figure.astro";
import Vector from "~/components/viz/Vector.svelte";

const { number } = Astro.props;
---

<Figure number={number} name="…" width={…} height={…} title="…" summary="…" caption="…" data={…}>
  <Vector x={…} y={…} length={4} />
</Figure>
```

## Degraus 1 a 3

1. `Figure` estático, com `Vector`, `Matrix`, `Tensor`, `Arrow` ou `Grid` no slot. O `Figure` é dono do `svg`.
2. `Figure island` com `Stepper client:visible`. Os dados do "Ver dados" saem de `stepTable` (`~/lib/viz/steps`).
3. `Figure island` com `Explorable client:visible`. O JSON vem de `data/` (skill `post-dados`), no formato que o `Explorable` lê (seção "Contrato" de `src/components/viz/AGENTS.md`), e o "Ver dados" de `heatmapTable` (`~/lib/viz/heatmap`).

No modo island o `Figure` não leva `title`, `summary`, `name`, `width` nem `height`: isso fica no `.svelte`. Sem `client:load` e sem `client:only`. Sem `fetch`.

Até 1.000 elementos SVG por figura. A guarda é `tests/e2e/viz.spec.ts`, em todo `[data-viz]` de post publicado. Um destaque em `accent` por figura (BRAND §9.8).

O `data` do `Figure` é obrigatório. Numa ilustração sem números, o "Ver dados" descreve os elementos, com texto do autor.

## Figura livre

Quando nenhuma primitiva serve, nesta ordem. As três formas já foram medidas: o build, o `astro check`, o `check:svelte`, o ESLint, o Prettier e o `check:js` alcançam a pasta do post. Um componente em `figs/` continua sendo post.

1. SVG no próprio `figs/<Nome>.astro`, no slot do `Figure` estático: `<path>`, `<circle>`, `<text>` nas coordenadas de `width` × `height`. A grade e o `role="img"` são do `Figure`. Zero JS.
2. `figs/<Nome>.svelte`, na pasta do post. Sem `client:*`: `<svelte:options namespace="svg" />` e um `<g>` dentro do `Figure` estático, como as primitivas. Com `client:visible`: o `.svelte` é dono do `svg`, dentro do `Figure island`, no `figs/<Nome>.astro` que o importa. O contrato está em `src/components/viz/AGENTS.md`: `title`, `summary`, `data-viz`, controles `disabled` até hidratar, tokens, 40.000 bytes por island.
3. Imagem pronta, SVG ou PNG em `figs/`, com o `<Image>` de `astro:assets` dentro do `Figure island`, e com alt do autor. Último recurso: cores e fontes ficam fixas, e o texto da imagem só chega ao leitor de tela pelo alt.

```astro
---
import { Image } from "astro:assets";
import Figure from "~/components/viz/Figure.astro";
import desenho from "./desenho.svg";

const { number } = Astro.props;
---

<Figure island number={number} caption="…" data={{ columns: ["…"], rows: [["…"]] }}>
  <Image src={desenho} alt="alt do autor" />
</Figure>
```

Nas três, cor só pelas classes dos tokens (`fill-ink`, `stroke-accent`). Sem hex. `tests/unit/color-tokens.test.ts` não olha a pasta do post: a regra é desta skill e da revisão.

O mesmo desenho num segundo post vira primitiva em `src/components/viz/`. Isso é tarefa.

## Antes de gravar

`pnpm exec prettier --write src/content/posts/<pasta>`

Também `pnpm exec eslint src/content/posts/<pasta>` e `pnpm astro check`; com `.svelte` local, em seguida `pnpm check:svelte`.

## Onde parar

Mudar uma primitiva, o `Figure` ou outro arquivo de `src/components/viz/` não é post: é tarefa, e o post espera. Sem commit.
