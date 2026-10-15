# T-04 — spike html-wasm

## Veredito

No marimo 0.25.1, o `compute: cache` da SPEC §7 não funciona para notebooks que treinam com torch. O `--execute` roda o torch num sandbox uv isolado, com Python 3.14, torch 2.14.1 e marimo 0.25.1, a mesma do `uv.lock`. O export tem 26 MB, de 493 a 496 arquivos, maior arquivo de 4,4 MB, nenhum acima de 25 MiB, e de 40 a 56 KB de cache. Mas a célula que treina com torch não entra no cache, nas duas variantes: expondo o modelo (A) ou só arrays numpy (B). O export sai com status 0 mesmo assim. No navegador, essa célula reexecuta, o torch é um stub de módulo e as células dependentes falham. O iframe funciona. O padrão documentado de pré-cômputo, uma função com `@mo.persistent_cache(method="lazy")` que retorna numpy, não foi testado.

## P1

Variante A. Como o `--execute` trata torch.

Comando: `uv run marimo export html-wasm spike/t04/treino.py -o spike/t04/out --mode run --execute`. Status 0. `spike/t04/out/public/cache` presente. A saída traz `Cache save failed for vblA` e `Bundled 13 cache files into spike/t04/out/public/cache`.

Frase do ambiente, da saída do terminal: `Running in a sandbox: /opt/homebrew/bin/uv run --isolated --no-project --compile-bytecode --python 3.14`, com `--with numpy==2.5.4`, `--with torch==2.14.1 ; sys_platform != 'emscripten'` e `--with marimo==0.25.1`.

Alguma requisição contém torch: não. Ver P2.

## P2

Falha. Variante A, medida no navegador. A variante B não foi ao navegador: com a célula de treino fora do cache, o resultado repete a A.

- Células 3 e 4 aparecem sem erro: não. `vblA` (célula 3) não entrou no cache, reexecutou no navegador e falhou. `Xref` (célula 4) falha com `Ancestor raised`, apontando para `vblA`. A perda final não aparece.
- Alguma requisição contém torch: não. O filtro "torch" na Network não mostra nenhuma requisição. O Pyodide carregou Pygments, docutils, jedi, numpy, parso e pyodide-http.

## P3

Variante A. Medido neste export, que saiu com `Cache save failed for vblA`.

- `du -sh` do export: 26M
- `du -sh` de `public/cache`: 52K
- 5 maiores arquivos:
  - `spike/t04/out/assets/Plot-CNtRAZBG.js` — 4.4M
  - `spike/t04/out/assets/loro_wasm_bg-BwsqTTze.wasm` — 3.0M
  - `spike/t04/out/assets/node-sql-parser-DDkYZCP2.js` — 2.3M
  - `spike/t04/out/assets/index-DafnX1Xx.js` — 1.3M
  - `spike/t04/out/assets/cells-CzugpTQu.js` — 954K
- Total de arquivos: 496
- Arquivos acima de 25 MiB: nenhum
- `n_params`: `1*32+32 + 32*1+1 = 97`

Variante B. A célula 3 expunha só `losses`, `xs` e `preds`, e o aviso persistiu com o mesmo id. `Bundled 10 cache files`. Navegador não testado, por critério combinado: com a célula de treino fora do cache, o resultado repete a variante A. Export com status 0. A saída traz `Cache save failed for vblA`.

- `du -sh` do export: 26M
- `du -sh` de `public/cache`: 40K
- 5 maiores arquivos:
  - `spike/t04/out/assets/Plot-CNtRAZBG.js` — 4.4M
  - `spike/t04/out/assets/loro_wasm_bg-BwsqTTze.wasm` — 3.0M
  - `spike/t04/out/assets/node-sql-parser-DDkYZCP2.js` — 2.3M
  - `spike/t04/out/assets/index-DafnX1Xx.js` — 1.3M
  - `spike/t04/out/assets/cells-CzugpTQu.js` — 954K
- Total de arquivos: 493
- Arquivos acima de 25 MiB: nenhum
- `n_params`: `1*32+32 + 32*1+1 = 97`

## P4

O slider funciona, mas as células que dependem do treino herdam o erro. Na variante A, a célula 6 (`bkHC`) mostra `Ancestor raised`, apontando para `vblA`.

## P5

O módulo torch vira stub, com a mensagem já registrada.

