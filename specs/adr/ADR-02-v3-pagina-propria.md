# ADR-02 (v3): marimo em página própria — substituído

- **Status:** substituído na T-96 pela versão atual do ADR-02 (SPEC §5): marimo no molab.
- **Decisão original (09/11/2026, T-71):** marimo só via `marimo export html-wasm`, numa página própria aberta pela barra do lab; sem iframe no post. Alternativas então descartadas: Jupyter + nbconvert estático; Thebe/Binder; mdx-marimo no meio do texto (adiado, ver `specs/adr/ADR-02-v1-mdx-marimo.md` e `specs/spikes/T-03-mdx-marimo.md`); iframe no post (substituído em 09/11/2026, ver `specs/adr/ADR-02-v2-iframe.md`). Motivo então registrado: o artigo explica e o notebook é onde se pratica, como nas referências da Q13. O iframe pedia pôster, carga condicional, botão de execução e um layout dentro da prosa; a página própria dispensa tudo isso e deixa o Pyodide só em `/notebooks/*` (RNF-03). O export WASM isola o runtime e o marimo fica travado no `uv.lock` ([docs](https://docs.marimo.io/guides/exporting/webassembly_html/)). Revisado em 09/11/2026 (Q14, T-71).

## Por que mudou

O caderno vira complemento opcional de qualquer post. A página própria pedia exportação no build, runtime compartilhado contra o limite de 20.000 arquivos, CSP com `wasm-unsafe-eval` e R2 para os pesados. O molab roda no navegador e no servidor com GPU a partir do arquivo no GitHub. A v2 descartou o link externo porque o leitor sairia do domínio e poderia precisar de conta, e a T-97 confere o login.

## O que muda na prática

- O caderno é complemento opcional de qualquer post, um ou mais por post, e nenhum post é obrigado a ter. O tipo `lab` sai: os tipos são `concept`, `tutorial` e `playbook`.
- O arquivo continua em `src/content/posts/<slug>/notebooks/<nome>.py`, com as dependências no bloco PEP 723. O campo `notebooks` sai; quem aponta o arquivo é o componente.
- O botão é o componente `Notebook`, chamado no MDX: `<Notebook src="./notebooks/<nome>.py" />` abre no navegador, e com `gpu` abre no servidor, com GPU. Um post com caderno é `.mdx`. O build falha se o arquivo não existir.
- O link é `https://molab.marimo.io/github/Pedroknoll/blog_pedro-knoll/blob/<branch>/src/content/posts/<slug>/notebooks/<nome>.py`, com `/wasm` no fim sem `gpu`. O `<branch>` é `main` no build de produção e o branch do PR no build do preview.
- O blog não exporta, não hospeda e não executa caderno. A página do post não carrega Pyodide nem o runtime do marimo.
- Se a T-97 reprovar o molab, o export próprio volta em tarefa nova, e só o link do componente muda.

## Como voltar

Se a T-97 reprovar o molab, as tarefas T-14, T-34 e T-82 canceladas na T-96 são o ponto de partida, e o componente passa a apontar para `/notebooks/<slug>/<nome>/`.

## Fontes

- [molab](https://docs.marimo.io/guides/molab/)
- [WebAssembly HTML](https://docs.marimo.io/guides/exporting/webassembly_html/)
