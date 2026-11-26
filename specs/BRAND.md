# pk.log · Especificação da marca

Versão 1.44 · novembro de 2026 · pedroknoll.com

Este arquivo é a fonte da verdade da identidade visual e verbal do pk.log. Ele foi escrito para pessoas e para agentes de código. O manual visual interativo existe como artefato à parte; quando os dois divergirem, vale este arquivo. Quando o comportamento discordar da SPEC, vale a SPEC.

## 0. Como usar este arquivo

- **Decisão** é regra fechada. Siga como está.
- **Sugestão** é um ponto de partida. Ajuste ao código, ao schema e à SPEC.
- Este arquivo é a identidade. Em conflito de comportamento com a SPEC, vale a SPEC; avise no PR.
- A seção 14 é sugestão. A ordem das tarefas está na Fase 1b do ROADMAP. Onde a seção 14 discordar da SPEC ou do ROADMAP, valem a SPEC e o ROADMAP.
- Não crie nomes paralelos `--papel` / `--prussia` no CSS de componente, página ou layout. A lista fechada é `surface`, `sheet`, `ink`, `muted`, `pencil`, `line`, `accent`, `highlight`, `grid` e `grid-strong` (T-41, T-72, T-120, T-76). Sem `@custom-variant dark` e sem `dark:` nos componentes.
- A stack é Astro 7 + Tailwind v4. A seção 13 é sugestão de tokens; confirme a SPEC §9 antes de aplicá-la.
- SVGs, favicons e temas do Shiki estão na árvore abaixo, com os nomes originais. O apêndice repete o código dos SVGs principais e usa esses caminhos.

```text
specs/BRAND.md
src/assets/brand/pklog-simbolo{,-escuro,-currentcolor,-construcao,-pixel,-404}.svg
src/assets/brand/icones/aceno.svg
src/assets/brand/icones/icone-artigo.svg
src/assets/brand/icones/icone-prototipo.svg
src/assets/brand/icones/icone-relogio.svg
src/assets/brand/icones/icone-busca.svg
src/assets/brand/icones/icone-rss.svg
src/styles/shiki/pk-claro.json
src/styles/shiki/pk-escuro.json
public/favicon.svg · favicon.ico · favicon-16.png · favicon-32.png · apple-touch-icon.png
```

`icon-192.png` e `icon-512.png` não entram no repositório. Sem manifesto PWA.

Sol, lua, fogo e voto estão só no apêndice, até a tarefa que cria o arquivo. A lupa está na árvore (T-22).

---

## 1. Marca

| Item | Valor | Regra |
|---|---|---|
| Nome | **pk.log** | Decisão. Sempre minúsculo, sem espaço, com o ponto. |
| Endereço | **pedroknoll.com** | Decisão. O domínio leva o nome completo; a marca, as iniciais. |
| Autor | **Pedro Knoll** | Assinatura à mão no certificado e nas peças gráficas; no site, fora das páginas até uma tarefa medir (T-52). |
| Saudação (headline da home) | **Olá, eu sou o Pedro. 👋** | Decisão da T-126 (Q23); no ar desde a T-125. Só "Pedro" em negrito. A mão é o ícone em pixel `aceno.svg`, no fim do h1, nunca o emoji do sistema. |
| Texto de apresentação | **Aqui documento meus aprendizados e experimentos sobre Inteligência Artificial.** | Decisão. Vem logo abaixo da saudação. |
| Descrição curta | **Aprendizados e experimentos em IA** | Para bio, avatar, meta description, assinatura vertical. |
| Título de página (`<title>`) | `{Título} · pk.log · Pedro Knoll` | Sugestão. "log" é palavra comum; o nome completo ajuda a busca. |

**Grafias.** Certo: `pk.log`. Errado: `PK.LOG`, `PK Log`, `PK'log`, `Pk.Log`.

**Significado.** "pk" são as iniciais de Pedro Knoll. "log" é ao mesmo tempo o log de treino de um modelo, o diário de bordo dos aviadores e o blog. Na assinatura, "pk" vem na fonte de display, IBM Plex Sans Condensed 600 (até a T-60, era a serifa Cormorant), e "log" em mono. O pk não usa itálico: o itálico pedia outro arquivo e entrava no LCP (T-52). O ponto é sempre azul-da-prússia e é o mesmo nó central do símbolo.

**Vocabulário editorial.**
- Cada texto é um **post**. A palavra "fólio" sai (T-119, T-120).
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
| `pklog-simbolo-currentcolor.svg` | Para inline, como SVG component. O traço e os nós das pontas herdam a cor do texto (`currentColor`); o nó central fica em `accent` e o halo, em `surface`, a cor do fundo do header, pelos tokens, nos dois temas. Sem `<title>`, `role`, tamanho nem hex no arquivo: é decorativo e leva `aria-hidden` no uso (T-53). |
| `pklog-simbolo-construcao.svg` | Peças grandes (capa, sobre, slides de abertura): mostra as linhas de construção. Nunca em tamanho pequeno. |
| `pklog-simbolo-pixel.svg` e os favicons em `public/` | Abaixo de 24 px: versão em pixel 16×16, sem os nós das pontas. |
| `pklog-simbolo-404.svg` | Só a página 404: a folha arrancada, com o símbolo na versão 404 (abaixo). |

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
**Tamanhos mínimos:** símbolo 24 px; versão pixel 16 px; assinatura horizontal 100 px de largura, o tamanho do header do site (corpo de 1,25rem, símbolo de 31 px; 101,5 px medidos na T-53).

**Versão 404 (só na página 404).** O símbolo perdeu um nó. No mesmo viewBox 100×100 do desenho padrão:
- O círculo continua com r = 44 e traço 3, mas fica tracejado (5 cheio, 4 vazio) e em prússia.
- A haste e a perna de cima não mudam: traço 6, pontas redondas, em tinta. Os nós (37,22), (37,78) e (67,22) continuam com r = 4,5, cheios, em tinta.
- A perna de baixo, de (37,50) a (67,78), vira uma aresta pontilhada em tinta: traço 3, pontos redondos a cada 6.
- O nó (67,78) fica vazio: r = 6, contorno de traço 2 em tinta, miolo da cor do fundo.
- O nó central continua com r = 8, em prússia. O halo da cor do fundo é um disco de r = 9,5 desenhado por baixo, o mesmo raio externo do halo padrão.

O símbolo entra numa folha arrancada de caderno, com escala uniforme de 1,2, sem girar e sem achatar. A folha tem a proporção A5: a cota de cima marca `148 mm` e a da direita, `210 mm` (seção 6). Da esquerda para a direita vêm uma linha em tinta, uma faixa da cor da folha com os furos da espiral, a borda em zigue-zague e a folha, com o contorno tracejado em lápis. Duas notas à margem (seção 6), "estava aqui" e "nó não encontrado", têm uma seta curva até o nó vazio. As cores vêm dos tokens pela cor do texto (`currentColor`), sem hex, para funcionar nos dois temas. A ilustração é decorativa e entra com `aria-hidden`: não diz nada que o texto da página não diga. Fora da página 404, use as outras versões.

**Proibido:** esticar ou achatar; girar; trocar cores por cores fora da paleta; sombra, brilho ou gradiente; aplicar sobre foto sem fundo sólido.

---

## 4. Cores (pigmentos)

Fundo **sempre liso**, sem textura, sem vinheta.

### Tokens

| Token | Claro (velino) | Escuro (cianotipia) | Papel |
|---|---|---|---|
| `--papel` | `#FAF9F5` | `#0E2236` | Fundo da página. |
| `--folha` | `#F0EEE6` | `#163250` | Superfícies: blocos de código, cartões em destaque, faixa do caderno. |
| `--tinta` | `#2A2118` | `#E8EEF3` | Texto principal (tinta ferrogálica: marrom quase preto). |
| `--grafite` | `#5E5345` | `#A9BACB` | Texto secundário. |
| `--lapis` | `#7B6F5A` | `#869EB6` | Metadados. Não é texto menor que 24 px sobre folha clara. Comentário de código não usa lápis. |
| `--linha` | `rgba(60,40,20,.16)` | `rgba(232,238,243,.18)` | Bordas e divisórias. |
| `--prussia` | `#1F4B7A` | `#8DB8E8` | **Cor principal.** Links, título do item no hover, foco, nó do símbolo, ponto do nome. |
| `--latao` | `#84601A` | `#D9B85C` | Número no código (§9.5). |
| `--sanguinea` | `#A3392A` | `#EE8A74` | Função no código (Shiki, §9.5) e destaque e intensidade das figuras (§9.8). No CSS, `highlight` (T-76). |
| `--verdete` | `#2E6B5A` | `#7CC7AE` | Texto (string) no código (§9.5). |
| `--ouro` | `#F5B82E` | `#F5B82E` | **Exceção:** só a mão da saudação. |
| `--contorno-px` | `#2A2118` | `#2A2118` | Contorno da mão em pixel, nos dois modos. |
| `--grade` / `--grade-forte` | `rgba(42,33,24,.03)` / `.065` | `rgba(232,238,243,.025)` / `.055` | Grade milimetrada, em tinta (T-76). No CSS, `grid` e `grid-strong` (T-72). |
| `--grade-px` | `rgba(42,33,24,.07)` | `rgba(232,238,243,.07)` | Grade de exibição dos ícones em pixel (só em documentação). |

