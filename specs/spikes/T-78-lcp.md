# T-78 — LCP no preview real

## Veredito

Saída C: a medida do RNF-01 continua no `dist/` servido pelo Lighthouse CI (`staticDistDir`), com o perfil do `lighthouserc.json`. A T-77 sobe o `numberOfRuns` de 3 para 5. O preview do PR não serve de alvo de LCP.

LCP simulado no celular, mediana de 9 execuções, em ms:

| URL | Local | Produção | Preview |
|---|---|---|---|
| Home | 1352,1 | 1390,8 | 1557,5 (outra página, ver P2) |
| Post A | 1653,1 | 1394,0 | 2065,9 |
| Post B | 1953,4 | 1400,2 | 1705,8 |

Pelo critério escrito antes da medida, a produção ficou igual ao local na home (38,7 ms de diferença) e abaixo dele nos posts A e B, com 9 de 9 execuções abaixo da mediana local nos dois. Nenhuma mediana da produção chegou a 2000 ms. O preview ficou acima da produção nos posts A e B com o HTML idêntico byte a byte. Isso parou o veredito até a causa aparecer no JSON (P2). A saída C foi confirmada pelo autor depois disso.

A oscilação do post B entre 1803 e 1953 ms é do Lantern, não do servidor local: as 9 execuções locais tiveram as mesmas 11 requisições e os mesmos 161.215 bytes, e a diferença de 150 ms está toda no Render Delay. A margem do post B sob o teto (46,6 ms na mediana de 9) é real para o portão do CI.

## Pergunta

A margem de menos de 50 ms do post B (1953,1 ms contra 2000 no Gate 2a) e a oscilação entre os degraus de cerca de 1803 e 1953 ms, sem mudança de código, são reais ou efeito do servidor local do Lighthouse CI (`staticDistDir`)?

## O que foi medido

