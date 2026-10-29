# pk.log · Especificação da marca

Versão 1.10 · outubro de 2026 · pedroknoll.com

Este arquivo é a fonte da verdade da identidade visual e verbal do pk.log. Ele foi escrito para pessoas e para agentes de código. O manual visual interativo existe como artefato à parte; quando os dois divergirem, vale este arquivo. Quando o comportamento discordar da SPEC, vale a SPEC.

## 0. Como usar este arquivo

- **Decisão** é regra fechada. Siga como está.
- **Sugestão** é um ponto de partida. Ajuste ao código, ao schema e à SPEC.
- Este arquivo é a identidade. Em conflito de comportamento com a SPEC, vale a SPEC; avise no PR.
- A seção 14 é sugestão. A ordem das tarefas está na Fase 1b do ROADMAP. Onde a seção 14 discordar da SPEC ou do ROADMAP, valem a SPEC e o ROADMAP.
- Não crie nomes paralelos `--papel` / `--prussia` no CSS de componente, página ou layout. A T-41 grava a lista fechada: `surface`, `sheet`, `ink`, `muted`, `pencil`, `line`, `accent`, `kind-concept`, `kind-tutorial`, `kind-lab`, `kind-playbook`. Sem `@custom-variant dark` e sem `dark:` nos componentes.
- A stack é Astro 7 + Tailwind v4. A seção 13 é sugestão de tokens; confirme a SPEC §9 antes de aplicá-la.
- SVGs, favicons e temas do Shiki estão na árvore abaixo, com os nomes originais. O apêndice repete o código dos SVGs principais e usa esses caminhos.

```text
specs/BRAND.md
src/assets/brand/pklog-simbolo{,-escuro,-currentcolor,-construcao,-pixel}.svg
src/assets/brand/icones/aceno.svg
src/assets/brand/icones/icone-{conceito,tutorial,lab,playbook}.svg
src/assets/brand/icones/icone-{conceito,tutorial,lab,playbook}-parado.svg
src/styles/shiki/pk-claro.json
src/styles/shiki/pk-escuro.json
public/favicon.svg · favicon.ico · favicon-16.png · favicon-32.png · apple-touch-icon.png
```

`icon-192.png` e `icon-512.png` não entram no repositório. Sem manifesto PWA.

---

## 1. Marca

| Item | Valor | Regra |
|---|---|---|
| Nome | **pk.log** | Decisão. Sempre minúsculo, sem espaço, com o ponto. |
| Endereço | **pedroknoll.com** | Decisão. O domínio leva o nome completo; a marca, as iniciais. |
| Autor | **Pedro Knoll** | Assinatura à mão no certificado e nas peças gráficas; no site, fora das páginas até uma tarefa medir (T-52). |
| Saudação (headline da home) | **👋 Bem-vindo ao pk.log** | Decisão. A mão é o ícone em pixel `aceno.svg`, nunca o emoji do sistema. |
| Texto de apresentação | **Olá, eu sou o Pedro. Aqui documento meus aprendizados e experimentos sobre Inteligência Artificial.** | Decisão. Vem logo abaixo da saudação. |
| Descrição curta | **Aprendizados e experimentos em IA** | Para bio, avatar, meta description, assinatura vertical. |
| Título de página (`<title>`) | `{Título do fólio} · pk.log · Pedro Knoll` | Sugestão. "log" é palavra comum; o nome completo ajuda a busca. |

**Grafias.** Certo: `pk.log`. Errado: `PK.LOG`, `PK Log`, `PK'log`, `Pk.Log`.

**Significado.** "pk" são as iniciais de Pedro Knoll. "log" é ao mesmo tempo o log de treino de um modelo, o diário de bordo dos aviadores e o blog. Na assinatura, "pk" vem em serifa e "log" em mono (T-52: o itálico do pk pedia outro arquivo e entrava no LCP). O ponto é sempre azul-da-prússia e é o mesmo nó central do símbolo.

**Vocabulário editorial.**
- Cada post é um **fólio**, numerado em ordem de publicação com três dígitos: `Fól. 042`. O número nunca é reaproveitado.
- Cada trilha temática é um **caderno**: Caderno de ML, de Deep Learning, de Agentes, de LLMs.
- Datas no formato `21.out.2026`.

---

## 2. Conceito

O pk.log é um **caderno de anotações de inventor**, no espírito de Leonardo, Santos Dumont, Michelangelo, Ada Lovelace e Turing. Os mestres entram como **método, nunca como imagem**: nada de rostos, quadros famosos, Homem Vitruviano ou ilustrações de época.

Princípios:
- **Esboço antes da fórmula.** Todo conceito ganha um desenho antes de uma equação.
- **Tirar o excesso.** Textos e interfaces cortam o que não ajuda.
- **Planos abertos.** Notebooks, dados e erros ficam públicos (como os planos da Demoiselle).
- **Curiosidade com método.** Perguntar "e se?" e medir a resposta.

A linguagem visual tem três camadas:
1. **Base técnica e limpa:** fundo liso, grade de engenharia, tipografia precisa.
2. **Traço à mão por cima:** linhas de construção, cotas, uma nota à margem por seção.
3. **Pixel de terminal:** só nos ícones e no favicon.

A marca **não é** pastiche renascentista, nem futurismo de neon, cérebros brilhando e robôs.

---

## 3. Símbolo

**Desenho.** Um K formado por um grafo: cinco nós e quatro arestas, como um pedaço de rede neural, dentro de um círculo.
- Haste vertical de (37,22) a (37,78); pernas do nó central (37,50) até (67,22) e (67,78), em viewBox 100×100.
- As duas pernas têm o mesmo comprimento: são raios de um único arco (r = 41) traçado a partir do nó central.
- O **nó central** é azul-da-prússia, com halo da cor do fundo. É o ponto de pk**.**log.
- Círculo: r = 44, traço 3. Arestas: traço 6, pontas redondas. Nós das pontas: r = 4,5. Nó central: r = 8.

**Versões (arquivos em `src/assets/brand/`).**