### Regras de cor (decisões)
- **Proporção em qualquer peça:** papel ~68%, tinta ~20%, prússia ~7%, latão + sanguínea + verdete ≤ 5% somados.
- **Latão e verdete ficam só no código (§9.5); a sanguínea fica na função do código e nas figuras (§9.8, T-76).** Nunca marcam tipo, avisos, erros, sucesso ou resultados, e nunca são fundo de página. Os tipos ficam em tinta (§8).
- **Prússia só no que é interativo** (decisão da T-126, Q23): links, título no hover (sem sublinhado nos itens da lista, T-125) e foco. Na interface, nenhuma outra cor de destaque além da mão; a contagem do voto e os metadados ficam em tinta, grafite ou lápis. O ponto da assinatura e o nó do símbolo continuam prússia: são a marca, e o header não muda.
- **Ouro-pigmento** aparece só na mão da saudação, sempre com contorno em tinta (amarelo puro some sobre o fundo claro).
- **Pergaminho** (`#EADFC8`, com `--folha #DFD2B6`, `--grafite #5A4D3C`, `--lapis #8E7E64`, `--latao #765514`, `--sanguinea #9E3526`, `--verdete #2B6454`) é um tom mais fundo **só para peças gráficas**: slides, posts de rede social, capas, certificado. Nunca no blog.
- **Nomes na interface:** o controle de tema mostra um sol e uma lua (§9.9), e os nomes dos dois botões, para o leitor de tela, são **Claro** e **Escuro** (T-109). "Velino" e "cianotipia" são nomes internos.
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

Nas figuras (T-76), com a sanguínea como `highlight`:

| Par | Claro | Escuro |
|---|---|---|
| destaque × célula (folha) | 5,7 | 5,3 |
| destaque × papel | 6,3 | 6,6 |
| traço e contorno do mapa (tinta) × papel | 15,0 | 13,8 |
| mapa, degrau 1 → 5 × papel | 1,4 → 6,3 | 1,4 → 6,6 |
| mapa, degraus vizinhos entre si | 1,4 a 1,5 | 1,4 a 1,5 |

Lápis sobre folha clara (4,2) fica abaixo de 4,5. Lápis não é texto menor que 24 px sobre folha clara; nesse tamanho, use grafite. Comentário de código não usa lápis. No tema claro do Shiki o comentário é `#5E5345`. O tema escuro não muda o comentário nesta revisão (`#869EB6`).

---

## 5. Tipografia

As três famílias entram pela Fonts API do Astro (`fontProviders.fontsource()`), subset `latin`, `woff2`. Sem `fontProviders.google()` e sem pacote `@fontsource/*` instalado à mão.

| Papel | Fonte | Pesos | Regras |
|---|---|---|---|
| Títulos | **IBM Plex Sans Condensed** | 600 | Só 600 normal, sem itálico declarado, até uma tarefa medir outra face (T-52, T-60, LCP). |
| Texto | **IBM Plex Sans** | 400, 400 itálico, 600 | 18 px, altura de linha 1,65, coluna de ~65 caracteres. |
| Código, rótulos, data, cotas | **IBM Plex Mono** | 400 | Rótulos em maiúsculas com letter-spacing .08–.14em. Só o peso 400 (T-52, LCP). |

**Regras da display (decisão, 05/11/2026, T-60).**

- IBM Plex Sans Condensed só no peso 600 normal. Um trecho em itálico num título (`## Um *exemplo*`) usa o itálico que o navegador sintetiza, sem arquivo a mais.
- Sem tamanho mínimo próprio. A regra dos 28 px e as exceções de 22 px (título do card, número do fólio, assinatura) existiam porque a Cormorant ficava frágil em tamanho pequeno, e saíram com ela. Os tamanhos de hoje ficam; a escala nova é das T-64 e T-65.
- O h3 a 22 px continua IBM Plex Sans 600.

**Escala (px):** display 64 · h1 44 · h2 30 · h3 22 (Plex Sans 600) · texto 18 · rótulo 12. O h1 de página (post, tag e 404) fica em 36 px abaixo de `sm` (640 px) e em 44 px de `sm` em diante; a saudação da home tem tamanho próprio (§9.1). O rótulo usa letter-spacing de 0,1em (T-51). Exceção da home abaixo de `sm` (T-126, Q23): o rótulo de seção fica em 15 px, ainda em Plex Mono 400, e o título do item em 20 px (§9.2).

**Saudação mista (decisão da T-126, Q23; no ar desde a T-125).** O h1 da saudação é IBM Plex Sans 400, e só "Pedro" vai na fonte de display, IBM Plex Sans Condensed 600. As duas faces já são carregadas na home: sem face nova, e o teto de 3 arquivos e 61.000 bytes não muda.
Títulos com `text-wrap: balance`.

**Fonte de display (decisão, 04/11/2026, T-63).** A IBM Plex Sans Condensed 600 substitui a Cormorant Garamond em tudo que usa o token de display: assinatura, saudação, card, h1 de página, h2 da prosa e 404. É da mesma superfamília do texto e dos rótulos. O arquivo latin tem 19.816 bytes, contra 23.396 da Cormorant: a home e a tag caem de 60.692 para 57.112 bytes, sem mudar o teto de 61.000. A troca entrou na T-60, com o arquivo de 19.816 bytes medido no build.

**Escala do post (decisão, T-63; revista na T-67 e na T-128).** O h1 do post fica em 36 px abaixo de `sm`, 44 px de `sm` em diante e 56 px (3,5rem) de `lg` em diante, com entrelinha 1,02 no `lg`, sem mudar o espaçamento das letras. Os 80 px da T-67 caíram na T-128, por decisão do autor: na coluna do texto, um título de 69 caracteres ia a 4 ou 5 linhas, e a 56 px fica em 3. A linha fina, em 18 px e 20 px de `lg` em diante. No topo do post, 56 px de respiro em todas as larguras. O texto do post fica em 18 px; o h2, em 30 px, e o h3, em 22 px. (seção 9.3, T-65, T-67 e T-128).

---

## 6. Elementos gráficos

| Elemento | Regra |
|---|---|
| **Grade milimetrada** | Linhas de 1 px a cada 8 px, reforço a cada 40 px, cores `--grade`/`--grade-forte`. **Só em capas, diagramas e peças gráficas. Nunca atrás de texto corrido.** |
| **Linhas de construção** | Tracejado fino em prússia, passando além da forma, como num esboço. Em diagramas e no símbolo grande. |
| **Cotas** | Linha de medida do desenho técnico (traço com marcas nas pontas e valor em mono). Mostram formato de tensor `[batch, 512, 768]`, tempo, tamanho de modelo. Todo diagrama tem pelo menos uma. |
| **Nota à margem** | IBM Plex Sans itálico, em prússia, com um traço ou seta curva, levemente inclinada (−1,5°). Uma por seção. A T-52 trocou a Caveat por esta face por causa do LCP. |

---

## 7. Ícones em pixel

- **Grade 12 × 12, uma cor (`currentColor`), cantos retos, sem suavização** (`shape-rendering: crispEdges`).
- Use em **12, 24, 36 ou 48 px** (múltiplos de 12) para não borrar.
- **Exceção:** a mão da saudação (`aceno.svg`) é **16 × 16**, com contorno `--contorno-px` e corpo `--ouro`. Use em 16, 32 ou 48 px. Fica no fim do h1 da saudação, depois do ponto, em 32 px em todas as larguras (T-125, §9.1).
- **Animação quadro a quadro** (decisão): só o aceno, dois quadros alternando 4 vezes, depois pausa (3,2 s, contínuo). Conceito, Tutorial e Playbook saíram da lista e da animação (T-119, T-120).
- **Onde anima:** só a mão da saudação. O aceno usa classes com prefixo `pka-`.
- **Ícones (decisão da T-119):** `icone-artigo.svg` (folha) e `icone-prototipo.svg` (frasco), dos tipos (§8), no h1 de `/artigos/` e de `/prototipos/`; `icone-fogo.svg`, no h1 de `/mais-votados/`; `icone-voto.svg` (triângulo de 10×8), à esquerda da contagem; `icone-busca.svg` (lupa), no botão de busca do header (§9.13); `icone-rss.svg`, no `Assinar via RSS` da saudação (§9.1, T-125); `icone-sol.svg` e `icone-lua.svg`, do controle de tema (§9.9). Todos com 12 × 12, uma cor, só parados, sem versão animada. O desenho está no apêndice. A folha, o frasco, a lupa e o RSS estão na árvore (T-120, T-22, T-125); o sol e a lua, na T-24; o fogo e o voto, na T-123. O `icone-filtro.svg` não entra: o filtro é um `select` nativo (T-124).
- **Relógio** (`icone-relogio.svg`): 12 × 12, só parado, sem versão animada. Entra antes do tempo de leitura: no item (§9.2), na linha de metadados do post e no fim do índice (§9.3).
- **Voto** (`icone-voto.svg`): no botão `Votar` (§9.14) e no `▲ N votos` de Mais votados e do item das listas inteiras (§9.2, T-131, Q24). O item de Recentes não tem votos (T-126, Q23).
- Todas as animações respeitam `prefers-reduced-motion: reduce` (ficam paradas).

