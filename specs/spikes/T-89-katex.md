# T-89 — Math além do teto do KaTeX

## Veredito

O teto do KaTeX na guarda de fontes sobe de 3 arquivos e 48.000 bytes para **6 arquivos e 107.000 bytes**. Com isso, um post pode usar `\sum` inline (`KaTeX_Size1`), `\mathbf` (`KaTeX_Main-Bold`) e `\mathbb` (`KaTeX_AMS-Regular`), além das três famílias de antes. A `fixture-formulas` ganha essa math abaixo da dobra e segue como o pior caso que os dois tetos admitem juntos.

A régua é o **tempo até a math**: o instante em que chega o último `.woff2` do KaTeX, numa carga com a rede e a CPU limitadas no perfil Slow 4G do Lighthouse. O CSS do KaTeX declara `font-display: block` nas 20 faces, e a fórmula fica invisível até a fonte dela chegar. O RNF-01 não relaxa: FCP, LCP observado e o último arquivo da marca ficaram iguais em todos os degraus, e o Lighthouse simulado das fixtures continua verde.

Na `fixture-formulas`, o custo do teto novo é de +428 ms no tempo até a math (+15%). O autor escolheu esse degrau. `\mathcal` (`KaTeX_Caligraphic-Regular`, 6.908 bytes) e `\textit` (`KaTeX_Main-Italic`) continuam fora. A folga de 212 bytes não comporta nenhum outro arquivo que gere requisição: o menor deles é a `KaTeX_Size4`, com 4.928 bytes.

Com a math nova no primeiro viewport do celular, o `\mathbb` se move 3 px na vertical quando a fonte chega. A `KaTeX_AMS` não tem reserva métrica, e a correção é a T-136. Até ela fechar, a math que pede as famílias novas fica fora do primeiro viewport.

## Pergunta

Desde a T-94, o Lighthouse 13.6.0 não põe os arquivos de fonte no LCP simulado dos posts: o LCP fica igual ao FCP. O teto de 48.000 bytes da T-61 saiu do LCP do Lighthouse 12. Duas perguntas:

- Que medida mostra o custo de cada arquivo do KaTeX a mais?
- Com essa medida, quanta math cabe sem relaxar o RNF-01?

## Método

`scripts/measure-katex-fonts.mjs` (`node scripts/measure-katex-fonts.mjs <dist> <caminho>... [--runs N]`) faz o seguinte:

- Serve o `dist/` dado num servidor estático com gzip, como o `staticDistDir` do Lighthouse CI, e abre cada caminho no Chromium do Playwright.
- Usa um contexto novo e sem cache por execução, no viewport móvel do Lighthouse (412 × 823, `deviceScaleFactor` 1,75).
- Limita a rede pelo CDP com o `throttling.mobileSlow4G` do Lighthouse 13.6.0, com o ajuste do throttling aplicado: 562,5 ms de latência por requisição, 1474,56 kbps de descida, 675 kbps de subida e CPU 4×.
- Lê da Resource Timing os `.woff2` do KaTeX (direto em `/_astro/`, nome que começa por `KaTeX_`) e os da marca (`/_astro/fonts/`), com bytes (`encodedBodySize`) e `responseEnd`. Lê também o FCP e o LCP observado.
- Imprime a mediana e o mínimo e o máximo de 5 execuções.

O plano escrevia o critério antes da medida: a math teria de aparecer antes de 2000 ms, o teto do LCP no RNF-01. O V0 já falhou nele, e o critério caiu, como mostra a P1. Depois da medida, o autor escolheu um teto pelo custo relativo ao V0.

A escada usa variantes da `fixture-formulas`, só no working tree. Cada degrau acrescenta uma frase com uma fórmula inline numa seção nova, abaixo da dobra:

- V0: a fixture da T-87.
- V1: + `\sum_{i=1}^{n} x_i`.
- V2: + `\mathbf{x}`.
- V3: + `\mathbb{R}^n`.
- V4: + `\mathcal{L}`.
- V5: + `\textit{erro}`.
- V6: + `\left( \dfrac{\dfrac{a}{b}}{\dfrac{c}{d}} \right)`.

Cada degrau passou por `SHOW_FIXTURES=true pnpm build --outDir` e pelo script.

Ambiente: Mac do autor, 27/11/2026, branch `t-89-teto-katex`, Playwright 1.64.0, Chromium 156.0.8078.4 e `katex` 0.19.1.

## P1 — o critério absoluto não serve

Mediana de 5, em ms, no build de teste do `main`:

| Página | KaTeX | Marca | Tempo até a math | Último da marca | FCP = LCP observado |
|---|---|---|---|---|---|
| `fixture-formulas` | 3 arquivos, 47.920 B | 5 arquivos, 105.720 B | 2826,9 | 2444,0 | 1484,0 |
| `fixture-md` | 3, 47.920 B | 4, 81.364 B | 2579,9 | 2476,7 | 1476,0 |
| `fixture-mdx` | 3, 47.920 B | 4, 81.364 B | 2382,0 | 2604,4 | 1432,0 |
| `2026-10-como-o-blog-e-feito` | 3, 47.920 B | 4, 81.364 B | 2517,0 | 2341,1 | 1416,0 |
| `2026-10-por-que-este-blog` | 2, 42.712 B | 4, 81.364 B | 2348,7 | 2499,6 | 1408,0 |

Toda página com fórmula, inclusive os posts publicados, mostra a math depois de 2000 ms. A fonte chega no fim de uma cadeia HTML → CSS → `.woff2`, e cada passo paga 562,5 ms de latência antes do primeiro byte. Só a cadeia já leva mais de 1,7 s. Um teto absoluto de 2000 ms tiraria a math do blog, e o custo passou a ser lido em relação ao V0.

## P2 — a escada

`fixture-formulas`, mediana de 5 (mín–máx), em ms:

| Degrau | Arquivo novo | KaTeX | Tempo até a math | Δ sobre o V0 | FCP = LCP observado | Último da marca |
|---|---|---|---|---|---|---|
| V0 | — | 3, 47.920 B | 2826,9 (2818,6–2890,0) | — | 1484,0 | 2444,0 |
| V1 | `Size1` (5.468 B) | 4, 53.388 B | 2913,8 (2912,9–2991,4) | +87 | 1468,0 | 2429,2 |
| V2 | `Main-Bold` (25.324 B) | 5, 78.712 B | 3103,9 (3096,2–3105,2) | +277 | 1468,0 | 2428,1 |
| V3 | `AMS-Regular` (28.076 B) | 6, 106.788 B | 3255,2 (3248,1–3263,9) | +428 | 1468,0 | 2428,2 |
| V4 | `Caligraphic-Regular` (6.908 B) | 7, 113.696 B | 3295,1 (3294,3–3325,6) | +468 | 1468,0 | 2429,4 |
| V5 | `Main-Italic` (16.988 B) | 8, 130.684 B | 3375,2 (3367,4–3390,0) | +548 | 1468,0 | 2429,5 |
| V6 | nenhum | 8, 130.684 B | 3382,4 (3381,2–3391,7) | +556 | 1472,0 | 2428,1 |

O custo segue os bytes e não o número de arquivos: o `Size1`, com 5 KB, somou 87 ms, e a `Main-Bold`, com 25 KB, 190 ms. O FCP, o LCP observado e o último arquivo da marca não se mexeram: os arquivos do KaTeX a mais não atrasaram o que desenha a primeira tela. O `\left…\right` do V6 usou a `KaTeX_Size3`, que vem embutida no CSS como `data:`, e não pediu a `Size4`.

## P3 — a math nova no primeiro viewport

Numa variante com `$\sum_{i} \mathbf{x}_i \in \mathbb{R}^n$` no começo do primeiro parágrafo da `fixture-formulas`, a checagem de posição de `tests/e2e/quality.spec.ts` (T-85) acusou um elemento: `span.mord.mathbb`, de 504 para 501 px (−3). O `Size1` e a `Main-Bold` não se moveram. A `KaTeX_AMS` não tem face em `src/styles/katex-metric.css`: o span é medido com a métrica da fonte de reserva e muda de lugar quando a fonte chega. A correção é a T-136, no molde da T-88.

## Achados

- O teto novo vale para todas as páginas da guarda, como o anterior. O teto da marca não muda.
- O teste "fixture-formulas no teto da marca e do KaTeX" crava agora os seis nomes do KaTeX e 33 fórmulas inline. As mutações `katexFiles = 5` e `katexBytes = 106_787` reprovaram só a `fixture-formulas`, cada uma na própria asserção.
- Trocar o `font-display: block` do KaTeX (`katex-swap.min.css`) poria a math na tela antes da fonte e tiraria a invisibilidade. Isso pede reserva métrica de todas as famílias admitidas e não foi medido aqui.

## Evidência

Branch `t-89-teto-katex`. O vermelho é o commit da fixture: a guarda reprovou `6 arquivos do KaTeX, teto 3` e `106788 bytes do KaTeX, teto 48000`. Os builds de cada degrau e a saída do script ficaram no scratchpad da sessão e não estão no repositório. A tabela acima é a saída do script.