| Arquivo | Uso |
|---|---|
| `pklog-simbolo.svg` | Padrão, fundo claro. |
| `pklog-simbolo-escuro.svg` | Fundo escuro (cianotipia). |
| `pklog-simbolo-currentcolor.svg` | Para inline, herda a cor do texto; o nó continua azul. |
| `pklog-simbolo-construcao.svg` | Peças grandes (capa, sobre, slides de abertura): mostra as linhas de construção. Nunca em tamanho pequeno. |
| `pklog-simbolo-pixel.svg` e os favicons em `public/` | Abaixo de 24 px: versão em pixel 16×16, sem os nós das pontas. |

**Assinatura (lockup).** Símbolo + nome. Feita em HTML/CSS, não em imagem, para usar as fontes da marca:

```html
<a class="assinatura" href="/">
  <svg aria-hidden="true"><!-- pklog-simbolo --></svg>
  <span class="nome"><em>pk</em><span class="ponto">.</span><span class="ext">log</span></span>
</a>
```

```css
.assinatura { display:inline-flex; align-items:center; gap:.42em; color:var(--tinta); text-decoration:none; line-height:1; }
.assinatura svg { width:1.55em; height:1.55em; flex:none; }
.nome { font-family:var(--f-display); font-weight:600; font-size:1.08em; white-space:nowrap; }
.nome em { font-style:normal; font-weight:600; }
.nome .ponto { color:var(--prussia); font-family:var(--f-mono); font-weight:400; font-size:.8em; }
.nome .ext { font-family:var(--f-mono); font-weight:400; font-size:.8em; letter-spacing:-.02em; }
```

O `em` fica em estilo normal para o pk usar o mesmo arquivo dos títulos; o ponto e o log ficam no peso 400 (T-52, LCP).

Versão vertical: símbolo em cima, nome, e a descrição curta em mono maiúsculo pequeno (letter-spacing .16em).

**Área de proteção:** espaço livre em volta igual a ¼ do diâmetro do círculo.
**Tamanhos mínimos:** símbolo 24 px; versão pixel 16 px; assinatura horizontal 140 px de largura.

**Proibido:** esticar ou achatar; girar; trocar cores por cores fora da paleta; sombra, brilho ou gradiente; aplicar sobre foto sem fundo sólido.

---

## 4. Cores (pigmentos)

Fundo **sempre liso**, sem textura, sem vinheta.

### Tokens

| Token | Claro (velino) | Escuro (cianotipia) | Papel |
|---|---|---|---|
| `--papel` | `#FAF9F5` | `#0E2236` | Fundo da página. |
| `--folha` | `#F0EEE6` | `#163250` | Superfícies: blocos de código, cartões em destaque, barra do notebook. |
| `--tinta` | `#2A2118` | `#E8EEF3` | Texto principal (tinta ferrogálica: marrom quase preto). |
| `--grafite` | `#5E5345` | `#A9BACB` | Texto secundário. |
| `--lapis` | `#7B6F5A` | `#869EB6` | Fólio e metadados. Não é texto menor que 24 px sobre folha clara. Comentário de código não usa lápis. |
| `--linha` | `rgba(60,40,20,.16)` | `rgba(232,238,243,.18)` | Bordas e divisórias. |
| `--prussia` | `#1F4B7A` | `#8DB8E8` | **Cor principal.** Links, foco, nó do símbolo, ponto do nome, tipo Conceito. |
| `--latao` | `#84601A` | `#D9B85C` | Tipo **Tutorial**. |
| `--sanguinea` | `#A3392A` | `#EE8A74` | Tipo **Lab**. |
| `--verdete` | `#2E6B5A` | `#7CC7AE` | Tipo **Playbook**. |
| `--ouro` | `#F5B82E` | `#F5B82E` | **Exceção:** só a mão da saudação. |
| `--contorno-px` | `#2A2118` | `#2A2118` | Contorno da mão em pixel, nos dois modos. |
| `--grade` / `--grade-forte` | `rgba(31,75,122,.03)` / `.065` | `rgba(200,225,255,.025)` / `.055` | Grade milimetrada. |
| `--grade-px` | `rgba(42,33,24,.07)` | `rgba(232,238,243,.07)` | Grade de exibição dos ícones em pixel (só em documentação). |

### Regras de cor (decisões)
- **Proporção em qualquer peça:** papel ~68%, tinta ~20%, prússia ~7%, latão + sanguínea + verdete ≤ 5% somados.
- **Latão, sanguínea e verdete marcam só o tipo de conteúdo.** Nunca marcam avisos, erros, sucesso ou resultados, e nunca são fundo de página.
- **Ouro-pigmento** aparece só na mão da saudação, sempre com contorno em tinta (amarelo puro some sobre o fundo claro).
- **Pergaminho** (`#EADFC8`, com `--folha #DFD2B6`, `--grafite #5A4D3C`, `--lapis #8E7E64`, `--latao #765514`, `--sanguinea #9E3526`, `--verdete #2B6454`) é um tom mais fundo **só para peças gráficas**: slides, posts de rede social, capas, certificado. Nunca no blog.
- **Nomes na interface:** o botão de tema diz **Claro** e **Escuro**. "Velino" e "cianotipia" são nomes internos.
- O modo claro é o padrão; o escuro é opção do leitor, respeitando `prefers-color-scheme` até ele escolher.

### Contraste medido (WCAG)

| Cor | sobre `--papel` claro | sobre `--folha` claro | sobre `--papel` escuro | sobre `--folha` escuro |
|---|---|---|---|---|
| tinta | 15,0 | 13,6 | 13,8 | 11,2 |
| grafite | 7,1 | 6,5 | 8,1 | 6,6 |
| lápis | 4,7 | 4,2 | 5,8 | 4,7 |
| prússia | 8,5 | 7,7 | 7,8 | 6,3 |
| latão | 5,4 | 4,9 | 8,4 | 6,8 |
| sanguínea | 6,3 | 5,7 | 6,6 | 5,3 |
| verdete | 5,9 | 5,4 | 8,2 | 6,6 |

Lápis sobre folha clara (4,2) fica abaixo de 4,5. Lápis não é texto menor que 24 px sobre folha clara; nesse tamanho, use grafite. Comentário de código não usa lápis. No tema claro do Shiki o comentário é `#5E5345`. O tema escuro não muda o comentário nesta revisão (`#869EB6`).

---

## 5. Tipografia