---

## 8. Sistema de conteúdo

**Decisão de 19/11/2026 (SPEC, Q22, T-120):** o tipo é Artigo ou Protótipo. Saem nível e tema.

Um eixo: **tipo** (formato). Não tem cor: o tipo se distingue pelo ícone.

### Tipos (decisão)

| Tipo | Cor | Ícone | O que é |
|---|---|---|---|
| **Artigo** | tinta | folha (`icone-artigo.svg`) | Explica uma ideia ou conta um aprendizado, do problema ao resultado. |
| **Protótipo** | tinta | frasco (`icone-prototipo.svg`) | Mostra algo construído e funcionando: o que faz, como foi feito e onde quebra. |

Os tipos não têm estrutura nem layout próprios (SPEC Q22). O tipo aparece no h1 de `/artigos/` e de `/prototipos/` (ícone de 24 px, em tinta), na linha de metadados do post, em texto (`Artigo` ou `Protótipo`, §9.3), e na imagem OG (§11). Até a T-128, no ar, o post mostra o tipo na linha Tipo da tabela abaixo de `lg` (ícone de 12 px) e, de `lg` em diante, no topo da lateral (`/ ARTIGO` ou `/ PROTÓTIPO`); os dois saem na T-128 (T-126, Q23). O header não leva o ícone (§9.13). O item não mostra o tipo.

Qualquer tipo pode ter cadernos marimo (§9.6).

### Frontmatter (sugestão, ajuste ao schema atual das content collections)

```yaml
kind: article            # article | prototype
tags: [LLMs, Fine-tuning]
```

A SPEC §6 fecha o schema, sem `folio`, `level` e `featured` (T-120). Chaves em inglês (`kind`, `tags`, `references`, `appendices`); `kind` no enum inglês; o tempo do post é só o `minutesRead`; o caderno não tem campo no frontmatter: o componente `Notebook` aponta o arquivo no MDX (SPEC §7).

---

## 9. Componentes

### 9.1 Saudação (home)
Decisão da T-126 (Q23); no ar desde a T-125.

- **Foto:** `site.author.avatar` (`src/assets/avatar.jpg`, servida em 176 px na home e 56 px no post), redonda, acima do h1: 88 px de `lg` em diante e 72 px abaixo, com contorno de 1 px em `line` e alt `Foto de Pedro Knoll`. Largura e altura no HTML: a foto pode virar o elemento de LCP da home, e a T-125 mede no Lighthouse.
- **h1:** `Olá, eu sou o Pedro.`, em IBM Plex Sans 400, com só "Pedro" em IBM Plex Sans Condensed 600 (§5). O tamanho é o da T-44 e da T-69: `clamp(2.4rem, 4.4vw, 3.5rem)` abaixo de `lg` (no máximo 56 px) e 36 px de `lg` em diante. A mão (`aceno.svg`) fica no fim do h1, depois do ponto, decorativa (`aria-hidden`), em 32 px (§7). A quebra de linha não pode depender da fonte: a troca da fonte reserva pela da marca não pode mover o h1 (T-44, CLS). Por isso a quebra é fixa no HTML, em duas linhas: `Olá, eu sou` e `o Pedro.` com a mão (T-125).
- **Texto:** `Aqui documento meus aprendizados e experimentos sobre Inteligência Artificial.`, em Plex Sans 18 px, entrelinha 1,55, cor grafite, máximo ~46 caracteres por linha (T-63, T-64).
- **Links do autor,** abaixo do `Assinar via RSS`: `GitHub ↗` e `LinkedIn ↗`, em IBM Plex Mono 14 px, em caixa normal, sem letter-spacing, em tinta, indo para prússia no hover e no foco, com 44 px de altura para o toque e na mesma aba. A seta é decorativa (`aria-hidden`): o nome acessível é só `GitHub` e `LinkedIn` (T-125).
- **RSS:** sai da fileira e vira `Assinar via RSS`, um link para `/rss.xml` com aparência de botão, com contorno (§9.11) e o ícone de RSS (`icone-rss.svg`, 12 px) antes do texto, na mesma aba, logo abaixo do texto e acima dos links do autor (T-125).
- Lateral, de `lg` em diante, só na home: a saudação vira uma coluna de 15rem à esquerda, sticky no topo da tela, com 6rem de vão até a coluna das listas. O conteúdo do site fica em 72rem (token `--container-site`, utilidade `max-w-site`), e o header e o footer alinham a essa largura, na mesma margem das laterais da home e do post. Abaixo de `lg`, a saudação e os links ficam em cima das listas e rolam com a página (T-69). De `lg` em diante, o contêiner da lateral e das listas ganha 56 px de respiro em cima, somados aos 40 px da saudação (T-70).
- A newsletter não entra na saudação. Na home, fica depois das listas, na coluna da direita (§9.2). No post, fica no fim (§9.14). Entra na T-116. Até lá, a home não tem esse bloco.

### 9.2 Item e páginas de lista
Decisão da T-126 (Q23), que substitui a da T-119, e da T-131 (Q24) nas listas inteiras e em `/mais-votados/`. No ar desde a T-125 (home) e a T-131 (listas e Comece aqui).

**Item de Recentes** (`/ RECENTES` da home e Comece aqui, §9.15):

- Um `article` em grade. De `sm` em diante, três colunas centradas na vertical: a data (6,5rem), o título e, à direita, uma coluna só com o tempo de leitura. Abaixo de `sm`, os três empilhados: data, título e tempo.
- **Data:** mono 12 px, lápis, no formato `21.out.2026`.
- **NOVO:** nos posts publicados nos últimos 7 dias. Mono 12 px, maiúsculas, grafite; abaixo da data de `sm` em diante e ao lado dela abaixo de `sm`. É calculado no navegador a partir do `datetime` do item, com o lugar reservado no HTML, para o rótulo não deslocar a página. Sem JavaScript, sem rótulo. De `sm` em diante, a data, o título e o tempo ficam no centro vertical do item, e o `NOVO` pende abaixo da data, sem mudar esse centro (T-131).
- **Título:** fonte de display 600, entrelinha 1,2, com `text-wrap: balance`. 20 px abaixo de `sm` e 26 px de `sm` em diante.
- **Tempo:** o relógio parado de 12 px e `11 minutos` (`1 minuto` no singular), em mono 12 px, lápis. "de leitura" vai só no texto para leitor de tela e no `title`. Sem votos, resumo, capa, tipo, tema, nível, tag nem hachura.
- **Toque:** o item inteiro é tocável: o link do título se estica sobre o item (`after:absolute after:inset-0`, com o `article` em `relative`). O tempo não intercepta o toque (`pointer-events-none`).
- **Hover:** com o ponteiro sobre o item, fundo `sheet` na linha e título em `accent`, sem sublinhado (pedido do autor na T-125, exceção à §9.10). No foco do teclado, o mesmo, com o contorno da §9.10. Sobre o `sheet`, a data e o tempo passam de lápis a grafite, porque lápis não é texto pequeno sobre folha clara (§4, T-125). Sem transição com `prefers-reduced-motion`. Saem a queda dos outros itens para 0,35 de opacidade e a exceção à §9.10.
- A lista separa os itens com divisória `divide-line`. O respiro é só vertical: 1,25rem em cima e embaixo abaixo de `sm`, e 2rem de `sm` em diante. Sem borda, sem sombra e sem capa.

**Item das listas inteiras** (`/blog/`, `/artigos/`, `/prototipos/`, `/tags/<tag>/` e `/mais-votados/`; T-131, Q24):

