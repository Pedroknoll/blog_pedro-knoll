# ADR-02 (v2): marimo em iframe no post — substituído

- **Status:** substituído em 09/11/2026 pela versão atual do ADR-02 (SPEC §5): marimo só via `marimo export html-wasm`, numa página própria aberta pela barra do lab; sem iframe no post.
- **Decisão original (14/10/2026):** marimo só via `marimo export html-wasm` em iframe. Alternativas então descartadas: Jupyter + nbconvert estático; Thebe/Binder; mdx-marimo no meio do texto (adiado na T-03, ver `specs/adr/ADR-02-v1-mdx-marimo.md`). Motivo então registrado: o export WASM isola o runtime e o marimo fica travado no `uv.lock` ([docs](https://docs.marimo.io/guides/exporting/webassembly_html/)).

## Por que mudou

A decisão de 09/11/2026 (T-71) separa explicar de praticar. Nas duas referências o código não roda dentro do artigo: o artigo explica, o notebook é onde se pratica. O iframe funcionava: com o pôster, o runtime só carregava depois de "Executar" (RF-08 e RNF-03 da época). O problema era misturar as duas coisas na mesma página: pôster, carga condicional, botão "Ativar interatividade" e um notebook espremido na coluna da prosa. Na página própria, o notebook ocupa a tela inteira e o post fica com texto e figuras.

## O que muda na prática

- O export `html-wasm` é a página inteira em `/notebooks/<slug>/<nome>/`, com barra final.
- A barra do lab do post aponta para essa página ("Abrir no marimo"). "Abrir no Colab" só com `gpuUrl`.
- Saem o iframe, o pôster e o botão "Ativar interatividade" do post.
- O campo `mode` sai do schema na T-14. Até lá, o `content.config.ts` ainda o tem.
- No lançamento, o RF-08 cobre só `compute: browser`. Os pesados ficam para a T-17 e a T-33.

## Alternativas consideradas

- **Manter o iframe no post:** descartada; funcionava, mas misturava explicar e praticar e pedia pôster, carga condicional e layout próprio.
- **Link externo (molab, Colab):** descartada; o leitor sairia do domínio e poderia precisar de conta.
- **Página própria:** adotada.

## Fontes

- Decisão de 09/11/2026 com o Pedro (T-71)
- [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/)
- [hesamation/primer-llm-embedding](https://huggingface.co/spaces/hesamation/primer-llm-embedding)
- [WebAssembly HTML](https://docs.marimo.io/guides/exporting/webassembly_html/)
