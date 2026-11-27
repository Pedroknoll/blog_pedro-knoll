# T-31 — Version URLs com alias × Workers Previews

## Veredito

Saída B: o preview do PR continua com a Version URL com alias (`wrangler versions upload --preview-alias "pr-<n>"`). Não nasce tarefa de troca. O Workers Previews funcionou sem tocar na produção, com os mesmos headers e a mesma API, mas não trouxe ganho para este blog que pague o que custa:

| | Version URL com alias (hoje) | Workers Previews |
|---|---|---|
| Produção | Intocada (`versions upload` não ativa a versão) | Intocada: a versão ativa ficou `1e724f52` do começo ao fim (M1 a M5) |
| Headers do `_headers` | CSP, HSTS, cache `/_astro/:file`, `noindex` | Iguais, com um só `x-robots-tag: noindex` (P2) |
| `/api/votes` | GET lê o D1 de produção; POST 403 | Igual, **só** com o D1 repetido em `previews.d1_databases`; com `previews: {}`, GET 500 (erro 1101) (P3) |
| TTFB do post, mediana / p90 | 88 / 138 ms | 88 / 130 ms (produção: 65 / 95) (P4) |
| URL | `pr-<n>-blog.p-giacometo.workers.dev` | `<nome>-blog.p-giacometo.workers.dev`; `/` no nome vira `-` (P5) |
| Limpeza | A versão fica (como toda versão) | `wrangler preview delete`; a URL passa a 404 (P5) |
| Config | Nenhuma além do `wrangler.jsonc` | Bloco `previews` obrigatório; nada é herdado da produção |
| Estado | Estável | Open beta (Wrangler 4.162.0) |

Os ganhos reais são a limpeza no fim do PR, que hoje não faz falta, e um D1 só do preview, que só serviria se o preview precisasse gravar voto. Hoje o Worker grava só em `pedroknoll.com` (T-121), e mudar isso é decisão de produto, não de infraestrutura. Em troca, a migração pede o bloco `previews` com o D1 repetido (esquecer dá 1101 em silêncio no preview), um job novo no `pull_request: closed`, conferir a permissão do token `github-actions-blog-deploy`, separar o JSON do log no `--json` e cuidar da colisão de nomes com os aliases dos PRs abertos (P5).

**Reavaliar** se: (a) a Cloudflare depreciar as Version URLs ou os aliases; (b) o preview precisar gravar votos num D1 próprio; (c) o Workers Previews sair do beta e o `versions upload` perder algo que o preview usa.

## Pergunta

Trocar o `versions upload --preview-alias` do job `preview` pelo `wrangler preview` traz ganho? Criar um Preview mexe na produção ou nos aliases dos PRs abertos? O Preview aplica o `_headers`, o `not_found_handling` e o `run_worker_first`? Como fica o binding do D1? A latência muda? Como são o nome, a URL e a limpeza?

## O que foi medido

Em 27/11/2026, entre 14:14 e 14:25 UTC, no branch `t-31-spike-workers-previews`, com o `src/` igual ao da `main` em `677b860`. Mac, Wrangler 4.162.0, login do autor (`wrangler login`), rede doméstica. Build `SHOW_DRAFTS=true pnpm build`, igual ao do job `preview` (sem o `SITE_URL` do CI), 158 arquivos no `dist/`.

Config temporário `wrangler.t31.jsonc`, não commitado: o `wrangler.jsonc` da `main` mais o bloco `previews`. No M1, `"previews": {}`. Do M2 em diante:

```jsonc
"previews": {
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "blog-votes",
      "database_id": "01066d57-d585-4090-b1ce-392969a29445",
      "migrations_dir": "migrations",
    },
  ],
},
```

Comandos: `wrangler preview -c wrangler.t31.jsonc --name <nome> --ignore-base-config --message <msg> --json`; `wrangler versions upload -c wrangler.t31.jsonc --preview-alias t-31-coexist`; `wrangler preview delete --name <nome> --skip-confirmation`; `wrangler deployments list` antes, no meio e no fim. Headers por `curl -s -D - -o /dev/null`, com GET (T-05). Nada de `deploy`, `versions deploy`, migração remota ou secret.