- Um `article` em grade. De `sm` em diante, colunas: a data (6,5rem, como no item de Recentes), em `/prototipos/` a miniatura (6rem), o título com a descrição embaixo e, à direita, uma coluna de 7,5rem com o tempo e, embaixo, os votos. A coluna da direita tem largura fixa, para os votos não mudarem a largura do título quando aparecem. Vão de 1,5rem entre as colunas. Abaixo de `sm`: a data com o `NOVO` ao lado, o título, a descrição e uma linha com o tempo, `·` e os votos; em `/prototipos/`, a miniatura fica à esquerda do título, da descrição e dessa linha.
- **Data:** como no item de Recentes: `21.out.2026`, mono 12 px, lápis.
- **NOVO:** como no item de Recentes: abaixo da data de `sm` em diante e ao lado dela abaixo de `sm`.
- **Alinhamento vertical:** de `sm` em diante, as colunas ficam no centro vertical do item (`align-items: center`): a linha da data, a miniatura, o bloco do título com a descrição e a linha do tempo. O `NOVO` e os votos pendem logo abaixo da data e do tempo, fora dessa conta, para não mudarem o centro quando aparecem (T-131).
- **Título:** como no item de Recentes (20 px abaixo de `sm`, 26 px de `sm` em diante).
- **Descrição:** a `description` do post, em até 2 linhas (`line-clamp`), em Plex Sans 16 px, entrelinha 1,5, grafite.
- **Tempo:** o relógio parado de 12 px e `11 minutos`, como no item de Recentes.
- **Votos:** `▲ N votos` (`icone-voto.svg`, o número e `votos`, ou `voto` com 1), mono 12 px, na cor do tempo. Só aparecem com 1 voto ou mais: com 0, sem JavaScript ou com a API falhando, não há linha de votos. Não interceptam o toque.
- **Miniatura** (só em `/prototipos/`): o `cover` do post, recortado, decorativo, 96×72 de `sm` em diante e 72×54 abaixo. Sem `cover`, o bloco `sheet` da faixa de Protótipos da home, na mesma medida. Sem hachura.
- **Toque, hover e foco:** como no item de Recentes. Sem tags, tipo nem hachura.
- **Rótulo:** a lista abre com `/ LISTAGEM`, no estilo do cabeçalho das faixas da home (mono 12 px em maiúsculas sobre um filete de 1 px em tinta; abaixo de `sm`, 15 px e filete de 2 px), e o título do post é h3. O lado direito da linha do rótulo tem a ordenação (T-133, BRAND 1.42): rótulo visível `Ordenar por` em Plex Mono 12 px, tinta, a fonte e o tamanho do link das faixas da home (abaixo de `sm`, só para leitor de tela, para caber em 360 px), e um `select` nativo sem caixa: sem borda, sem fundo e sem a seta do sistema, o valor em Plex Mono `accent`, 12 px de `sm` em diante e 16 px abaixo (o Safari do iPhone dá zoom no toque abaixo de 16 px), com uma seta fina em `accent` desenhada no CSS e sublinhado no hover; alvo de 44 px de altura, na linha de base de `/ LISTAGEM`. Opções: `Mais recentes` (padrão), `Mais antigos` e `Mais votados`; sem ordem por tempo de leitura (decisão do autor). No HTML do build sai `disabled`, e o script o habilita sem mudar a altura; `Mais votados` espera os votos. Em `/mais-votados/`, sem ordenação: o lado direito fica vazio. Os itens se separam por `divide-line`, com um filete em `line` no fim da lista.
- Em `/mais-votados/`, o mesmo rótulo e o mesmo item, montado pelo script do ranking, sem miniatura e sem a posição: a ordem é o ranking.

**Item de Mais votados** (`/ MAIS VOTADOS` da home): a posição (`01`, `02`…) em mono, o título e `▲ N votos` (`icone-voto.svg`, o número e `votos`, ou `voto` com 1), em tinta, não lápis: o voto é o dado principal. Sem data e sem tempo de leitura. Os itens saem do script do ranking.

**Item de Protótipos** (`/ PROTÓTIPOS` da home): miniatura de 72×54 à esquerda, o título e a `description` do post em até 2 linhas (`line-clamp`), sem tags. A miniatura é o `cover` do post, recortado, decorativa. Sem `cover`, um bloco `sheet` decorativo com a mesma medida. Sem campo novo no schema.

**Home.**

- A saudação (§9.1) à esquerda, de `lg` em diante. Na coluna da direita, as faixas. Sem destaque, sem paginação, sem barra de tipos e sem busca.
- **Cabeçalho de seção:** o rótulo (`/ RECENTES`, `/ MAIS VOTADOS`, `/ PROTÓTIPOS`) em mono 12 px, maiúsculas, tinta, sobre um filete de 1 px em tinta, com 8 px entre o texto e o filete. Abaixo de `sm`, o rótulo fica em 15 px, ainda em Plex Mono 400, e o filete em 2 px. O link fica à direita, na mesma linha de base do rótulo, sempre em `accent`, com seta: `Todos os N posts →` em `/ RECENTES` (para `/blog/`), `Todos os N protótipos →` em `/ PROTÓTIPOS` (para `/prototipos/`) e `Ver ranking →` em `/ MAIS VOTADOS` (para `/mais-votados/`), este sem número. Os dois números saem no HTML. O nome acessível é o texto visível sem a seta (`Todos os 12 posts`, `Todos os 3 protótipos`, `Ver ranking`); com 1 item, o texto visível e o nome vão para o singular (`O único post →`, `O único protótipo →`). Isso substitui o `Todos · N` e os nomes da T-124; o script do ranking deixa de escrever o total.
- **`/ RECENTES`**, na largura da coluna: 5 posts, os dois tipos, por data, no HTML, com o item acima.
- Abaixo, duas colunas lado a lado de `lg` em diante, empilhadas abaixo de `lg`.
- **`/ MAIS VOTADOS`:** no HTML, só a frase `O ranking precisa de JavaScript.` Com JavaScript, o script monta o top 10, com o item de Mais votados: posts com pelo menos 1 voto, empate pela data mais recente. Sem voto nenhum, a frase `Nenhum voto ainda.` e nenhum item; o bloco continua, para o link não sumir.
- **`/ PROTÓTIPOS`:** 5 protótipos mais recentes, no HTML, com o item de Protótipos. O bloco não é renderizado sem protótipo publicado; nesse caso, `/ MAIS VOTADOS` ocupa a largura toda.
- **Abaixo de `sm`:** o título do item em 20 px nas três faixas, e mais espaço entre as faixas.
- **Colunas de `lg` em diante:** em `/ MAIS VOTADOS` e `/ PROTÓTIPOS`, que dividem a largura, o título do item fica em 20 px e a `description` em 14 px; entre `sm` e `lg`, o título fica em 22 px. `/ RECENTES` mantém os 26 px (T-125).
- A newsletter (§9.14) fica depois das faixas, na largura da coluna da direita.

**Páginas de lista (T-123).** Sem paginação e sem saudação. O item é o das listas inteiras (T-131).

- **`/blog/`:** h1 `Blog`, sem ícone. A lista inteira, os dois tipos, por data.
- **`/artigos/` e `/prototipos/`:** h1 `Artigos` ou `Protótipos`, na escala do h1 de página (§5), com folha ou frasco em 24 px, em tinta, antes do nome. A lista inteira do tipo, por data. Um tipo sem post publicado não tem página.
- **`/mais-votados/`:** h1 `Mais votados`, com `icone-fogo.svg` em 24 px, em tinta. O ranking não está no HTML. Sem JavaScript, só o aviso `O ranking precisa de JavaScript.` Com JavaScript, os posts com pelo menos 1 voto, empate pela data mais recente.
- **`/tags/<tag>/`:** h1 `Tag: <nome>`. Sem o select; só a contagem.
- **Lateral (T-131):** de `lg` em diante, na grade da home (§9.1: 15rem, 6rem de vão, `max-w-site`), uma lateral sticky com o h1, logo abaixo a linha de contagem (mono 12 px, maiúsculas, lápis) e, abaixo dela, o filtro (§9.12). A lista fica na coluna da direita. Abaixo de `lg`, a lateral fica em cima da lista.

### 9.3 Cabeçalho do post (página do post)
Decisão da T-126 (Q23), que substitui a da T-63 à T-120. O cabeçalho entrou na T-128, o índice na T-129 e o bloco de voto e compartilhar na T-130 (§9.14).