- `vblA` é a célula 3. O traceback aponta para `torch.manual_seed(0)`. Erro: `ModuleNotFoundError: No module named 'torch' in this environment (cached def restored lazily; accessing torch.manual_seed requires the real module)`.
- A célula 7 (`PKri`) falha com `Ancestor raised`, apontando para `vblA`.

## Iframe

`spike/t04/host.html` aponta o iframe para `out/index.html`. Servido na raiz `spike/t04`, em `http://127.0.0.1:8000/host.html`. A T-05 serve este `out/`.

- Abre dentro do iframe: sim. O console mostra `[iframe] Running in embedded context`.
- Erros no console: o `ModuleNotFoundError` da célula 3; o `Ancestor raised` das células 4, 6 e 7; o aviso `Not running in a secure context; interrupts are not available`; e o 404 do `favicon.ico`.

## Origens para a T-05

Variante A.

- `wasm.marimo.app` serve `pyodide-lock.json?v=0.25.1&pyodide=v314.0.0`.
- `cdn.jsdelivr.net` serve o runtime do Pyodide e os wheels empacotados.
- `files.pythonhosted.org` serve `marimo_base-0.25.1`, markdown, narwhals e pymdown_extensions.
- O cache é servido pela própria origem: `P_…`, `C_…`, `return.pickle` e `ui.pickle`. Um `C_…` deu 404, coerente com a célula 3 sem cache. `notebook-655d….json` também deu 404.
- Domínio `wasm.marimo.app` confirmado por `grep` nos assets `save-worker` e `worker` do export.

## Achados

- Falha ao salvar o cache é só aviso: o export sai com status 0 e o bundle fica incompleto. A T-17 precisa tratar "Cache save failed" na saída como erro.
- O --execute roda em uv run --isolated --no-project --python 3.14, com versões fixadas: marimo 0.25.1, a mesma do uv.lock, numpy 2.5.4 e torch 2.14.1. O torch entra porque o marcador vale no macOS. Exige rede; o torch tem 121,4 MiB. O export.lock da T-17 deveria registrar essas versões.
- Cada export copia o runtime do marimo, uns 26 MB e cerca de 480 arquivos. Com 20 notebooks, seriam perto de 10.000 arquivos, metade do limite de 20.000 por versão, e cada reexport pesado somaria uns 26 MB ao git. Proposta de tarefa nova: compartilhar um único assets/ entre exports da mesma versão, ou commitar só index.html e public/ e gerar os assets no CI.
- Sem o pacote cryptography, as entradas do cache saem sem assinatura. Risco baixo, porque são servidas pela nossa origem. Adicionar o pacote exigiria pergunta, pela SPEC §9.
- No marimo 0.25.1, uma célula que treina com `torch` não entra no cache, exponha ela o modelo, na variante A e mesmo com `requires_grad_(False)`, ou só arrays `numpy`, na variante B. Ela reexecuta no navegador e derruba as células dependentes. Suspeita, não verificada: o cache tenta guardar o escopo inteiro da célula, inclusive as variáveis com prefixo `_`.
- O navegador carregou numpy 2.4.3, do Pyodide 314.0.0, mas o --execute gerou o cache com numpy 2.5.4. A leitura funcionou, mas a divergência é um risco silencioso. O export.lock da T-17 deve registrar as duas versões, e uma atualização do marimo ou do Pyodide exige reexportar e conferir.

## Perguntas abertas

- `--offline`: não executado.
- Embed do molab, em WASM, para notebooks leves: evitaria a cópia do runtime, mas tira o controle da versão e cria dependência de terceiros. Seria mudança no ADR-02.
- Treino com GPU do molab para o autor: falta saber como gerar o export com cache a partir de lá.
- A pasta `__marimo__/cache/`, ao lado dos notebooks em `src/content/posts`, precisa ir para o `.gitignore` na T-17.
- "Not running in a secure context; interrupts are not available", provavelmente ligada a COOP/COEP. Pergunta para a T-05.
- Testar o padrão precomputed: treino dentro de uma função com `@mo.persistent_cache(method="lazy")` que retorna numpy.
- Abrir uma issue no marimo com `spike/t04/treino.py` como reprodução mínima. Uma correção upstream reabre o `compute: cache`.

## Evidência

Branch `t-04-spike-html-wasm`. `uv run marimo --version` imprimiu `0.25.1`. Variante A: commit `b8d736c`. Variante B: commit `915ee3d`. Este branch não entra na `main`.