Doc lida em 27/11/2026: [Previews](https://developers.cloudflare.com/workers/previews/), [configuração](https://developers.cloudflare.com/workers/previews/configuration/), [recursos](https://developers.cloudflare.com/workers/previews/resources/), [comparação](https://developers.cloudflare.com/workers/previews/compare-workflows/), [domínios](https://developers.cloudflare.com/workers/previews/custom-domains/), [Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/) e [comandos](https://developers.cloudflare.com/workers/wrangler/commands/workers/#preview). A doc diz que os Previews "do not inherit production settings", que o bloco `previews` "is required, but it can be empty", e que a Version URL "runs one uploaded version against your production resources". Ela recomenda Previews para branches e PRs, mas não deprecia as Version URLs. Limites: 100 Previews por Worker no plano free e 100 implantações por Preview, com a mais antiga apagada ao passar. A doc não fala de preço, de permissão do token nem de `_headers` no Preview.

## P1 — Produção e coexistência

A versão ativa foi `1e724f52-1db9-48fe-8630-54365f84e514` (deploy de 27/11 00:53 UTC) antes do M1, depois do M1, depois do M3 e depois do M5. Criar, atualizar e apagar Previews não criou deployment.

Com o bloco `previews` no config, o `versions upload --preview-alias t-31-coexist` (M3) subiu `env.DB (blog-votes)` e `env.ASSETS` e imprimiu a `Version Preview Alias URL`, como no job de hoje. Logo depois, o alias novo, o Preview `t-31-spike`, o alias antigo `pr-122` e `pedroknoll.com` responderam 200. As duas formas convivem no mesmo Worker.

## P2 — Paridade

O JSON do M1 traz a configuração de assets da produção: `not_found_handling: "404-page"`, `run_worker_first: ["/api/*"]`, `html_handling: "auto-trailing-slash"`. No Preview, `/` e `/blog/2026-10-por-que-este-blog/` deram 200, e `/nao-existe/` deu 404 com `text/html`.

Em `/`, no post e em `/_astro/BaseLayout.CawQrbBZ.css`, o Preview entregou os mesmos headers da Version URL `pr-122`: `content-security-policy` igual, `strict-transport-security`, `permissions-policy`, `referrer-policy`, `x-content-type-options` e `cache-control: public, max-age=31536000, immutable` no CSS. O `x-robots-tag: noindex` veio uma vez só, sem duplicar a regra `https://:version.:subdomain.workers.dev/*` da T-27 com o header automático da Cloudflare. `pedroknoll.com` não tem `x-robots-tag`, como esperado.

## P3 — D1

- **M1, `previews: {}`:** o `env` da implantação só tem `ASSETS`. `GET /api/votes` deu `500`, com `error code: 1101`. O POST deu 403 `{"error":"forbidden"}`, porque a checagem de host e Origin (`worker/votes.ts`) vem antes do banco. O deploy não avisa da falta do binding.
- **M2, `previews.d1_databases` com o `blog-votes`:** o `env` tem `DB` com o `database_id` de produção. `GET /api/votes` deu 200, com `{"votes":{"2026-10-como-o-blog-e-feito":2,"2026-10-por-que-este-blog":1,"2026-10-rascunho-de-teste":0}}`. O POST deu 403. É o comportamento de hoje.

Um D1 só do preview (outro `database_id` e um `wrangler.preview-migrations.jsonc` para as migrações, pela doc) não foi criado, por decisão do autor. Ele só serve se o Worker aceitar gravação fora de `pedroknoll.com`, o que muda o RF-25.

## P4 — Latência

`/blog/2026-10-por-que-este-blog/`, 20 rodadas alternadas entre as três origens, uma conexão nova por pedido (`curl -w`), entre 14:16:08 e 14:16:15 UTC. Tudo em HTTP/2, status 200. Em ms:

| Origem | TTFB, mediana | TTFB, p90 | TTFB menos TLS, mediana | p90 |
|---|---|---|---|---|
| Produção (`pedroknoll.com`) | 65 | 95 | 41 | 61 |
| Version URL com alias (`pr-122`) | 88 | 138 | 53 | 95 |
| Preview (`t-31-spike`) | 88 | 130 | 58 | 88 |

O Preview fica igual à Version URL. Os 273 a 287 ms do documento no preview da T-78 (`server-response-time` do Lighthouse, 11/11) não apareceram nas duas formas, então a diferença não é motivo para trocar. O preview continua sem servir de alvo de LCP (T-78).

## P5 — Nome, URL e limpeza

- **Nome com `/`:** `--name t-31/barra` virou o slug `t-31-barra`, com a URL `https://t-31-barra-blog.p-giacometo.workers.dev`. O nome padrão é o branch, e `t-XX-descricao` cabe sem mudança.
- **Colisão com alias:** o Preview `t-31-coexist` foi criado com o mesmo host do alias `t-31-coexist` (M3), sem erro nem aviso. Na primeira checagem, logo depois da implantação, o host ainda servia a versão do alias. Em seguida, e nas 5 checagens seguintes, passou a servir o Preview (um arquivo marcador só no upload do Preview deu 200 no host). A versão do alias continuou acessível pela URL com o id (`79e727a0-blog…`). Depois do `preview delete`, o host voltou ao alias (200, marcador 404). Uma troca com PRs abertos daria a dois PRs o mesmo host `pr-<n>`.
- **Limpeza:** `wrangler preview delete --name <nome> --skip-confirmation` apagou os três Previews. As URLs de `t-31-spike` e `t-31-barra` passaram a 404. A versão `79e727a0` do M3 ficou, como fica a de cada PR hoje: o Wrangler não apaga versões.
- **Saída `--json`:** com `--json`, o log do upload de assets (`🌀 Building list of assets...`, as linhas `+ /...`) saiu no stdout antes do JSON. O CI teria de cortar o log para ler a URL.
- **Tempo:** o primeiro `wrangler preview` levou 11 s, com 26 assets novos, e o segundo 7 s, sem asset novo. O `versions upload` do M3 levou 5 s.

## O que a SPEC diria se a troca viesse

Nada muda agora. Se um gatilho do Veredito chegar, a tarefa nova muda: o ADR-04 (o preview por Workers Previews), a §2 item 11, a §10 (o parágrafo do `preview_urls` e a tabela Ambientes) e o `wrangler.jsonc` da §10 (o bloco `previews`), além do job `preview` do `ci.yml`, de um job de `wrangler preview delete` no fechamento do PR e da permissão do token no ESTADO.
