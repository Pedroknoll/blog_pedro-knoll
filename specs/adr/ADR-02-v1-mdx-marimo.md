# ADR-02 (v1): mdx-marimo no meio do texto — substituído

- **Status:** substituído em 14/10/2026 pela versão atual do ADR-02 (SPEC §5): marimo só via `marimo export html-wasm` em iframe. O modo inline foi adiado.
- **Decisão original (06/10/2026):** marimo via [mdx-marimo](https://github.com/marimo-team/mdx-marimo) para células no meio do texto; `marimo export html-wasm` em iframe para notebooks inteiros. Alternativas então descartadas: Jupyter + nbconvert estático; Thebe/Binder. Motivo então registrado: o mdx-marimo renderiza a saída no build e hidrata a página como um notebook reativo no Pyodide; o export WASM é o caminho maduro e isolado.

## Por que mudou

O spike T-03 adiou o modo inline por custo de manutenção, não por uma medição de tempo até interativo. As perguntas de peso, runtime npm, paint, convivência com `remark-math` e origens da CSP não foram medidas: não mudavam a decisão.

A pergunta 2 mostrou que o build do mdx-marimo usa o uv embutido no npm, Python 3.12 fixo e `marimo>=0.23.15` resolvido na hora. Ignora o `uv.lock`, precisa de rede e falha num projeto com `requires-python >=3.14`. Isso conflita com a SPEC §9 e com o AGENTS.md, que travam o marimo no `uv.lock`.

Detalhes, perguntas abertas e o gatilho de reavaliação estão em `specs/spikes/T-03-mdx-marimo.md`.

## O que muda na prática

- Notebook marimo só existe como iframe, exportado com `marimo export html-wasm`.
- Sai o ramo `{ mode: inline }` do schema, a regra de fences e a CSP por post inline.
- `@marimo-team/mdx-marimo` sai da lista de dependências pré-aprovadas. Não instalar.
- Reavaliar na T-32, quando o mdx-marimo chegar a 0.1 ou houver opção pública para controlar Python e projeto no build.

## Alternativas consideradas

- **Manter o inline:** descartada pelo custo de manutenção da pergunta 2. As medições de aprovação (notebook interativo em ≤ 10 s) não foram feitas.
- **Só iframe:** adotada. O export WASM isola o runtime e usa o marimo travado no `uv.lock`.

## Fontes

- `specs/spikes/T-03-mdx-marimo.md`
- Commit local `056cd88` no branch `t-03-spike-mdx-marimo` (não entra na `main`)
- [mdx-marimo](https://github.com/marimo-team/mdx-marimo), `examples/with-astro`
- [WebAssembly HTML](https://docs.marimo.io/guides/exporting/webassembly_html/)