- **Título e linha fina, na coluna do texto:** deixam de ocupar a largura toda. O cabeçalho tem a largura da prosa (65ch na fonte e no tamanho do texto), e o filete acaba onde o texto acaba. h1 na escala do post (§5), com `text-wrap: balance`; abaixo, a linha fina em grafite, até ~52 caracteres. Se a escala de 80 px não couber na coluna, a T-128 para e pergunta.
- **Metadados,** logo abaixo da linha fina, numa linha: a foto do autor (28 px, redonda, contorno de 1 px em `line`, decorativa) e `Pedro Knoll` · a data (`21.out.2026`) · o relógio e `6 minutos` · o tipo, `Artigo` ou `Protótipo`. O nome fica em IBM Plex Sans, tinta; a data, os minutos e o tipo em IBM Plex Mono 14 px, grafite; os `·` são decorativos (T-128). Abaixo, as tags em etiquetas com contorno `line`, texto em tinta, IBM Plex Mono 12 px e cantos de 0,25rem, cada uma com link para `/tags/<tag>/`. Um filete de 1 px em tinta fecha o cabeçalho (decisão do autor na T-128, pelo mockup); ele é a sentinela do bloco de voto (§9.14). Entre o filete e o texto, 2,5rem.
- **Saem:** a tabela de chave e valor da lateral, o rótulo `/ ARTIGO` ou `/ PROTÓTIPO`, a linha Tipo só para leitor de tela (o tipo passa a estar na tela), o título que aparecia acima da lateral ao rolar e o filete em tinta que abria a coluna do texto. O `updatedDate` continua no schema; o cabeçalho não o mostra.
- **Abaixo de `lg`:** sem lateral. O mesmo cabeçalho, rolando com o texto; o voto e o compartilhar ficam no fim do texto (§9.14). Sem índice.
- **Lateral, de `lg` em diante:** à esquerda, com 15rem e vão de 4rem até o texto. Na altura do cabeçalho, vazia. Abaixo, o índice e o bloco de voto e compartilhar (§9.14).

**Índice** (SPEC RF-26; T-129). De `lg` em diante, na lateral, um `nav` com nome acessível `Neste artigo`.

- **Topo:** o rótulo `/ NESTE ARTIGO` em mono 12 px, maiúsculas, tinta, e, à direita, a porcentagem lida (`42%`), com `aria-hidden`. O filete embaixo do rótulo é a barra de progresso: 2 px em `line`, preenchida em tinta conforme a leitura.
- **Itens:** um por h2, numerados `01`, `02`… em mono 12 px grafite, com o título do h2 em IBM Plex Sans 15 px, tinta, como link para a âncora, separados por divisórias `line`. A seção atual fica com o fundo `sheet` (o do hover, §9.2), o título em IBM Plex Sans 600 e `aria-current="location"`; uma cópia invisível do título em 600 reserva a altura, para o item não mudar de tamanho. O 600 acrescenta uma face nos posts com índice, dentro do teto de post do `font-budget.spec.ts` (T-129: de 3 arquivos e 57.112 bytes para 4 e 81.364).
- **Fim:** o relógio e `N minutos de leitura`, em mono 12 px grafite.
- **Posição:** o topo do índice fica na altura do começo do texto, logo abaixo do filete que fecha o cabeçalho (decisão do autor na T-129, no lugar da altura do primeiro h2), e o índice fica sticky ao rolar, a 3rem do topo da tela (o mesmo respiro do bloco de voto e compartilhar até a borda de baixo, §9.14), até 40 px acima do lugar onde o bloco de voto e compartilhar para no fim do texto (§9.14, T-130). Essas coisas saem do layout em CSS (grid, flex e sticky), sem JavaScript que meça e desloque a página (CLS, SPEC RNF-01).
- **Movimento:** a barra e a seção ativa mudam sem animar o layout. Com `prefers-reduced-motion`, sem rolagem suave.
- **Sem JavaScript:** os links de âncora funcionam, sem progresso e sem seção ativa.
- **Sem índice:** abaixo de `lg` e em post com menos de 2 h2.

**Apêndice e citações, abaixo do corpo (T-117, BRAND 1.43; substitui a faixa da T-66).** Logo depois do artigo, na coluna do texto e na largura da prosa (o mesmo grid do post: 15rem de lateral vazia e vão de 4rem de `lg` em diante), sem fundo `sheet` e sem filete de largura inteira: os apêndices do autor e as citações numeradas (SPEC RF-04). O bloco de voto e compartilhar continua parando no fim do corpo (§9.14). Cada seção abre com um rótulo em mono 12 px maiúsculo, grafite, nunca lápis (seção 4: lápis sobre folha clara dá 4,2), com a barra decorativa (`/ APÊNDICE A`, `/ CITAÇÕES`) e um filete de 1 px em tinta abaixo, como o `/ LISTAGEM` (§9.2). No apêndice, o título vem abaixo do rótulo em Plex Sans 600 de 20 px, em tinta, e o texto em Plex Sans 15 px com entrelinha 1,6. Nas citações, um sub-rótulo por tipo, em mono 12 px maiúsculo, grafite e sem filete (`MODELOS · 1`, `PAPERS · 2`), na ordem Modelos, Datasets, Papers, Textos, Cursos e Vídeos, só os grupos com itens. Cada citação traz o `[n]` em mono 12 px grafite, alinhado à borda esquerda do texto do post, numa coluna estreita (2,25rem), em todas as larguras; o título com link em `accent`, sublinhado, numa linha; e, abaixo, autores, ano e veículo em grafite, 15 px. Um tracejado de 1 px em `line` separa as citações e fecha a última. Só o título é link. A ficha de bancada saiu na T-62.

### 9.4 Avisos dentro do texto (decisão: forma, não cor)
Todos em tinta; nenhum usa as cores dos tipos.

| Aviso | Rótulo (mono maiúsculo) | Forma |
|---|---|---|
| **Nota de bancada** (dica) | `// NOTA DE BANCADA` | Borda 1 px tracejada em lápis. |
| **Cuidado** | `[!] CUIDADO` (o `!` dentro de um quadrado de 17 px com borda 2 px) | Borda 2 px sólida em tinta, fundo `--folha`. |
| **Resultado** | `= RESULTADO` | Filete de 2 px em cima e embaixo, sem laterais; valor medido em mono 19 px (`acurácia 61% → 87%`). |

No MDX, `Callout` com `variant` `note`, `caution` ou `result` (SPEC RF-22), importado no próprio `.mdx`; o `result` recebe o valor medido na prop `value`. As bordas não usam 1,5 px: o Chrome arredonda a largura de borda para pixel CSS inteiro, mesmo em tela de densidade 2 (T-47).

### 9.5 Bloco de código
- Shiki com os temas `src/styles/shiki/pk-claro.json` e `src/styles/shiki/pk-escuro.json` (alternar conforme `data-theme`).
- Cores da sintaxe: palavra-chave prússia, texto (string) verdete, número latão, função sanguínea, comentário em itálico. No tema claro o comentário é grafite `#5E5345`, não lápis. No tema escuro o comentário permanece `#869EB6`. Dentro do código, as cores são só sintaxe.
- Moldura: fundo `--folha`, borda `--linha`. Barra superior com o nome do arquivo em mono 12 px (ex.: `fol-001_embeddings.py`) e o botão **Copiar**, que vira **Copiado** por 1,5 s. O nome fica em grafite (lápis sobre folha clara é 4,2), na caixa original, alinhado ao começo do código. Sem nome, a barra fica só com o botão. A linha entre a barra e o código é a borda de cima do bloco (T-48).
- Opcional: linha de "saída" abaixo do código, no formato de cota (`saída ├────┤ [4, 384]`).

### 9.6 Botão do caderno
- Componente `Notebook`, chamado no texto do post onde o autor quiser, uma ou mais vezes.
- Faixa com filete em cima e embaixo: texto à esquerda e um botão à direita.
- Sem `gpu`: "Este caderno roda no navegador. Mude os parâmetros e anote o que acontecer." e o botão **Abrir no marimo** (fundo tinta, texto papel).
- Com `gpu`: "Este caderno roda num servidor com GPU. Para rodar, é preciso uma conta no molab; a GPU se escolhe no painel Compute." e o botão **Abrir com GPU** (borda tinta), que leva à prévia estática do molab (SPEC §7, Q19).
- Botões em mono 12,5 px, cantos retos.

### 9.7 Cadernos marimo
Primeira célula de todo caderno: cabeçalho renderizado com a assinatura e o título, sem fólio (T-120). Parâmetros como controles do marimo (`mo.ui.slider` etc.), não como constantes soltas. Sem `pk.css`: o molab não aplica o `css_file` do caderno (T-97), e o caderno fica com o estilo do molab; a marca entra pelo cabeçalho da primeira célula. Os dados ficam na pasta do caderno e se leem com `mo.notebook_dir()` (SPEC §7).

### 9.8 Diagramas

**Papéis de cor (decisão, 26/11/2026, T-76).** Valem para toda figura do blog, das primitivas de `src/components/viz/` às figuras de post em `figs/`, e não só para as figuras de prova.

| Papel | Cor | Token |
|---|---|---|
| Elementos: traço, seta, cota, rótulo, guia tracejada | tinta | `ink` |
| Superfície de célula e forma | folha | `sheet` |
| Destaque único (no máximo um por figura) | sanguínea | `highlight` |
| Intensidade (mapa de calor, qualquer escala sequencial) | sanguínea com transparência, cinco degraus: 0,2, 0,4, 0,6, 0,8 e 1 | `highlight` |
| Seleção numa figura de intensidade (a sanguínea já é o dado) | contorno em tinta, traço de 2 | `ink` |
| Grade milimetrada | tinta com transparência | `grid`, `grid-strong` |
| Controle interativo (controle deslizante, foco) | prússia, fora do `svg` da figura | `accent` |

