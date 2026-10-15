# T-03 — spike mdx-marimo

## Veredito

Adiado em 14/10/2026, por custo de manutenção, com base na pergunta 2. O blog segue só com notebooks marimo em iframe (`marimo export html-wasm`).

## Pergunta 1

Peso e tempo até interativo.

Não medida. A decisão de adiar já saía do custo de manutenção da pergunta 2; esta medição não a mudaria.

## Pergunta 2

O build usa o uv embutido no npm, Python 3.12 fixo e `marimo>=0.23.15` resolvido na hora, ignorando o `uv.lock`. Precisa de rede. Falha dentro de um projeto com `requires-python >=3.14`.

Conflito com a SPEC §9 e o AGENTS.md, que pedem o marimo travado no `uv.lock`.

Processo com menos de 0,2 s pode não aparecer no `ps`. Chamada pelo PATH se prova no `shim.log`.

Evidência dos passos 5, 8 e 9: os três builds saíram com status 1 e o mesmo erro (`Using CPython 3.12.10`, incompatível com `>=3.14`). O `shim.log` só tem os marcadores `== no-marimo ==`, `== venv ==` e `== no-venv ==`. No passo 8, `VIRTUAL_ENV` apontava para `.venv` e `command -v marimo` achava `.venv/bin/marimo`, com `SPIKE_MARIMO_EXEC=1`. No passo 9, `VIRTUAL_ENV` estava vazio e `marimo` não estava no PATH. Nos dois, o stderr é o mesmo. Nos descendentes dos passos 5 e 8 aparece `node .../@manzt/uv/bin.cjs run --python 3.12 --with marimo>=0.23.15` (a página com numpy acrescenta `--with numpy`) e o binário `.../@manzt/uv/uv`. No passo 9 esse processo não entrou no snapshot. O `--version` do binário empacotado, no passo 5, imprimiu `uv 0.6.14 (a4cec56dc 2025-04-09)`. A origem desse 0.6.14 fica pendente. No mesmo dia, uma reprodução com esse binário e os argumentos do build (`run --python 3.12 --with marimo>=0.23.15`) imprimiu `marimo 0.25.1` e `3.12.10`. Isso não é leitura do processo do build; a saída está em `spike/out/marimo-build-version.txt`. O uv do sistema, gravado antes de cada build, é `/opt/homebrew/bin/uv`, `uv 0.10.0 (Homebrew 2026-02-05)`.

No `pnpm-lock.yaml`, `@marimo-team/mdx-marimo@0.0.5` depende de `@manzt/uv` 0.8.13. As entradas são `@manzt/uv@0.8.13` e, entre os opcionais, `@manzt/uv-darwin-arm64@0.8.13` e `@manzt/uv-darwin-x64@0.8.13`.

`ls -la` de `node_modules/.pnpm/@manzt+uv@0.8.13/node_modules/@manzt/uv/`, lido antes dos passos 8 e 9: os arquivos do pacote estão em 14 Oct 19:11, e o arquivo `uv` (33452160 bytes) em 14 Oct 20:06. O `stat` desse arquivo: birth `2026-10-14 19:11:29`, mtime `2026-10-14 20:06:25`. O birth coincide com o restante do diretório, extraído no `pnpm add`. O build reescreve o binário `uv` dentro de `node_modules`: birth `2026-10-14 19:11:29`, mtime `2026-10-14 20:06:25`, e o log do passo 5 marca `20:06:24`. O postinstall de `@manzt/uv` estava negado em `allowBuilds`.

## Pergunta 3

Qual versão do runtime marimo o pacote npm carrega e como alinhá-la ao `uv.lock`.

Não medida. A decisão de adiar já saía do custo de manutenção da pergunta 2; esta medição não a mudaria.

## Pergunta 4

Se o `<script type="module">` dispara o Pyodide antes do primeiro paint.

Não medida. A decisão de adiar já saía do custo de manutenção da pergunta 2; esta medição não a mudaria.

## Pergunta 5

Convivência com `remark-math` no mesmo `unified()` e com islands Svelte.

Não medida. A decisão de adiar já saía do custo de manutenção da pergunta 2; esta medição não a mudaria.

## Pergunta 6

Origens que a CSP precisa liberar.

Não medida. A decisão de adiar já saía do custo de manutenção da pergunta 2; esta medição não a mudaria.

## Perguntas abertas

Uma linha cada, para uma reavaliação futura:

- `UV_CONSTRAINT` para travar o marimo do build.
- Um cache de compilação de origem não identificada fez a sonda ser reaproveitada.
- A saída prerenderizada está em base64 no `data-marimo-payload` e não como texto no HTML, o que afeta o RF-08, leitores sem JavaScript e o Pagefind.
- A origem do uv 0.6.14.
- As marimo islands carregadas direto como caminho alternativo.

## Gatilho

Reavaliar com mdx-marimo a partir de 0.1, ou com uma opção pública para controlar Python e projeto no build.

## Evidência

Commit local `056cd88` no branch `t-03-spike-mdx-marimo`, que não entra na `main`.