As quatro famílias entram pela Fonts API do Astro (`fontProviders.fontsource()`), subset `latin`, `woff2`. Sem `fontProviders.google()` e sem pacote `@fontsource/*` instalado à mão.

| Papel | Fonte | Pesos | Regras |
|---|---|---|---|
| Títulos | **Cormorant Garamond** | 500 itálico, 600, 600 itálico | De 28 px para cima, com as exceções abaixo. Nas páginas, só 600 normal, até uma tarefa medir outra face (T-52, LCP). |
| Texto | **IBM Plex Sans** | 400, 400 itálico, 600 | 17 px, altura de linha 1,65, coluna de ~65 caracteres. |
| Código, rótulos, fólio, cotas | **IBM Plex Mono** | 400 | Rótulos em maiúsculas com letter-spacing .08–.14em. Só o peso 400 (T-52, LCP). |
| Anotação à mão | **Caveat** | 500, 600 | Fora das páginas do site até uma tarefa medir (T-52, LCP). Quando voltar: no máximo uma nota por seção, no máximo uma linha e meia, nunca em parágrafo, botão ou menu. |

**Cormorant (decisão, 22/10/2026).**

- Cormorant só a partir de 28 px.
- Exceção: título de card, peso 600, a partir de 22 px. O ~1,45rem da seção 9.2 cabe nessa exceção (23 px com raiz de 16 px).
- Exceção: a assinatura (Wordmark) também fica abaixo de 28 px, por ser desenho da marca e não texto.
- Peso 500 nunca abaixo de 28 px.
- O h3 a 22 px continua IBM Plex Sans 600.

**Escala (px):** display 64 · h1 44 · h2 30 · h3 22 (Plex Sans 600) · texto 17 · rótulo 12.
Títulos com `text-wrap: balance`.

---

## 6. Elementos gráficos