A prússia nunca entra no `svg` de uma figura: ela é do que se clica (§4).

- Tinta para elementos; sanguínea para **um** destaque por diagrama; tracejado fino para guias.
- Rótulos em mono; no máximo duas notas em IBM Plex Sans itálico (T-52, LCP).
- Sempre uma cota com medida real.
- Fundo com grade milimetrada; sem sombra, sem gradiente, sem 3D.
- Funcionam nos dois modos (cores sempre por token).

**Vocabulário (decisão, 10/11/2026, T-72).** Medidas em unidades do `viewBox`; a figura sai no tamanho natural e só encolhe.

- Célula: quadrado de 24 com vão de 4, em folha (`sheet`), com traço de 1 em tinta. O destaque único é a célula em sanguínea (`highlight`), com o mesmo traço.
- Tensor: só a camada da frente tem células; as de trás são placas lisas, deslocadas (8, −8) a cada camada.
- Seta: haste de 1 em tinta e ponta aberta de dois traços de 8, a ±30°.
- Cota: linha de 1 em tinta, afastada 12 da forma, com marcas perpendiculares de 6 nas pontas; o valor em Plex Mono 12, a 8 além da linha.
- Grade: linhas de 1 a cada 8 em `grid` e reforço a cada 40 em `grid-strong`, num `<pattern>`; o reforço vai nas duas bordas do ladrilho, para não sair com metade da espessura.
- Rótulo: nunca abaixo de 10 px renderizados a 360 px.
- Legenda: "Figura N" no rótulo da seção 5 (Plex Mono 12, maiúsculas, 0,1em, tinta), seguido do texto em Plex Sans 16 px, grafite.
- "Ver dados": no mesmo rótulo, em grafite, com alvo de pelo menos 24 px de altura; tabela com o cabeçalho no rótulo e as células em Plex Sans 14 px, tinta, com linhas na cor `line`.
- Nota em itálico: fora das figuras do post B, que não pode ganhar a Plex Sans itálico (LCP). Um post novo com nota mede antes.

**Exploráveis (decisão, 10/11/2026, T-20).**

- Mapa de calor: células como no vocabulário acima, mas em sanguínea com transparência por degrau (0,2, 0,4, 0,6, 0,8 e 1, do menor ao maior valor da matriz; 1,4 a 6,3 de contraste sobre o papel no claro e 1,4 a 6,6 no escuro), com o traço de 1 em tinta. O destaque único é o contorno da linha escolhida, em tinta, com traço de 2, por fora das células, sobre o papel (15,0 no claro e 13,8 no escuro; T-76). Sem número dentro das células: os degraus entre si não chegam a 3:1, por isso os valores vão também em texto, no "Ver dados" e no texto ao vivo.
- Rótulos do mapa: os nomes em Plex Mono 12, tinta, à esquerda das linhas e acima das colunas, estes girados −90°; a cota `[linhas, colunas]` embaixo.
- Controles: abaixo do desenho. Botão em Plex Mono 12, tinta, com borda de 1 em tinta, cantos retos e pelo menos 32 px de altura; desabilitado, com 60% de opacidade. Controle deslizante na cor prússia, com pelo menos 24 px de altura e o rótulo visível. Texto ao vivo em Plex Mono 12, grafite.
- Movimento: a troca de cor da célula tem transição curta, desligada com `prefers-reduced-motion`; o contorno do mapa muda de linha sem transição.

### 9.9 Botão de tema
Decisão da T-109; entra na T-24. Um controle segmentado com dois botões de ícone, em 12 px: o sol (`icone-sol.svg`), tema claro, e a lua (`icone-lua.svg`), tema escuro. Cada botão tem 36 × 32 px; o grupo tem borda `line`, filete `line` entre os dois e cantos de 0,375rem. O botão ativo tem fundo tinta e ícone papel, com `aria-pressed="true"`; o outro, ícone grafite. Os nomes para o leitor de tela são **Claro** e **Escuro** (`aria-label`), e o grupo se chama Tema. Fica no header, à direita (§9.13). Grava a escolha (localStorage) e aplica `data-theme` na raiz.

### 9.10 Foco e interação
Foco visível: contorno 2 px prússia com afastamento 3 px. Links em prússia, sublinhado de 1 px com afastamento 3 px.

### 9.11 Link com cara de botão (página 404)
O "Voltar ao início" da página 404 parece um botão, mas continua um link (`<a>`) para `/`. Fundo tinta, texto papel, IBM Plex Mono 400 em 14 px, 44 px de altura, 20 px de respiro nas laterais. Cantos retos e sem sombra, como os botões da seção 9.6. Sem sublinhado em repouso; no hover e no foco, sublinhado com afastamento de 3 px, sem troca de cor. O foco é o da seção 9.10. No tema escuro, os mesmos tokens invertem o par: fundo claro, texto escuro.

**Variante com contorno (T-126, Q23; no ar desde a T-125).** O `Assinar via RSS` da saudação (§9.1) é a mesma forma sem fundo: borda de 1 px em tinta, texto em tinta, IBM Plex Mono 400 em 14 px, 44 px de altura e cantos de 0,375rem, com o ícone de RSS (`icone-rss.svg`, 12 px, `aria-hidden`) antes do texto. Os cantos arredondados são só desta variante; o botão da 404 continua reto (T-125). Continua um link (`<a>`), com o mesmo hover e o mesmo foco.

### 9.12 Busca e filtro
Decisão da T-119. O filtro está no ar (T-124). A busca está no ar (T-22). A barra "Filtrar por tipo" (T-63, T-64) saiu na T-123.

**Filtro.** Nas quatro listas (`/blog/`, `/artigos/`, `/prototipos/`, `/mais-votados/`), abaixo do h1 e acima da contagem. Não entra na home nem em `/tags/`.

- `select` nativo, uma tag por vez, com a seta do sistema. Rótulo visível `Filtrar por`. 44 px de altura, IBM Plex Mono 16 px (abaixo de 16 px, o Safari do iPhone dá zoom no toque), fundo `surface`, borda `line`, cantos de 0,375rem. Sem ícone.
- A primeira opção é `Todas as tags` e tira `?tag=` da URL. As outras são as tags dos posts daquela lista. A escolha vai para `?tag=<slug>`, sem tirar o `?ordem=` da ordenação (§9.2, T-133).
- Em `/mais-votados/`, o HTML traz as tags de todos os posts publicados, com o select desabilitado. Quando o ranking chega, saem as opções cujas tags não têm post votado, e só então o select habilita. Sem voto nenhum ou com a API falhando, o select continua desabilitado.
- No HTML do build, o select sai `disabled`, já com as opções, e o script o habilita sem mudar a altura (sem CLS).
- **Contagem:** mono 12 px, maiúsculas, lápis, com `aria-live="polite"`. `5 artigos` e `2 de 5 artigos` em `/artigos/`; `protótipo` e `protótipos` em `/prototipos/`; `post` e `posts` em `/blog/` e em `/mais-votados/`.
- **Sem resultado:** `Nenhum post com essa tag.` não acontece, porque as opções são sempre tags da lista.
- **Sem JavaScript:** o select fica desabilitado, a lista vem inteira e a página aponta os links de `/tags/`. Em `/mais-votados/`, sem JavaScript, só o aviso: o ranking não está no HTML.

**Busca.** Sai das listas. O botão fica no header (§9.13): lupa (`icone-busca.svg`, 12 px), alvo de 44 px, nome acessível `Buscar ⌘K` (no Windows e no Linux, `Buscar Ctrl K`). Sem JavaScript, o lugar fica reservado e invisível.

- O modal é um diálogo. O campo é `input type="search"`, 44 px, IBM Plex Mono 16 px, borda `line`, cantos de 0,375rem, fundo `surface`, placeholder `Buscar`, em grafite. Cada resultado traz título e trecho, em Plex Sans 16 px, grafite, sem data. O título é 600. O termo, no título e no trecho, é 600 e sublinhado, sem fundo. O cartão tem borda `line`, fundo transparente e cantos de 0,375rem.
- Abre pelo botão ou por Cmd/Ctrl+K, em todas as páginas. O índice cobre só o corpo dos posts (SPEC RF-15).
- O Pagefind 1.6.0 não pediu `unsafe-inline` em `style-src-elem`. O modelo do resultado é `text/pagefind-template` e só entra no DOM ao abrir. Esta seção não desenha um modal paralelo ao do Pagefind.

### 9.13 Header e footer
Decisão da T-119. O header e o footer estão no ar (T-113). O link "Comece aqui" está no ar (T-114). O botão de busca está no ar (T-22) e o controle de tema entra na T-24.