Em 11/11/2026, branch `t-78-spike-lcp` (PR #62), com o `src/` igual ao da `main` em `1649706`. O autor mediu no Mac, em sequência, sem outro Lighthouse ao mesmo tempo, com `@lhci/cli` 0.15.1, Lighthouse 12.6.1 e HeadlessChrome 157 (`benchmarkIndex` entre 4276 e 4365). Usou o perfil móvel padrão, com throttling simulado, e não houve `settings`.

- **Local:** `SITE_URL=https://blog.p-giacometo.workers.dev pnpm build`, sem `SHOW_DRAFTS`. Cópia do `lighthouserc.json` pelo `jq`, mudando só o `upload.outputDir`.
- **Produção:** `https://blog.p-giacometo.workers.dev`, deploy da `1649706`.
- **Preview:** `https://pr-62-blog.p-giacometo.workers.dev` (Version URL com alias, build com `SHOW_DRAFTS=true`).
- **Remotos:** cópia sem `staticDistDir` e sem `assert`, com as URLs remotas.
- **Ordem:** 3 blocos, cada um com local, produção e preview, de `numberOfRuns: 3` sobre as 3 URLs. São 9 execuções por URL e por alvo, 81 no total.
- **Antes de medir:** o HTML da produção nas três URLs era idêntico, por `cmp`, ao do `dist/` local. Os posts A e B do preview eram idênticos aos da produção. A home do preview não era, como esperado (P2).
- **Cabeçalhos dos remotos (GET pelo `curl`):** `HTTP/2 200`, `content-encoding: zstd`, `alt-svc: h3=":443"; ma=86400` e `cache-control: public, max-age=0, must-revalidate`, nos dois hosts.
- **CI:** o artifact `lighthouse-report` do push da `main` em `1649706` (9 execuções, HeadlessChrome 156, `benchmarkIndex` entre 1755 e 3077,5).
- **Extração:** um script fora do repositório leu cada relatório com o `/usr/bin/jq`.

## P1 — local × produção

LCP simulado, em ms. "Degraus" agrupa cada execução no múltiplo de 50 ms mais próximo.

| URL | Alvo | Mediana de 9 | Blocos 1 / 2 / 3 | Degraus | Acima / abaixo da mediana local |
|---|---|---|---|---|---|
| Home | Local | 1352,1 | 1352,1 / 1352,1 / 1351,9 | 1350 ×9 | — |
| Home | Produção | 1390,8 | 1090,4 / 1390,8 / 1398,4 | 950 ×1, 1100 ×2, 1400 ×6 | 6 / 3 |
| Post A | Local | 1653,1 | 1652,7 / 1653,5 / 1652,6 | 1650 ×9 | — |
| Post A | Produção | 1394,0 | 1399,3 / 1110,9 / 1394,0 | 1100 ×2, 1400 ×6, 1450 ×1 | 0 / 9 |
| Post B | Local | 1953,4 | 1953,5 / 1953,0 / 1953,7 | 1800 ×2, 1950 ×7 | — |
| Post B | Produção | 1400,2 | 1410,0 / 1400,2 / 1389,6 | 1100 ×2, 1400 ×6, 1550 ×1 | 0 / 9 |

CLS 0 em todas as execuções locais e remotas. Elemento do LCP igual nos dois alvos: a capa do destaque na home (`section > article.relative > div.my-4 > img.h-full`) e um parágrafo da prosa nos posts (`main#conteudo > article.mx-auto > div.prose > p`). No post B, o elemento não é mais a descrição registrada na T-52.

O local fala só `http/1.1`. Nos remotos, o Chrome negociou `h3` na maior parte das requisições, com algumas execuções em `h2` e `h3` misturados (`h2=4,h3=7` no post B, por exemplo).

| Medida observada (mediana de 9) | Local | Produção | Preview |
|---|---|---|---|
| Tempo de resposta do documento (`server-response-time`), home / A / B | 2 / 1 / 1 ms | 49 / 42 / 41 ms | 278 / 273 / 287 ms |
| LCP observado sem throttling, home / A / B | 35 / 35 / 36 ms | 164 / 145 / 145 ms | 1408 / 1379 / 1390 ms |

## P2 — preview × produção

Nos posts A e B, com o HTML idêntico, o preview ficou acima da produção: 2065,9 contra 1394,0 ms no post A e 1705,8 contra 1400,2 no post B. A causa está no relatório.

O Lantern do Lighthouse 12.6.1 (`@paulirish/trace_engine` 0.0.53, `FirstContentfulPaint.getFirstPaintBasedGraph`, usado pelo `LargestContentfulPaint`) monta o grafo do LCP só com as requisições que terminaram antes do LCP observado na carga sem throttling. As que terminam depois do desenho saem da conta. O LCP simulado depende, então, de quantos bytes chegaram antes do desenho real. No post B, as 27 execuções se agrupam assim:

| Alvo | Bytes transferidos antes do LCP observado | Protocolos | LCP simulado (ms) |
|---|---|---|---|
| Local | 161.215 (×9) | `http/1.1` | 1803–1954 |
| Produção | 52.961 (×2) | `h2` + `h3` | 1090–1092 |
| Produção | 53.528–53.552 (×6) | `h3` | 1390–1420 |
| Produção | 73.844 (×1) | `h3` | 1558 |
| Preview | 53.658–53.660 (×2) | `h3` | 1416–1429 |
| Preview | 163.858–163.873 (×3) | `h2` + `h3` | 1690–1706 |
| Preview | 164.402–164.455 (×4) | `h3` | 2333–2365 |

Quando poucos bytes chegaram antes do desenho, o preview deu o mesmo que a produção. A Version URL serviu o documento em 273 a 287 ms de mediana, contra 41 a 49 na produção. Com isso, o desenho real no preview só veio por volta de 1,4 s, e as fontes da marca e do KaTeX já tinham terminado até lá. No local, tudo chega antes do desenho (cerca de 35 ms), sempre. O local é, por isso, o caso em que todas as fontes contam para o LCP, e é determinístico: as execuções do mesmo degrau ficam a até 2 ms umas das outras. O remoto variou de 1090 a 1558 ms na produção e de 1416 a 2365 no preview, para o mesmo HTML.

A home do preview é outra página: com `SHOW_DRAFTS=true`, o rascunho de teste (`featured: true`, `pubDate` 2026-10-23, sem capa) ocupa o destaque, e o elemento do LCP passa a ser `div.mx-auto > div.lg:sticky > div.mx-auto > p.mt-4`. Ela foi medida e ficou fora da comparação.

## P3 — CI

O job `lighthouse` da `main` em `1649706`, no runner Ubuntu, mediu home 1353,8 a 1355, post A 1507,4 a 1657,3 (mediana 1656,3) e post B 1809,1 a 1814,7 (mediana 1811,6). São os mesmos degraus do Mac, com `benchmarkIndex` e Chrome diferentes. Nesse run, o post B estava no degrau baixo.

## Achados

- **CLS do post A no CI:** 0,0447 nas 3 execuções, contra 0 nas 27 execuções locais e nas 18 remotas do post A. O teto do RNF-01 é 0,05. O deslocamento é do `article.mx-auto > header.flex > div.group > div.mt-8`, a caixa de metadados do `PostRail` abaixo do título e da descrição, e o Lighthouse aponta "Web font loaded" como causa. Vira a T-85.
- **Chrome do Mac:** o HeadlessChrome local passou de 156 para 157 desde a T-75, sem mudar os degraus.
- **e2e do PR #62:** o job caiu duas vezes no `playwright install --with-deps chromium` com `Temporary failure resolving 'azure.archive.ubuntu.com'`. As bibliotecas do Chromium já estavam no runner, e só os 9 pacotes de fonte que o Playwright pede precisavam do espelho do apt. Nenhum teste rodou.

## Perguntas abertas

- Com 5 execuções, a T-77 passa a medir a mediana sobre um número ímpar maior. Quanto isso acrescenta ao tempo do job `lighthouse` com todos os posts publicados fica para a medida da T-77.
- Medir o LCP depois do deploy, contra a produção, daria uma segunda referência para o leitor real. Este spike mostrou que essa medida varia de um degrau para outro conforme o protocolo e a corrida entre o desenho e as fontes. Não foi testada nenhuma forma de estabilizá-la.

## Evidência

Branch `t-78-spike-lcp`, PR #62, só com `specs/`. Saídas fora do repositório, em `~/Desktop/t78-saidas/`: as 81 execuções em `lh-cel-{local,prod,prev}-{1,2,3}/`, o artifact do CI em `ci-main/`, as cópias do `lighthouserc.json` (`lhci-*.json`), os cabeçalhos (`curl-remoto.txt`), o HTML baixado (`html/`), o hash do `dist/` (`hash-antes.txt`), o extrator `lh-t78.sh`, as linhas por execução (`runs.jsonl`), o resumo (`resumo.tsv`) e a tabela por execução (`diag.tsv`).