| Elemento | Regra |
|---|---|
| **Grade milimetrada** | Linhas de 1 px a cada 8 px, reforço a cada 40 px, cores `--grade`/`--grade-forte`. **Só em capas, diagramas e peças gráficas. Nunca atrás de texto corrido.** |
| **Linhas de construção** | Tracejado fino em prússia, passando além da forma, como num esboço. Em diagramas e no símbolo grande. |
| **Cotas** | Linha de medida do desenho técnico (traço com marcas nas pontas e valor em mono). Mostram formato de tensor `[batch, 512, 768]`, tempo, tamanho de modelo. Todo diagrama tem pelo menos uma. |
| **Nota à margem** | IBM Plex Sans itálico, em prússia, com um traço ou seta curva, levemente inclinada (−1,5°). Uma por seção. A T-52 trocou a Caveat por esta face por causa do LCP. |
| **Hachura de nível** | Traços inclinados para a direita (`\`), como hachurava Leonardo, que era canhoto: sempre três traços, com 1, 2 ou 3 marcados da esquerda para os três níveis. Os marcados ficam em tinta; os outros, na cor de `--linha` (T-46). |
| **Fólio** | `Fól. 042 · 21.out.2026`, em mono, cor lápis. |

---

## 7. Ícones em pixel

- **Grade 12 × 12, uma cor (`currentColor`), cantos retos, sem suavização** (`shape-rendering: crispEdges`).
- Use em **12, 24, 36 ou 48 px** (múltiplos de 12) para não borrar.
- **Exceção:** a mão da saudação (`aceno.svg`) é **16 × 16**, com contorno `--contorno-px` e corpo `--ouro`. Use em 16, 32 ou 48 px.
- **Animação quadro a quadro** (decisão):
  - Conceito: o ponteiro do compasso gira em 4 posições (3,2 s).
  - Tutorial: o cursor `_` pisca (1,1 s).
  - Lab: duas bolhas sobem no frasco em 3 quadros (1,8 s).
  - Playbook: a lista se marca item por item e recomeça (4 s).
  - Aceno: dois quadros alternando 4 vezes, depois pausa (3,2 s, contínuo).
- **Onde anima:** quando o ícone aparece sozinho e em destaque (cartões de tipo, página "sobre", cabeçalho do fólio, saudação). **Parado** em listas, etiquetas e cards de índice (`icone-*-parado.svg`).
- Todas as animações respeitam `prefers-reduced-motion: reduce` (ficam paradas).
- Os SVGs animados têm classes com prefixo (`pkc-`, `pkt-`, `pkl-`, `pkp-`, `pka-`), então podem ser inseridos inline juntos sem conflito.

---

## 8. Sistema de conteúdo

Três eixos independentes: **tipo** (formato), **nível** (dificuldade) e **tema** (assunto). Só o tipo tem cor.

### Tipos (decisão)

| Tipo | Cor | Ícone | O que é | Estrutura |
|---|---|---|---|---|
| **Conceito** | prússia | compasso | Explica uma ideia do zero até um desenho que o leitor refaz de memória. | Pergunta → Esboço → Formalização → Onde aparece |
| **Tutorial** | latão | `>_` | Leva de A a B com passos verificáveis. | Objetivo → Pré-requisitos → Passos → Conferência |
| **Lab** | sanguínea | frasco | Experimento de bancada em marimo: hipótese, código, resultado e o que deu errado. | Hipótese → Montagem → Execução → Leitura → Notas |
| **Playbook** | verdete | checklist | Receita reutilizável para uma situação real. | Quando usar → Checklist → Armadilhas → Decisões |

### Níveis (decisão)

| Valor | Nome | Hachura | Para quem |
|---|---|---|---|
| 1 | **Iniciante** | `\\\`, 1 marcado | Curiosidade e Python básico. |
| 2 | **Intermediário** | `\\\`, 2 marcados | Já treinou um modelo simples. |
| 3 | **Avançado** | `\\\`, 3 marcados | Fine-tuning, avaliação, agentes em produção. |

### Temas
Etiquetas em mono, sem cor, borda `--linha`: Machine Learning, Deep Learning, Agentes, LLMs, Embeddings, Avaliação, Dados, MLOps. Um fólio pode ter vários.

### Frontmatter (sugestão, ajuste ao schema atual das content collections)

```yaml
folio: 6                  # número do fólio, exibido como "Fól. 006"
tipo: lab                 # conceito | tutorial | lab | playbook
nivel: 3                  # 1 iniciante | 2 intermediário | 3 avançado
temas: [LLMs, Fine-tuning, PyTorch]
caderno: llms             # opcional
tempoDeBancada: 90        # minutos para ler E executar
material: "marimo · GPU 16 GB"
marimo: "https://..."     # obrigatório em labs
colab: "https://..."      # só quando o lab precisa de GPU
```

A SPEC §6 fecha o schema. Chaves em inglês (`kind`, `level`, `benchMinutes`, `material`, `track`); `kind` no enum inglês; temas da marca são rótulo em `src/data/tags.ts`, não um campo; `minutesRead` permanece ao lado de `benchMinutes`; lab exige `notebooks`; Colab é `gpuUrl`. Este bloco é a sugestão anterior a essa decisão.

---

## 9. Componentes

### 9.1 Saudação (home)
- `<h1>` em Cormorant 600, `clamp(2.4rem, 4.4vw, 3.5rem)` (no máximo 56 px, abaixo do display de 64 px da seção 5; T-44), com `aceno.svg` inline antes do texto (48 px no desktop, 32 px abaixo de 560 px), `vertical-align: -.02em`, margem direita `.2em`.
- O nome dentro da saudação usa a mesma marcação da assinatura (`<em>pk</em><span class="ponto">.</span><span class="ext">log</span>`), sem quebrar linha dentro do nome. Abaixo de 560 px o nome começa sempre na segunda linha (`Bem-vindo ao` / `pk.log`): a quebra não pode depender da fonte, senão a troca da fonte reserva pela Cormorant desloca a página (T-44, CLS).
- Abaixo, o texto de apresentação em Plex Sans `clamp(1.18rem, 2.1vw, 1.4rem)`, cor tinta, máximo ~42 caracteres por linha.
- A newsletter está fora da v1 (SPEC §1). Não entra na home.

### 9.2 Card de fólio (listas)
- Linha 1: `Fól. 007 · 21.out.2026` (mono, lápis) à esquerda, com a data que o RF-01 pede; tipo à direita (ícone parado 12 px + nome em mono maiúsculo, na cor do tipo).
- Título em Cormorant 600 ~1,45rem.
- Resumo em Plex Sans 14,5 px, grafite.
- Rodapé: hachura de nível + nome do nível; etiquetas de tema.
- Borda 1 px `--linha`, sem sombra, sem raio grande (máx. 2 px). Hover: borda vira `--tinta`.

### 9.3 Cabeçalho do fólio (página do post)
1. Linha de metadados: `Fól. 006 · 21.out.2026` · tipo (ícone animado) · nível.
2. Título (h1).
3. Linha fina de introdução em grafite.
4. Ficha em três colunas, separadas por filetes: **Tempo de bancada** (`≈ 90 min`), **Material** (`marimo · GPU 16 GB · Colab se faltar GPU`), **Caderno** (`LLMs · 4 de 12`).
5. Temas.

### 9.4 Avisos dentro do texto (decisão: forma, não cor)
Todos em tinta; nenhum usa as cores dos tipos.

| Aviso | Rótulo (mono maiúsculo) | Forma |
|---|---|---|
| **Nota de bancada** (dica) | `// NOTA DE BANCADA` | Borda 1 px tracejada em lápis. |
| **Cuidado** | `[!] CUIDADO` (o `!` dentro de um quadrado de 17 px com borda 1,5 px) | Borda 1,5 px sólida em tinta, fundo `--folha`. |
| **Resultado** | `= RESULTADO` | Filete de 1,5 px em cima e embaixo, sem laterais; valor medido em mono 19 px (`acurácia 61% → 87%`). |

No MDX, `Callout` com `variant` `note`, `caution` ou `result` (SPEC RF-22).

### 9.5 Bloco de código
- Shiki com os temas `src/styles/shiki/pk-claro.json` e `src/styles/shiki/pk-escuro.json` (alternar conforme `data-theme`).
- Cores da sintaxe: palavra-chave prússia, texto (string) verdete, número latão, função sanguínea, comentário em itálico. No tema claro o comentário é grafite `#5E5345`, não lápis. No tema escuro o comentário permanece `#869EB6`. Dentro do código, as cores são só sintaxe.
- Moldura: fundo `--folha`, borda `--linha`. Barra superior com o nome do arquivo em mono 12 px (ex.: `fol-001_embeddings.py`) e o botão **Copiar**, que vira **Copiado** por 1,5 s.
- Opcional: linha de "saída" abaixo do código, no formato de cota (`saída ├────┤ [4, 384]`).

### 9.6 Barra do lab
- Texto à esquerda: "Este lab roda no navegador. Mude os parâmetros e anote o que acontecer."
- Botões à direita: **Abrir no marimo** (principal: fundo tinta, texto papel) e **Abrir no Colab** (secundário: borda tinta), este último só quando o lab precisa de GPU.
- Botões em mono 12,5 px, cantos retos.
- Aparece logo após o cabeçalho de todo Lab.

### 9.7 Notebooks marimo
Primeira célula de todo lab: cabeçalho renderizado com a assinatura, `Fól. 006 · Lab` (na cor do tipo) e o título. Parâmetros do experimento como controles do marimo (`mo.ui.slider` etc.), não como constantes soltas. Sugestão: um `pk.css` para o marimo com as mesmas fontes e cores.

### 9.8 Diagramas
- Tinta para elementos; prússia para **um** destaque por diagrama; tracejado fino para guias.
- Rótulos em mono; no máximo duas notas em IBM Plex Sans itálico (T-52, LCP).
- Sempre uma cota com medida real.
- Fundo com grade milimetrada; sem sombra, sem gradiente, sem 3D.
- Funcionam nos dois modos (cores sempre por token).

### 9.9 Botão de tema
Dois estados, **Claro** e **Escuro**, num controle segmentado em mono 12 px. Grava a escolha (localStorage) e aplica `data-theme` na raiz.

### 9.10 Foco e interação
Foco visível: contorno 2 px prússia com afastamento 3 px. Links em prússia, sublinhado de 1 px com afastamento 3 px.

---

## 10. Voz

Um colega experiente puxando a cadeira ao lado, com uma pitada de inventor curioso.
- Fala **"eu"** quando conta o que aprendeu e testou, e **"vamos"** quando conduz um passo a passo.
- Mostra o erro e mede o que afirma.
- Termo técnico sempre, explicado na primeira vez que aparece.
- Título = verbo ou coisa concreta + condição real ("Fine-tuning de um modelo pequeno numa GPU de 16 GB").
- Se não rodou na bancada, não entra no caderno.

| Diga | Evite |
|---|---|
| Vamos treinar e ver onde quebra. | Neste artigo, exploraremos de forma abrangente o processo de treinamento. |
| Na primeira tentativa a acurácia ficou em 61%. Eis o porquê. | Resultados incríveis em poucos minutos! |
| Embedding é um endereço num mapa de significados. | Embeddings são representações vetoriais densas de alta dimensionalidade. |
| Fine-tuning de um modelo pequeno numa GPU de 16 GB | O guia definitivo de fine-tuning que vai mudar sua carreira |

### Microtextos

| Lugar | Texto |
|---|---|
| Saudação | Bem-vindo ao pk.log |
| Newsletter | Receba os próximos fólios por e-mail. · botão: Receber fólios |
| Página 404 | Esta página foi arrancada do caderno. |
| Botão de código | Copiar → Copiado |
| Fim de fólio | Achou um erro? Anote na margem: abra uma issue. |
| Botão de tema | Claro · Escuro |
| Barra do lab | Abrir no marimo · Abrir no Colab |

---

## 11. Aplicações

| Peça | Fundo | Regras |
|---|---|---|
| **Site** | velino (claro) / cianotipia (escuro) | Acompanha o tema do leitor. |
| **Thumbnail YouTube** 16:9 | cianotipia fixa + grade | `Fól. 001 · Conceito` em latão no topo, símbolo com nó em latão, título grande em Cormorant (parte em itálico prússia clara), mini-diagrama, rodapé `pk.log · pedroknoll.com` em mono. |
| **Imagem de link (OG)** 1200×630 | velino + grade | Sugestão: gerar por fólio no build (ex.: Satori). Fólio + tipo, título, nível, assinatura e `pedroknoll.com`. |
| **Post de rede** 1:1 | pergaminho + grade | Tipo no topo, título, até 3 itens, assinatura e `pedroknoll.com` no rodapé. |
| **Slide** 16:9 | pergaminho + grade | Coluna esquerda: tipo, título, frase, assinatura. Direita: Hipótese / Montagem / Resultado. |
| **Certificado** A4 paisagem | pergaminho + grade | Moldura dupla com cantos de compasso, símbolo, "Certificado de bancada", nome do caderno, nome do participante, assinatura à mão e `pedroknoll.com`. |
| **Caderno físico / adesivo** | cianotipia | Símbolo com nó em latão; adesivo com o texto `pk.log · experimentos em IA ·` em volta. |
| **Avatar** | velino ou cianotipia | Símbolo vetorial; abaixo de 24 px, versão pixel. |

---

## 12. Favicon

Arquivos em `public/`. Sem manifesto PWA: `icon-192.png` e `icon-512.png` não entram no repositório.

| Arquivo | Uso |
|---|---|
| `favicon.svg` | Principal. Muda de cor sozinho no modo escuro do sistema. |
| `favicon.ico` | 16/32/48 px, para navegadores antigos. |
| `favicon-16.png`, `favicon-32.png` | Alternativas em PNG. |
| `apple-touch-icon.png` | 180 px, fundo velino. |

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

O `sizes="32x32"` no ICO evita que o Chrome escolha o ICO no lugar do SVG. `favicon-16.png` e `favicon-32.png` ficam em `public/`, sem `<link>`.

---

## 13. Tokens

Sugestão anterior à T-41. No site valem os nomes da seção 0, não `--papel` / `--prussia` como segundo conjunto. Sem `@custom-variant dark`. A paleta escura fica em `:root[data-theme="dark"]`. Até a T-24, nada no site aplica `data-theme` nem `prefers-color-scheme`; a T-41 só declara as paletas.

### CSS puro

```css
:root {
  --papel: #FAF9F5;
  --folha: #F0EEE6;
  --tinta: #2A2118;
  --grafite: #5E5345;
  --lapis: #7B6F5A;
  --linha: rgba(60, 40, 20, .16);
  --prussia: #1F4B7A;
  --latao: #84601A;
  --sanguinea: #A3392A;
  --verdete: #2E6B5A;
  --ouro: #F5B82E;
  --contorno-px: #2A2118;
  --grade: rgba(31, 75, 122, .03);
  --grade-forte: rgba(31, 75, 122, .065);

  --f-display: "Cormorant Garamond", Garamond, "Times New Roman", serif;
  --f-texto: "IBM Plex Sans", "Helvetica Neue", Arial, sans-serif;
  --f-mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  --f-mao: "Caveat", "Segoe Print", cursive;
}

:root[data-theme="dark"] {
  --papel: #0E2236;
  --folha: #163250;
  --tinta: #E8EEF3;
  --grafite: #A9BACB;
  --lapis: #869EB6;
  --linha: rgba(232, 238, 243, .18);
  --prussia: #8DB8E8;
  --latao: #D9B85C;
  --sanguinea: #EE8A74;
  --verdete: #7CC7AE;
  --grade: rgba(200, 225, 255, .025);
  --grade-forte: rgba(200, 225, 255, .055);
  color-scheme: dark;
}

/* Sem escolha do leitor, segue o sistema */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* mesmos valores do bloco escuro acima */ }
}

body { background: var(--papel); color: var(--tinta); font: 17px/1.65 var(--f-texto); }

.milimetrado {
  background-image:
    linear-gradient(var(--grade-forte) 1px, transparent 1px),
    linear-gradient(90deg, var(--grade-forte) 1px, transparent 1px),
    linear-gradient(var(--grade) 1px, transparent 1px),
    linear-gradient(90deg, var(--grade) 1px, transparent 1px);
  background-size: 40px 40px, 40px 40px, 8px 8px, 8px 8px;
}
```

### Tailwind v4 (sugestão, confirmar a versão no projeto)

Com os tokens acima no CSS global, exponha-os como utilitários:

```css
@import "tailwindcss";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

@theme inline {
  --color-papel: var(--papel);
  --color-folha: var(--folha);
  --color-tinta: var(--tinta);
  --color-grafite: var(--grafite);
  --color-lapis: var(--lapis);
  --color-linha: var(--linha);
  --color-prussia: var(--prussia);
  --color-latao: var(--latao);
  --color-sanguinea: var(--sanguinea);
  --color-verdete: var(--verdete);
  --color-ouro: var(--ouro);

  /* se o projeto já usa estes nomes, aponte-os para a marca */
  --color-accent: var(--prussia);

  --font-display: var(--f-display);
  --font-sans: var(--f-texto);
  --font-mono: var(--f-mono);
  --font-mao: var(--f-mao);
}
```

Gera classes como `bg-papel`, `text-tinta`, `border-linha`, `text-prussia`, `font-display`, `font-mono`. Como as cores apontam para variáveis, a troca de tema acontece só no CSS, sem `dark:` em cada componente.

Se o projeto estiver no Tailwind v3, os mesmos nomes vão em `theme.extend.colors` do `tailwind.config`, com valores `var(--papel)` etc.

---

## 14. Sugestão de tarefas para o roadmap

Sugestão já absorvida pela Fase 1b do ROADMAP. Onde esta seção discordar da SPEC ou do ROADMAP, valem a SPEC e o ROADMAP. Não use esta lista como ordem de tarefas.

Ordem que estava sugerida antes desse encaixe:

1. **Tokens e tema:** variáveis da seção 13, mapeamento dos tokens existentes, botão Claro/Escuro com `data-theme` e persistência.
2. **Fontes:** carregar as quatro famílias (de preferência auto-hospedadas).
3. **Marca no layout:** assinatura no cabeçalho, favicon (seção 12), `<title>` no padrão da seção 1, rodapé com assinatura espelhada opcional.
4. **Home:** saudação com aceno animado, texto de apresentação, newsletter, lista de fólios.
5. **Schema de conteúdo:** campos de fólio, tipo, nível, temas, tempo de bancada, material, links marimo/Colab.
6. **Card e cabeçalho de fólio:** com ícones parados nas listas e animado no cabeçalho, hachura de nível.
7. **Avisos em MDX:** componente com os três tipos da seção 9.4.
8. **Código:** temas Shiki próprios + barra com nome do arquivo e Copiar/Copiado.
9. **Barra do lab** e cabeçalho padrão dos notebooks marimo.
10. **OG image** por fólio.
11. **Página 404** com o microtexto da marca.
12. **Revisão de acessibilidade:** contraste (seção 4), foco visível, `prefers-reduced-motion` em todas as animações.

---

## Apêndice: SVGs principais

Versões paradas dos ícones e o símbolo com linhas de construção estão em `src/assets/brand/`. Os favicons versionados estão em `public/`. `icon-192.png` e `icon-512.png` não entram no repositório.

### Símbolo, fundo claro · `src/assets/brand/pklog-simbolo.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="pk.log">
  <title>pk.log</title>
  <circle cx="50" cy="50" r="44" fill="none" stroke="#2A2118" stroke-width="3"/>
  <path d="M37 22V78M37 50L67 22M37 50L67 78" fill="none" stroke="#2A2118" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <g fill="#2A2118"><circle cx="37" cy="22" r="4.5"/><circle cx="37" cy="78" r="4.5"/><circle cx="67" cy="22" r="4.5"/><circle cx="67" cy="78" r="4.5"/></g>
  <circle cx="37" cy="50" r="8" fill="#1F4B7A" stroke="#FAF9F5" stroke-width="3"/>
</svg>
```

### Símbolo, fundo escuro · `src/assets/brand/pklog-simbolo-escuro.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="pk.log">
  <title>pk.log</title>
  <circle cx="50" cy="50" r="44" fill="none" stroke="#E8EEF3" stroke-width="3"/>
  <path d="M37 22V78M37 50L67 22M37 50L67 78" fill="none" stroke="#E8EEF3" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <g fill="#E8EEF3"><circle cx="37" cy="22" r="4.5"/><circle cx="37" cy="78" r="4.5"/><circle cx="67" cy="22" r="4.5"/><circle cx="67" cy="78" r="4.5"/></g>
  <circle cx="37" cy="50" r="8" fill="#8DB8E8" stroke="#0E2236" stroke-width="3"/>
</svg>
```

### Favicon em pixel (adapta ao modo escuro) · `public/favicon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <style>.i{fill:#2A2118}.n{fill:#1F4B7A}@media (prefers-color-scheme:dark){.i{fill:#E8EEF3}.n{fill:#D9B85C}}</style>
  <path class="i" d="M5 0h6v1h-6zM3 1h2v1h-2zM11 1h2v1h-2zM2 2h1v1h-1zM13 2h1v1h-1zM1 3h1v1h-1zM14 3h1v1h-1zM1 4h1v1h-1zM5 4h2v1h-2zM10 4h2v1h-2zM14 4h1v1h-1zM0 5h1v1h-1zM5 5h2v1h-2zM9 5h2v1h-2zM15 5h1v1h-1zM0 6h1v1h-1zM8 6h2v1h-2zM15 6h1v1h-1zM0 7h1v1h-1zM15 7h1v1h-1zM0 8h1v1h-1zM15 8h1v1h-1zM0 9h1v1h-1zM8 9h2v1h-2zM15 9h1v1h-1zM0 10h1v1h-1zM5 10h2v1h-2zM9 10h2v1h-2zM15 10h1v1h-1zM1 11h1v1h-1zM5 11h2v1h-2zM10 11h2v1h-2zM14 11h1v1h-1zM1 12h1v1h-1zM14 12h1v1h-1zM2 13h1v1h-1zM13 13h1v1h-1zM3 14h2v1h-2zM11 14h2v1h-2zM5 15h6v1h-6z"/>
  <path class="n" d="M5 6h2v1h-2zM4 7h4v1h-4zM4 8h4v1h-4zM5 9h2v1h-2z"/>
</svg>
```

Desde a T-46, os quatro ícones animados não têm `<style>`. As classes `pkc-`, `pkt-`, `pkl-` e `pkp-`, os keyframes e o `prefers-reduced-motion` estão em `src/styles/global.css`. Os blocos abaixo mostram o desenho e a animação de origem; os arquivos em `src/assets/brand/icones/` são a versão sem `<style>`.

### Ícone Conceito (animado) · `src/assets/brand/icones/icone-conceito.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges">
  <style>.pkc-q1,.pkc-q2,.pkc-q3{opacity:0}.pkc-q0{animation:pkc-a0 3.2s step-end infinite}.pkc-q1{animation:pkc-a1 3.2s step-end infinite}.pkc-q2{animation:pkc-a2 3.2s step-end infinite}.pkc-q3{animation:pkc-a3 3.2s step-end infinite}@keyframes pkc-a0{0%{opacity:1}25%{opacity:0}100%{opacity:0}}@keyframes pkc-a1{0%{opacity:0}25%{opacity:1}50%{opacity:0}100%{opacity:0}}@keyframes pkc-a2{0%{opacity:0}50%{opacity:1}75%{opacity:0}100%{opacity:0}}@keyframes pkc-a3{0%{opacity:0}75%{opacity:1}100%{opacity:1}}@media (prefers-reduced-motion:reduce){.pkc-q0,.pkc-q1,.pkc-q2,.pkc-q3{animation:none}}</style>
  <path d="M4 0h4v1h-4zM2 1h2v1h-2zM8 1h2v1h-2zM1 2h1v1h-1zM10 2h1v1h-1zM1 3h1v1h-1zM10 3h1v1h-1zM0 4h1v1h-1zM11 4h1v1h-1zM0 5h1v1h-1zM5 5h2v1h-2zM11 5h1v1h-1zM0 6h1v1h-1zM5 6h2v1h-2zM11 6h1v1h-1zM0 7h1v1h-1zM11 7h1v1h-1zM1 8h1v1h-1zM10 8h1v1h-1zM1 9h1v1h-1zM10 9h1v1h-1zM2 10h2v1h-2zM8 10h2v1h-2zM4 11h4v1h-4z"/>
  <path class="pkc-q0" d="M9 2h1v1h-1zM8 3h1v1h-1zM7 4h1v1h-1z"/>
  <path class="pkc-q1" d="M7 7h1v1h-1zM8 8h1v1h-1zM9 9h1v1h-1z"/>
  <path class="pkc-q2" d="M4 7h1v1h-1zM3 8h1v1h-1zM2 9h1v1h-1z"/>
  <path class="pkc-q3" d="M2 2h1v1h-1zM3 3h1v1h-1zM4 4h1v1h-1z"/>
</svg>
```

### Ícone Tutorial (animado) · `src/assets/brand/icones/icone-tutorial.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges">
  <style>.pkt-cursor{animation:pkt-pisca 1.1s steps(1) infinite}@keyframes pkt-pisca{50%{opacity:0}}@media (prefers-reduced-motion:reduce){.pkt-cursor{animation:none}}</style>
  <path d="M1 2h2v1h-2zM2 3h2v1h-2zM3 4h2v1h-2zM4 5h2v1h-2zM3 6h2v1h-2zM2 7h2v1h-2zM1 8h2v1h-2z"/>
  <path class="pkt-cursor" d="M6 9h5v1h-5zM6 10h5v1h-5z"/>
</svg>
```

### Ícone Lab (animado) · `src/assets/brand/icones/icone-lab.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges">
  <style>.pkl-q1,.pkl-q2{opacity:0}.pkl-q0{animation:pkl-b0 1.8s step-end infinite}.pkl-q1{animation:pkl-b1 1.8s step-end infinite}.pkl-q2{animation:pkl-b2 1.8s step-end infinite}@keyframes pkl-b0{0%{opacity:1}33.3%{opacity:0}100%{opacity:0}}@keyframes pkl-b1{0%{opacity:0}33.3%{opacity:1}66.6%{opacity:0}100%{opacity:0}}@keyframes pkl-b2{0%{opacity:0}66.6%{opacity:1}100%{opacity:1}}@media (prefers-reduced-motion:reduce){.pkl-q0,.pkl-q1,.pkl-q2{animation:none}}</style>
  <path d="M3 1h6v1h-6zM4 2h1v1h-1zM7 2h1v1h-1zM4 3h1v1h-1zM7 3h1v1h-1zM3 4h1v1h-1zM8 4h1v1h-1zM2 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM9 6h1v1h-1zM1 7h1v1h-1zM10 7h1v1h-1zM1 8h10v1h-10zM0 9h3v1h-3zM4 9h8v1h-8zM0 10h12v1h-12z"/>
  <path class="pkl-q0" d="M5 5h1v1h-1zM6 7h1v1h-1z"/>
  <path class="pkl-q1" d="M6 4h1v1h-1zM5 6h1v1h-1z"/>
  <path class="pkl-q2" d="M5 3h1v1h-1zM6 5h1v1h-1z"/>
</svg>
```

### Ícone Playbook (animado) · `src/assets/brand/icones/icone-playbook.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges">
  <style>.pkp-on0,.pkp-on1,.pkp-on2{opacity:0}.pkp-on0{animation:pkp-n0 4s step-end infinite}.pkp-off0{animation:pkp-f0 4s step-end infinite}.pkp-on1{animation:pkp-n1 4s step-end infinite}.pkp-off1{animation:pkp-f1 4s step-end infinite}.pkp-on2{animation:pkp-n2 4s step-end infinite}.pkp-off2{animation:pkp-f2 4s step-end infinite}@keyframes pkp-n0{0%{opacity:0}18%{opacity:1}100%{opacity:1}}@keyframes pkp-f0{0%{opacity:1}18%{opacity:0}100%{opacity:0}}@keyframes pkp-n1{0%{opacity:0}36%{opacity:1}100%{opacity:1}}@keyframes pkp-f1{0%{opacity:1}36%{opacity:0}100%{opacity:0}}@keyframes pkp-n2{0%{opacity:0}54%{opacity:1}100%{opacity:1}}@keyframes pkp-f2{0%{opacity:1}54%{opacity:0}100%{opacity:0}}@media (prefers-reduced-motion:reduce){.pkp-on0,.pkp-on1,.pkp-on2,.pkp-off0,.pkp-off1,.pkp-off2{animation:none}.pkp-on0,.pkp-on1,.pkp-on2{opacity:1}.pkp-off0,.pkp-off1,.pkp-off2{opacity:0}}</style>
  <path d="M5 2h6v1h-6zM5 6h6v1h-6zM5 10h6v1h-6z"/>
  <path class="pkp-on0" d="M3 1h1v1h-1zM0 2h1v1h-1zM2 2h1v1h-1zM1 3h1v1h-1z"/>
  <path class="pkp-off0" d="M0 1h3v1h-3zM0 2h1v1h-1zM2 2h1v1h-1zM0 3h3v1h-3z"/>
  <path class="pkp-on1" d="M3 5h1v1h-1zM0 6h1v1h-1zM2 6h1v1h-1zM1 7h1v1h-1z"/>
  <path class="pkp-off1" d="M0 5h3v1h-3zM0 6h1v1h-1zM2 6h1v1h-1zM0 7h3v1h-3z"/>
  <path class="pkp-on2" d="M3 9h1v1h-1zM0 10h1v1h-1zM2 10h1v1h-1zM1 11h1v1h-1z"/>
  <path class="pkp-off2" d="M0 9h3v1h-3zM0 10h1v1h-1zM2 10h1v1h-1zM0 11h3v1h-3z"/>
</svg>
```

### Mão da saudação (animada) · `src/assets/brand/icones/aceno.svg`

Desde a T-44 o arquivo não tem `<style>`, `role` nem `aria-label`: as classes `pka-`, os keyframes e o `prefers-reduced-motion` estão em `src/styles/global.css`, e o `h1` da saudação põe `aria-hidden` no componente.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges">
  <g class="pka-a">
    <path fill="#F5B82E" d="M7 1h2v1h-2zM7 2h2v1h-2zM10 2h2v1h-2zM4 3h2v1h-2zM7 3h2v1h-2zM10 3h2v1h-2zM4 4h2v1h-2zM7 4h2v1h-2zM10 4h2v1h-2zM13 4h2v1h-2zM4 5h2v1h-2zM7 5h2v1h-2zM10 5h2v1h-2zM13 5h2v1h-2zM4 6h2v1h-2zM7 6h2v1h-2zM10 6h2v1h-2zM13 6h2v1h-2zM4 7h11v1h-11zM1 8h1v1h-1zM4 8h11v1h-11zM1 9h14v1h-14zM2 10h13v1h-13zM3 11h11v1h-11zM4 12h9v1h-9zM5 13h7v1h-7z"/>
    <path fill="#2A2118" d="M7 0h2v1h-2zM6 1h1v1h-1zM9 1h3v1h-3zM2 2h1v1h-1zM4 2h3v1h-3zM9 2h1v1h-1zM12 2h1v1h-1zM1 3h1v1h-1zM3 3h1v1h-1zM6 3h1v1h-1zM9 3h1v1h-1zM12 3h3v1h-3zM3 4h1v1h-1zM6 4h1v1h-1zM9 4h1v1h-1zM12 4h1v1h-1zM15 4h1v1h-1zM1 5h1v1h-1zM3 5h1v1h-1zM6 5h1v1h-1zM9 5h1v1h-1zM12 5h1v1h-1zM15 5h1v1h-1zM0 6h1v1h-1zM3 6h1v1h-1zM6 6h1v1h-1zM9 6h1v1h-1zM12 6h1v1h-1zM15 6h1v1h-1zM0 7h2v1h-2zM3 7h1v1h-1zM15 7h1v1h-1zM0 8h1v1h-1zM2 8h2v1h-2zM15 8h1v1h-1zM0 9h1v1h-1zM15 9h1v1h-1zM1 10h1v1h-1zM15 10h1v1h-1zM2 11h1v1h-1zM14 11h1v1h-1zM3 12h1v1h-1zM13 12h1v1h-1zM4 13h1v1h-1zM12 13h1v1h-1zM5 14h7v1h-7z"/>
  </g>
  <g class="pka-b">
    <path fill="#F5B82E" d="M5 1h2v1h-2zM5 2h2v1h-2zM8 2h2v1h-2zM2 3h2v1h-2zM5 3h2v1h-2zM8 3h2v1h-2zM3 4h2v1h-2zM6 4h2v1h-2zM9 4h2v1h-2zM12 4h2v1h-2zM3 5h2v1h-2zM6 5h2v1h-2zM9 5h2v1h-2zM12 5h2v1h-2zM3 6h2v1h-2zM6 6h2v1h-2zM9 6h2v1h-2zM12 6h2v1h-2zM4 7h11v1h-11zM1 8h1v1h-1zM4 8h11v1h-11zM1 9h14v1h-14zM2 10h13v1h-13zM3 11h11v1h-11zM4 12h9v1h-9zM5 13h7v1h-7z"/>
    <path fill="#2A2118" d="M5 0h2v1h-2zM13 0h1v1h-1zM4 1h1v1h-1zM7 1h3v1h-3zM14 1h1v1h-1zM2 2h3v1h-3zM7 2h1v1h-1zM10 2h1v1h-1zM1 3h1v1h-1zM4 3h1v1h-1zM7 3h1v1h-1zM10 3h3v1h-3zM14 3h1v1h-1zM2 4h1v1h-1zM5 4h1v1h-1zM8 4h1v1h-1zM11 4h1v1h-1zM14 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM8 5h1v1h-1zM11 5h1v1h-1zM14 5h1v1h-1zM2 6h1v1h-1zM5 6h1v1h-1zM8 6h1v1h-1zM11 6h1v1h-1zM14 6h1v1h-1zM0 7h2v1h-2zM3 7h1v1h-1zM15 7h1v1h-1zM0 8h1v1h-1zM2 8h2v1h-2zM15 8h1v1h-1zM0 9h1v1h-1zM15 9h1v1h-1zM1 10h1v1h-1zM15 10h1v1h-1zM2 11h1v1h-1zM14 11h1v1h-1zM3 12h1v1h-1zM13 12h1v1h-1zM4 13h1v1h-1zM12 13h1v1h-1zM5 14h7v1h-7z"/>
  </g>
</svg>
```