- **Header:** fundo `surface`, filete `line` embaixo, na largura do site (72rem), com 0,75rem de respiro em cima e embaixo. A assinatura (§3) fica à esquerda. Depois, nesta ordem: `Comece aqui` (`/comece-aqui/`), `Artigos`, `Protótipos`, o botão de busca (§9.12) e o controle de tema (§9.9). `Artigos` e `Protótipos` não levam ícone. Cada link em IBM Plex Mono 12 px, maiúsculas, letter-spacing .12em, grafite, indo para prússia no hover e no foco, com 44 px de toque e 1,25rem entre eles; o da página atual vai para tinta, com sublinhado de 2 px e `aria-current="page"`. `Protótipos` só aparece quando há protótipo publicado: sem ele, a página não existe.
- **De `md` em diante:** uma linha só, com a assinatura à esquerda e o resto à direita.
- **Abaixo de `md`:** duas linhas, sem menu e sem JavaScript. Na de cima, a assinatura, o botão de busca e o controle de tema; na de baixo, depois de um filete `line`, os links, rolando na horizontal se não couberem.
- **Footer:** filete `line` em cima, na largura do site, com 1,5rem de respiro. Numa linha, `Pedro Knoll · 2026`, em mono 12 px, maiúsculas, grafite, à esquerda, e `RSS`, `GitHub` e `LinkedIn` à direita, no estilo dos links do header. Abaixo de `sm`, as duas partes se empilham.

### 9.14 Fim do post
Decisão da T-126 (Q23), que substitui a da T-119 no voto e no compartilhar. O bloco de voto e compartilhar está no ar (T-130, que absorveu a T-115); os relacionados estão no ar (T-26), e a newsletter entra na T-116. O apêndice e as citações saíram da faixa e ficam abaixo do corpo, na coluna do texto (§9.3, T-117).

- **Ordem na coluna do texto:** abaixo de `lg`, o bloco de voto e compartilhar, o apêndice e as citações (§9.3, só quando o post tem citações ou apêndices), os posts relacionados, a newsletter e o footer. De `lg` em diante, o bloco sai do fim do texto e vai para a lateral.
- **Bloco de voto e compartilhar, de `lg` em diante:** mínimo, o último elemento da lateral, abaixo do índice (§9.3), sticky na borda de baixo da tela durante a leitura, com 3rem de respiro entre o último link e a borda, e o fundo `surface` indo até ela. Começa escondido e aparece quando o filete que fecha o cabeçalho do post sai da tela, ou quando o fim do texto entra nela (num post curto, o filete pode nunca sair), pelo `IntersectionObserver`: entra com fade e um deslize curto de baixo para cima, de 8 px em 0,25 s, só `opacity` e `transform`. Quando o leitor volta ao topo, some do mesmo jeito. Escondido, não recebe foco do teclado. Com `prefers-reduced-motion`, aparece e some sem animação (decisões do autor na T-130).
- **Chegando ao rodapé:** quando o fim do texto entra na tela, o bloco para no fim da coluna e sobe com a página. O índice só fica preso até 40 px acima do lugar onde o bloco para; a partir daí, também sobe, e os dois sobem juntos, com 40 px entre eles, sem se sobrepor, só pelo layout em CSS (grid, flex e sticky), sem JavaScript que meça. Em tela baixa, em que o índice e o bloco quase se encontram durante a leitura, o fundo `surface` do bloco cobre a ponta do índice, em vez de os textos se sobreporem.
- **Forma do bloco:** um fio em `line` em cima e fundo `surface`, sem os rótulos `/ GOSTOU?` e `/ COMPARTILHAR`. Na primeira linha, o botão de voto. Abaixo, 1,25rem depois do botão, `Compartilhar` em IBM Plex Mono 12 px, caixa normal, grafite, e, numa linha, `X.com`, `LinkedIn`, `E-mail` e `Copiar link`, em IBM Plex Sans 14 px, caixa normal, tinta, indo para prússia no hover e no foco, com 0,75rem entre eles; na lateral de 15rem, os quatro cabem (decisão do autor na T-130, pelo mockup). Sem "copiar markdown".
- **Voto:** a pílula de 36 px da T-122: borda `line`, fundo `surface`, cantos de 0,5rem, o triângulo para cima (`icone-voto.svg`), o texto `Votar` em IBM Plex Sans 600 e a contagem em IBM Plex Mono, os dois em tinta (`▲ Votar 12`; T-130, pelo mockup). O 600 já vem nos posts com índice (§9.3); no post sem índice, entra com o botão, dentro do teto de post do `font-budget.spec.ts`. A contagem fica no vão de 3 caracteres, dentro do botão, e troca de `–` para o número sem mudar a posição. Depois do clique, `Votado 12`, desabilitado, sem desfazer (SPEC RF-25). Sem JavaScript, `O voto precisa de JavaScript.` no lugar do botão, na mesma altura.
- **Compartilhar:** `X.com`, `LinkedIn` e `E-mail` são links com o título e a URL do post (o e-mail por `mailto:`), sem script de terceiro. `Copiar link` é um botão do próprio site, criado pelo script: sem JavaScript, ele não aparece. Ao copiar, vira `Copiado` por 1,5 s, com o `aria-label` `Link copiado` (na tela, `Link copiado` quebraria a linha dos links; T-130), como o botão do código (§9.5).
- **Abaixo de `lg`:** o mesmo bloco no fim da coluna do texto, 2,5rem abaixo do último parágrafo, sem sticky e sem animação.
- **Sem JavaScript:** o bloco aparece parado, sem animação, com o aviso do voto e os três links. De `lg` em diante, fica logo abaixo do índice, e os dois ficam presos juntos no topo, como antes da T-130: preso na borda de baixo desde o carregamento, o bloco cobriria o índice numa tela de 800 px de altura.
- **Posts relacionados:** na coluna do texto, o rótulo `/ POSTS RELACIONADOS`, em mono 12 px maiúsculo, tinta, sobre um filete de 1 px em tinta, com 8 px entre o texto e o filete, e até 2 itens da lista (§9.2; 3 até a T-26, decisão do autor).
- **Newsletter:** na coluna do texto, depois dos relacionados, e na home, depois das faixas (§9.2). Um bloco com fundo `sheet` e cantos de 0,375rem; o título `Receba os próximos posts por e-mail.` na fonte de display 600; o campo de e-mail no tamanho do campo da busca (§9.12); o botão `Receber`, com fundo tinta, texto papel, IBM Plex Mono e cantos de 0,375rem. A forma final do campo depende do formulário do Kit (T-116).

### 9.15 Comece aqui
Decisão da T-114. Está no ar. O item de post é o de Recentes desde a T-131 (Q23).

- **h1** `Comece aqui`, fixo, na escala do h1 das listas (§9.2), sem ícone. É o rótulo do header.
- **Prosa** na coluna de texto do post (§5): parágrafos, seções `##` e links. O texto mora em `src/content/comece-aqui.mdx`. Editar a página é mudar esse arquivo: dá para acrescentar, tirar e reordenar seções, e pôr uma lista em qualquer uma.
- **Item de post:** o item de `/ RECENTES` (§9.2), com data, `NOVO`, título e tempo de leitura, sem votos e sem descrição. O título é h3.
- **Item externo:** a mesma grade e o mesmo hover. No lugar da data, o nome da fonte, em mono 12 px, lápis; sem fonte informada, o domínio sem `www.`. O título no mesmo estilo do item. No lugar do tempo de leitura, `↗` em lápis, decorativo (`aria-hidden`). O nome acessível do link é o título mais "(site externo)". O link abre na mesma aba.
- A lista some se nenhum item sobrar. Um slug que não está nos posts publicados sai da lista, sem quebrar o build. Link externo que não é `https:` quebra o build.
- Sem foto e sem link para o GitHub.

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
| Saudação | Olá, eu sou o Pedro. · foto: Foto de Pedro Knoll · RSS: Assinar via RSS |
| Newsletter | Receba os próximos posts por e-mail. · botão: Receber |
| Página 404 | Esta página foi arrancada do caderno. · texto: O endereço pode ter mudado, ou esta página ainda não foi escrita. O resto do caderno continua aqui. · link: Voltar ao início · notas da ilustração: estava aqui · nó não encontrado |
| Botão de código | Copiar → Copiado |
| Botão de tema | ícones de sol e lua · nomes acessíveis: Claro · Escuro |
| Busca | Buscar ⌘K · no Windows e no Linux, Buscar Ctrl K |
| Filtro | Filtrar por · primeira opção: Todas as tags |
| Contagem | 5 artigos · 2 de 5 artigos |
| Lista sem resultado | Nenhum post com essa tag. |
| Ranking sem JavaScript | O ranking precisa de JavaScript. |
| Ranking vazio | Nenhum voto ainda. |
| Voto | Votar → Votado · ▲ 12 votos · 1 voto · O voto precisa de JavaScript. |
| Fim do post | Compartilhar · Copiar link → Copiado (nome acessível: Link copiado) · / Posts relacionados |
| Índice do post | / Neste artigo · 42% · 6 minutos de leitura |
| Tempo no item | 11 minutos · 1 minuto (para leitor de tela e no `title`: 11 minutos de leitura) |
| Post recente | NOVO |
| Links da home | Todos os 12 posts → · Todos os 3 protótipos → · Ver ranking → · com 1: O único post → · O único protótipo → |
| Botão do caderno | Abrir no marimo · Abrir com GPU |

---

## 11. Aplicações

| Peça | Fundo | Regras |
|---|---|---|
| **Site** | velino (claro) / cianotipia (escuro) | Acompanha o tema do leitor. |
| **Thumbnail YouTube** 16:9 | cianotipia fixa + grade | Tipo (ícone e nome) em tinta no topo, símbolo com nó em prússia, título grande na fonte de display, IBM Plex Sans Condensed 600, mini-diagrama, rodapé `pk.log · pedroknoll.com` em mono. Sem fólio e sem cor de tipo. |
| **Imagem de link (OG)** 1200×630 | velino + grade | Decisão da T-119, gerada no build pela T-23, só para post sem capa. Margem de 72 px. No alto, o tipo (ícone e nome, `ARTIGO` ou `PROTÓTIPO`) em mono 22 px, tinta, sobre um filete de 2 px em tinta. O título na fonte de display 600, 72 px, até 3 linhas, quebradas pelo gerador entre palavras, com reticências no fim da 3ª se passar. Sem fólio, tema e nível. No pé, um filete `line`, a assinatura à esquerda e `pedroknoll.com` à direita, em mono 22 px, grafite. Só as faces da marca, sem itálico. |
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
  --grade: rgba(42, 33, 24, .03);
  --grade-forte: rgba(42, 33, 24, .065);

  --f-display: "IBM Plex Sans Condensed", "Arial Narrow", Arial, sans-serif;
  --f-texto: "IBM Plex Sans", "Helvetica Neue", Arial, sans-serif;
  --f-mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
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
  --grade: rgba(232, 238, 243, .025);
  --grade-forte: rgba(232, 238, 243, .055);
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
  --color-highlight: var(--sanguinea);

  --font-display: var(--f-display);
  --font-sans: var(--f-texto);
  --font-mono: var(--f-mono);
}
```

Gera classes como `bg-papel`, `text-tinta`, `border-linha`, `text-prussia`, `font-display`, `font-mono`. Como as cores apontam para variáveis, a troca de tema acontece só no CSS, sem `dark:` em cada componente.

Se o projeto estiver no Tailwind v3, os mesmos nomes vão em `theme.extend.colors` do `tailwind.config`, com valores `var(--papel)` etc.

---

## 14. Sugestão de tarefas para o roadmap

Sugestão já absorvida pela Fase 1b do ROADMAP. Onde esta seção discordar da SPEC ou do ROADMAP, valem a SPEC e o ROADMAP. Não use esta lista como ordem de tarefas.

Ordem que estava sugerida antes desse encaixe:

1. **Tokens e tema:** variáveis da seção 13, mapeamento dos tokens existentes, botão Claro/Escuro com `data-theme` e persistência.
2. **Fontes:** carregar as três famílias (de preferência auto-hospedadas).
3. **Marca no layout:** assinatura no cabeçalho, favicon (seção 12), `<title>` no padrão da seção 1, rodapé com assinatura espelhada opcional.
4. **Home:** saudação com aceno animado, texto de apresentação, newsletter, lista de fólios.
5. **Schema de conteúdo:** campos de fólio, tipo, nível e temas.
6. **Card e cabeçalho de fólio:** com ícones parados nas listas e no cabeçalho, hachura de nível.
7. **Avisos em MDX:** componente com os três tipos da seção 9.4.
8. **Código:** temas Shiki próprios + barra com nome do arquivo e Copiar/Copiado.
9. **OG image** por fólio.
10. **Página 404** com o microtexto da marca.
11. **Revisão de acessibilidade:** contraste (seção 4), foco visível, `prefers-reduced-motion` em todas as animações.

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

### Ícones (T-119) · `src/assets/brand/icones/`

Só parados, sem versão animada (§7). A folha, o frasco, a lupa e o RSS estão em `src/assets/brand/icones/` (T-120, T-22, T-125). O sol e a lua entram na T-24, o fogo e o voto na T-123. O filtro não entra.

`icone-artigo.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges">
  <path d="M1 0h7v1h-7zM1 1h1v1h-1zM7 1h2v1h-2zM1 2h1v1h-1zM7 2h1v1h-1zM9 2h1v1h-1zM1 3h1v1h-1zM7 3h4v1h-4zM1 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM3 5h5v1h-5zM10 5h1v1h-1zM1 6h1v1h-1zM10 6h1v1h-1zM1 7h1v1h-1zM3 7h6v1h-6zM10 7h1v1h-1zM1 8h1v1h-1zM10 8h1v1h-1zM1 9h1v1h-1zM3 9h4v1h-4zM10 9h1v1h-1zM1 10h1v1h-1zM10 10h1v1h-1zM1 11h10v1h-10z"/>
</svg>
```

`icone-prototipo.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges">
  <path d="M3 0h6v1h-6zM4 1h1v1h-1zM7 1h1v1h-1zM4 2h1v1h-1zM7 2h1v1h-1zM4 3h1v1h-1zM7 3h1v1h-1zM3 4h1v1h-1zM8 4h1v1h-1zM3 5h1v1h-1zM8 5h1v1h-1zM2 6h1v1h-1zM9 6h1v1h-1zM2 7h8v1h-8zM1 8h10v1h-10zM1 9h10v1h-10zM0 10h12v1h-12zM0 11h12v1h-12z"/>
</svg>
```

`icone-busca.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges">
  <path d="M2 0h4v1h-4zM1 1h1v1h-1zM6 1h1v1h-1zM0 2h1v1h-1zM7 2h1v1h-1zM0 3h1v1h-1zM7 3h1v1h-1zM0 4h1v1h-1zM7 4h1v1h-1zM0 5h1v1h-1zM7 5h1v1h-1zM1 6h1v1h-1zM6 6h2v1h-2zM2 7h4v1h-4zM7 7h2v1h-2zM8 8h2v1h-2zM9 9h2v1h-2zM10 10h2v1h-2zM11 11h1v1h-1z"/>
</svg>
```

`icone-rss.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges">
  <path d="M1 1h2v1h-2zM3 2h2v1h-2zM5 3h1v1h-1zM1 4h2v1h-2zM6 4h1v1h-1zM3 5h1v1h-1zM7 5h1v1h-1zM4 6h1v1h-1zM8 6h1v1h-1zM5 7h1v1h-1zM8 7h1v1h-1zM5 8h1v1h-1zM9 8h1v1h-1zM1 9h2v1h-2zM6 9h1v1h-1zM9 9h1v1h-1zM1 10h2v1h-2zM6 10h1v1h-1zM9 10h1v1h-1z"/>
</svg>
```

`icone-sol.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges">
  <path d="M5 0h2v1h-2zM1 1h1v1h-1zM5 1h2v1h-2zM10 1h1v1h-1zM2 2h1v1h-1zM9 2h1v1h-1zM4 3h4v1h-4zM3 4h6v1h-6zM0 5h2v1h-2zM3 5h6v1h-6zM10 5h2v1h-2zM0 6h2v1h-2zM3 6h6v1h-6zM10 6h2v1h-2zM3 7h6v1h-6zM4 8h4v1h-4zM2 9h1v1h-1zM9 9h1v1h-1zM1 10h1v1h-1zM5 10h2v1h-2zM10 10h1v1h-1zM5 11h2v1h-2z"/>
</svg>
```

`icone-lua.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges">
  <path d="M4 0h4v1h-4zM2 1h4v1h-4zM1 2h3v1h-3zM1 3h2v1h-2zM0 4h3v1h-3zM0 5h3v1h-3zM0 6h3v1h-3zM10 6h2v1h-2zM0 7h4v1h-4zM9 7h2v1h-2zM1 8h4v1h-4zM7 8h4v1h-4zM1 9h9v1h-9zM2 10h7v1h-7zM4 11h4v1h-4z"/>
</svg>
```

`icone-fogo.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges">
  <path d="M6 0h1v1h-1zM5 1h2v1h-2zM4 2h1v1h-1zM6 2h2v1h-2zM3 3h1v1h-1zM5 3h3v1h-3zM2 4h1v1h-1zM4 4h4v1h-4zM2 5h6v1h-6zM1 6h7v1h-7zM1 7h8v1h-8zM2 8h7v1h-7zM3 9h5v1h-5zM4 10h3v1h-3z"/>
</svg>
```

`icone-voto.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 8" width="10" height="8" fill="currentColor">
  <path d="M5 0 10 8H0Z"/>
</svg>
```
