# pk.log · Especificação da marca

Versão 1.28 · novembro de 2026 · pedroknoll.com

Este arquivo é a fonte da verdade da identidade visual e verbal do pk.log. Ele foi escrito para pessoas e para agentes de código. O manual visual interativo existe como artefato à parte; quando os dois divergirem, vale este arquivo. Quando o comportamento discordar da SPEC, vale a SPEC.

## 0. Como usar este arquivo

- **Decisão** é regra fechada. Siga como está.
- **Sugestão** é um ponto de partida. Ajuste ao código, ao schema e à SPEC.
- Este arquivo é a identidade. Em conflito de comportamento com a SPEC, vale a SPEC; avise no PR.
- A seção 14 é sugestão. A ordem das tarefas está na Fase 1b do ROADMAP. Onde a seção 14 discordar da SPEC ou do ROADMAP, valem a SPEC e o ROADMAP.
- Não crie nomes paralelos `--papel` / `--prussia` no CSS de componente, página ou layout. A T-41 grava a lista fechada: `surface`, `sheet`, `ink`, `muted`, `pencil`, `line`, `accent`, `kind-concept`, `kind-tutorial`, `kind-playbook`; a T-72 acrescenta `grid` e `grid-strong`, da grade milimetrada. Sem `@custom-variant dark` e sem `dark:` nos componentes.
- A stack é Astro 7 + Tailwind v4. A seção 13 é sugestão de tokens; confirme a SPEC §9 antes de aplicá-la.
- SVGs, favicons e temas do Shiki estão na árvore abaixo, com os nomes originais. O apêndice repete o código dos SVGs principais e usa esses caminhos.

```text
specs/BRAND.md
src/assets/brand/pklog-simbolo{,-escuro,-currentcolor,-construcao,-pixel,-404}.svg
src/assets/brand/icones/aceno.svg
src/assets/brand/icones/icone-{conceito,tutorial,playbook}.svg
src/assets/brand/icones/icone-{conceito,tutorial,playbook}-parado.svg
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

**Significado.** "pk" são as iniciais de Pedro Knoll. "log" é ao mesmo tempo o log de treino de um modelo, o diário de bordo dos aviadores e o blog. Na assinatura, "pk" vem na fonte de display, IBM Plex Sans Condensed 600 (até a T-60, era a serifa Cormorant), e "log" em mono. O pk não usa itálico: o itálico pedia outro arquivo e entrava no LCP (T-52). O ponto é sempre azul-da-prússia e é o mesmo nó central do símbolo.

**Vocabulário editorial.**
- Cada post é um **fólio**, numerado em ordem de publicação com três dígitos: `Fól. 042`. O número nunca é reaproveitado.
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
| `--lapis` | `#7B6F5A` | `#869EB6` | Fólio e metadados. Não é texto menor que 24 px sobre folha clara. Comentário de código não usa lápis. |
| `--linha` | `rgba(60,40,20,.16)` | `rgba(232,238,243,.18)` | Bordas e divisórias. |
| `--prussia` | `#1F4B7A` | `#8DB8E8` | **Cor principal.** Links, foco, nó do símbolo, ponto do nome, tipo Conceito. |
| `--latao` | `#84601A` | `#D9B85C` | Tipo **Tutorial**. |
| `--sanguinea` | `#A3392A` | `#EE8A74` | Função no código (Shiki, §9.5). |
| `--verdete` | `#2E6B5A` | `#7CC7AE` | Tipo **Playbook**. |
| `--ouro` | `#F5B82E` | `#F5B82E` | **Exceção:** só a mão da saudação. |
| `--contorno-px` | `#2A2118` | `#2A2118` | Contorno da mão em pixel, nos dois modos. |
| `--grade` / `--grade-forte` | `rgba(31,75,122,.03)` / `.065` | `rgba(200,225,255,.025)` / `.055` | Grade milimetrada. No CSS, `grid` e `grid-strong` (T-72). |
| `--grade-px` | `rgba(42,33,24,.07)` | `rgba(232,238,243,.07)` | Grade de exibição dos ícones em pixel (só em documentação). |

### Regras de cor (decisões)
- **Proporção em qualquer peça:** papel ~68%, tinta ~20%, prússia ~7%, latão + sanguínea + verdete ≤ 5% somados.
- **Latão e verdete marcam só o tipo de conteúdo; a sanguínea fica só na função do código (§9.5).** Nunca marcam avisos, erros, sucesso ou resultados, e nunca são fundo de página. Os tipos Artigo e Protótipo ficam em tinta (§8, T-109): com a T-110, o latão e o verdete deixam de marcar tipo e ficam só no código (§9.5).
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

Lápis sobre folha clara (4,2) fica abaixo de 4,5. Lápis não é texto menor que 24 px sobre folha clara; nesse tamanho, use grafite. Comentário de código não usa lápis. No tema claro do Shiki o comentário é `#5E5345`. O tema escuro não muda o comentário nesta revisão (`#869EB6`).

---

## 5. Tipografia

As três famílias entram pela Fonts API do Astro (`fontProviders.fontsource()`), subset `latin`, `woff2`. Sem `fontProviders.google()` e sem pacote `@fontsource/*` instalado à mão.

| Papel | Fonte | Pesos | Regras |
|---|---|---|---|
| Títulos | **IBM Plex Sans Condensed** | 600 | Só 600 normal, sem itálico declarado, até uma tarefa medir outra face (T-52, T-60, LCP). |
| Texto | **IBM Plex Sans** | 400, 400 itálico, 600 | 18 px, altura de linha 1,65, coluna de ~65 caracteres. |
| Código, rótulos, fólio, cotas | **IBM Plex Mono** | 400 | Rótulos em maiúsculas com letter-spacing .08–.14em. Só o peso 400 (T-52, LCP). |

**Regras da display (decisão, 05/11/2026, T-60).**

- IBM Plex Sans Condensed só no peso 600 normal. Um trecho em itálico num título (`## Um *exemplo*`) usa o itálico que o navegador sintetiza, sem arquivo a mais.
- Sem tamanho mínimo próprio. A regra dos 28 px e as exceções de 22 px (título do card, número do fólio, assinatura) existiam porque a Cormorant ficava frágil em tamanho pequeno, e saíram com ela. Os tamanhos de hoje ficam; a escala nova é das T-64 e T-65.
- O h3 a 22 px continua IBM Plex Sans 600.

**Escala (px):** display 64 · h1 44 · h2 30 · h3 22 (Plex Sans 600) · texto 18 · rótulo 12. O h1 de página (post, tag e 404) fica em 36 px abaixo de `sm` (640 px) e em 44 px de `sm` em diante; a saudação da home tem tamanho próprio (§9.1). O rótulo usa letter-spacing de 0,1em (T-51).
Títulos com `text-wrap: balance`.

**Fonte de display (decisão, 04/11/2026, T-63).** A IBM Plex Sans Condensed 600 substitui a Cormorant Garamond em tudo que usa o token de display: assinatura, saudação, card, h1 de página, h2 da prosa e 404. É da mesma superfamília do texto e dos rótulos. O arquivo latin tem 19.816 bytes, contra 23.396 da Cormorant: a home e a tag caem de 60.692 para 57.112 bytes, sem mudar o teto de 61.000. A troca entrou na T-60, com o arquivo de 19.816 bytes medido no build.

**Escala do post (decisão, T-63; revista na T-67).** O h1 do post fica em 36 px abaixo de `sm`, 44 px de `sm` em diante e 80 px de `lg` em diante, com entrelinha 1,02 no `lg`, sem mudar o espaçamento das letras; a linha fina, em 18 px e 20 px de `lg` em diante. No topo do post, 56 px de respiro em todas as larguras. O texto do post fica em 18 px; o h2, em 30 px, e o h3, em 22 px. Os 80 px passam do display de 64 px e valem só para o h1 do post (seção 9.3, T-65 e T-67).

---

## 6. Elementos gráficos

| Elemento | Regra |
|---|---|
| **Grade milimetrada** | Linhas de 1 px a cada 8 px, reforço a cada 40 px, cores `--grade`/`--grade-forte`. **Só em capas, diagramas e peças gráficas. Nunca atrás de texto corrido.** |
| **Linhas de construção** | Tracejado fino em prússia, passando além da forma, como num esboço. Em diagramas e no símbolo grande. |
| **Cotas** | Linha de medida do desenho técnico (traço com marcas nas pontas e valor em mono). Mostram formato de tensor `[batch, 512, 768]`, tempo, tamanho de modelo. Todo diagrama tem pelo menos uma. |
| **Nota à margem** | IBM Plex Sans itálico, em prússia, com um traço ou seta curva, levemente inclinada (−1,5°). Uma por seção. A T-52 trocou a Caveat por esta face por causa do LCP. |
| **Hachura de nível** | Traços inclinados para a direita (`\`), como hachurava Leonardo, que era canhoto: sempre três traços, com 1, 2 ou 3 marcados da esquerda para os três níveis. Os marcados ficam em tinta; os outros, na cor de `--linha` (T-46). |
| **Fólio** | `Fól. 042 · 21.out.2026`, em mono, cor lápis. No card, o número na fonte de display 600 e tinta (seção 9.2). |

---

## 7. Ícones em pixel

- **Grade 12 × 12, uma cor (`currentColor`), cantos retos, sem suavização** (`shape-rendering: crispEdges`).
- Use em **12, 24, 36 ou 48 px** (múltiplos de 12) para não borrar.
- **Exceção:** a mão da saudação (`aceno.svg`) é **16 × 16**, com contorno `--contorno-px` e corpo `--ouro`. Use em 16, 32 ou 48 px.
- **Animação quadro a quadro** (decisão):
  - Conceito: o ponteiro do compasso gira em 4 posições (3,2 s).
  - Tutorial: o cursor `_` pisca (1,1 s).
  - Playbook: a lista se marca item por item e recomeça (4 s).
  - Aceno: dois quadros alternando 4 vezes, depois pausa (3,2 s, contínuo).
- **Onde anima:** só a mão da saudação. Os ícones animados dos tipos de hoje não aparecem no site desde a T-67 e saem na T-110. **Parado** (`icone-*-parado.svg`) em listas, etiquetas, cards de índice e no cabeçalho do fólio, onde fica em 12 px, no tamanho da grade (T-67).
- **Ícones novos (decisão da T-109):** `icone-artigo.svg` (folha) e `icone-prototipo.svg` (frasco), dos tipos (§8); `icone-busca.svg` (lupa) e `icone-filtro.svg`, das listas (§9.12); `icone-sol.svg` e `icone-lua.svg`, do controle de tema (§9.9). Todos com 12 × 12, uma cor, só parados, sem versão animada. O desenho está no apêndice, e cada um entra com a tarefa que o usa.
- **Relógio** (`icone-relogio.svg`): 12 × 12, só parado, sem versão animada. Entra no rodapé do card, antes do tempo de leitura (seção 9.2).
- Todas as animações respeitam `prefers-reduced-motion: reduce` (ficam paradas).
- Os SVGs animados têm classes com prefixo (`pkc-`, `pkt-`, `pkp-`, `pka-`), então podem ser inseridos inline juntos sem conflito.

---

## 8. Sistema de conteúdo

**Decisão de 18/11/2026 (SPEC, Q20 e Q21):** o tipo passa a Artigo e Protótipo, e o tema vira um campo obrigatório, um por post, sem lista prévia. Os tipos abaixo são os da T-109 e entram na T-110; até lá, o site tem Conceito (prússia, compasso), Tutorial (latão, `>_`) e Playbook (verdete, checklist). Os temas e o bloco de frontmatter abaixo valem até a T-110.

Três eixos independentes: **tipo** (formato), **nível** (dificuldade) e **tema** (assunto). Nenhum tem cor: o tipo se distingue pelo ícone (T-109).

### Tipos (decisão)

| Tipo | Cor | Ícone | O que é |
|---|---|---|---|
| **Artigo** | tinta | folha (`icone-artigo.svg`) | Explica uma ideia ou conta um aprendizado, do problema ao resultado. |
| **Protótipo** | tinta | frasco (`icone-prototipo.svg`) | Mostra algo construído e funcionando: o que faz, como foi feito e onde quebra. |

Os tipos não têm estrutura nem layout próprios (SPEC Q20). O tipo aparece no h1 das listas (ícone de 24 px) e nos rótulos das seções da página de tema (§9.2), no header (§9.13), na lateral do post (linha Tipo, ícone de 12 px), no rótulo do topo do texto (`/ ARTIGO` ou `/ PROTÓTIPO`, §9.3) e na imagem OG (§11). O card não mostra o tipo.

Qualquer tipo pode ter cadernos marimo (§9.6).

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
tipo: tutorial            # conceito | tutorial | playbook
nivel: 3                  # 1 iniciante | 2 intermediário | 3 avançado
temas: [LLMs, Fine-tuning, PyTorch]
```

A SPEC §6 fecha o schema. Chaves em inglês (`kind`, `level`, `tags`, `references`, `appendices`); `kind` no enum inglês; temas da marca são rótulo em `src/data/tags.ts`, não um campo; o tempo do post é só o `minutesRead`; o caderno não tem campo no frontmatter: o componente `Notebook` aponta o arquivo no MDX (SPEC §7). Este bloco é a sugestão anterior a essa decisão; caderno, tempo de bancada e material saíram na T-62.

---

## 9. Componentes

### 9.1 Saudação (home)
- `<h1>` na fonte de display 600, `clamp(2.4rem, 4.4vw, 3.5rem)` abaixo de `lg` (no máximo 56 px, abaixo do display de 64 px da seção 5; T-44) e 36 px de `lg` em diante (T-69). A mão (`aceno.svg`) fica fora do `h1`, sozinha numa linha acima dele, decorativa (`aria-hidden`): 48 px, e 32 px abaixo de 560 px, com 1rem até o título (T-69).
- O nome dentro da saudação usa a mesma marcação da assinatura (`<em>pk</em><span class="ponto">.</span><span class="ext">log</span>`), sem quebrar linha dentro do nome. Abaixo de 560 px e de `lg` em diante, o nome começa sempre na segunda linha (`Bem-vindo ao` / `pk.log`): a quebra não pode depender da fonte, senão a troca da fonte reserva pela fonte de display desloca a página (T-44, CLS).
- Abaixo, o texto de apresentação em Plex Sans 18 px, entrelinha 1,55, cor grafite, máximo ~46 caracteres por linha, para a saudação ficar sozinha no topo (T-63, T-64).
- Links do autor, logo abaixo do texto: `RSS`, `GitHub` e `LinkedIn`, em texto e sem ícone, em IBM Plex Mono 12 px, maiúsculas, letter-spacing .12em, em grafite, indo para prússia no hover e no foco, com 44 px de altura para o toque e na mesma aba (T-69).
- Lateral, de `lg` em diante, na home (a saudação fica só na home, T-109; as páginas de tipo saem na T-111): a saudação vira uma coluna de 15rem à esquerda, sticky no topo da tela, com 6rem de vão até a barra e a lista. O conteúdo do site fica em 72rem (token `--container-site`, utilidade `max-w-site`), e o header e o footer alinham a essa largura, na mesma margem das laterais da home e do post. Abaixo de `lg`, a saudação e os links ficam em cima da barra e rolam com a página (T-69). De `lg` em diante, o contêiner da lateral e da lista ganha 56 px de respiro em cima, somados aos 40 px da saudação e da barra; as tags e `/page/n/` não mudam (T-70).
- A newsletter não entra na saudação: o lugar é o fim do post (§9.14, T-109).

### 9.2 Card de fólio e páginas de lista
Decisão da T-109; entra na T-111. Até lá, vale o card da T-63: com o resumo, o tipo com cor no rodapé e o destaque com capa na home.

- Um `article` em grade, sem resumo e sem tipo (SPEC Q20): fólio, data, título, tema, nível e tempo de leitura. Sem capa e sem destaque: o `featured` fica no schema e não muda a home.
- **Abaixo de `sm`:** a linha do fólio, `Fól. 003 · 17.nov.2026`, em mono 12 px, lápis; o título na fonte de display 600, 22 px, entrelinha 1,25; o rodapé, 0,5rem abaixo do título.
- **De `sm` em diante:** duas colunas, a do fólio com 6,5rem e a do texto, com 2rem de vão, centradas na vertical. A coluna do fólio tem `Fól. 003` e a data em duas linhas, na mesma fonte e na mesma cor do celular (mono 12 px, lápis). Título em 28 px, entrelinha 1,2, com `text-wrap: balance`; o rodapé, 0,75rem abaixo.
- **Rodapé:** tema, nível (hachura + nome) e tempo de leitura (relógio parado 12 px + `8 min`), numa linha só, em mono 12 px, maiúsculas, com separadores `|` na cor da linha. O tema fica em tinta, sem link, e é cortado com reticências quando não cabe; o nome inteiro fica no HTML, na lateral do post e na página do tema. O nível e o tempo, em lápis, não encolhem. Sem tags.
- Título sem sublinhado e sem troca de cor, em repouso, no hover e no foco. O card inteiro é tocável: o link do título se estica sobre o card (`after:absolute after:inset-0`, com o `article` em `relative`) e dá retorno em acento no toque (`active:text-accent`). O rodapé não intercepta o toque (`pointer-events-none`).
- Hover, no modelo do claude.dev: com o ponteiro sobre um card da listagem, os outros caem para opacidade 0,35, com transição curta. Só com mouse (`hover: hover` e `pointer: fine`); o foco do teclado faz o mesmo. Sem transição com `prefers-reduced-motion`. Exceção à seção 9.10 (T-63).
- A lista separa os cards com divisória `divide-line`, com filete também em cima do primeiro e embaixo do último. O respiro é só vertical: 1,25rem em cima e embaixo abaixo de `sm`, e 2rem de `sm` em diante. Sem borda, sem sombra e sem capa.

**Páginas de lista (T-109; entram na T-111).**

- **Home:** a saudação (§9.1) e todos os posts, dos dois tipos, por data, paginados (SPEC RF-03). Sem destaque, sem barra de tipos, sem busca e sem filtro.
- **`/artigos/` e `/prototipos/`:** a lista inteira do tipo, por data, sem paginação e sem saudação. h1 `Artigos` ou `Protótipos`, na escala do h1 de página (§5), com o ícone do tipo em 24 px, em tinta, antes do nome; abaixo, a busca e o filtro (§9.12) e a linha de contagem. Um tipo sem post publicado não tem página.
- **`/temas/<slug>/`:** uma página por tema, com h1 `Tema: <nome>`, sem busca e sem filtro; não há página `/temas/`. Quando o tema tem artigos e protótipos, a lista se divide em duas seções, `/ ARTIGOS` e `/ PROTÓTIPOS`, cada uma com o ícone do tipo em 12 px, em mono 12 px maiúsculo, tinta, sobre um filete de 1 px em tinta; o rótulo é h2, e o título do card passa a h3. Com um tipo só, a lista simples.

### 9.3 Cabeçalho do fólio (página do post)
Decisão da T-63, no modelo do Stripe (stripe.dev); entra nas T-65, T-66 e T-67.

- **Título em cima, sozinho:** h1 na escala do post (seção 5), na largura toda, com `text-wrap: balance`. Abaixo, a linha fina de introdução em grafite, até ~52 caracteres.
- **Lateral, de `lg` em diante:** à esquerda, com 15rem, vão de 4rem até o texto, sticky a 7,5rem do topo. No topo, `/ FÓL. 002` em mono 12 px, maiúsculas, tinta, sobre um filete de 1 px em tinta, com 8 px entre o texto e o filete; a barra é decorativa (`aria-hidden`). A coluna do texto abre com o tipo do post, `/ ARTIGO` ou `/ PROTÓTIPO` (T-109, entra na T-110), no mesmo estilo e na mesma altura, decorativo, com o filete alinhado ao da lateral. Abaixo do filete, os metadados numa tabela de chave e valor: o rótulo à esquerda, em mono 12 px maiúsculo e grafite, numa coluna de 7rem, e o valor à direita; linhas com 9 px de respiro e pontilhado em `line` entre elas, e filete sólido em `line` no fim. Data, atualizado em (quando houver), leitura, tipo (ícone parado em 12 px), tema (link para a página do tema, no estilo das tags; T-109, entra na T-111), nível, autor e tags; nas tags, o rótulo fica em cima, na largura toda.
- **Título ao rolar:** quando o h1 e a linha fina saem da tela, o título aparece acima da lateral, em 28 px, a 0,75rem dela. Fica em posição absoluta: não reserva espaço, não desloca nada, e o fólio continua visível. Um título de três linhas cabe acima da lateral sticky a 7,5rem. O título é texto com `aria-hidden`, não heading. A troca usa só opacidade, sem transição com `prefers-reduced-motion`. Sem JavaScript, o título não aparece.
- **Abaixo de `lg`:** sem lateral. `/ FÓL. 006` em mono, sem filete; o título; a linha fina; e a mesma tabela de metadados, com filete em cima e 32 px de respiro, tudo rolando com o texto. O rótulo do tipo (`/ ARTIGO`) não aparece.
- **Sem sumário** (SPEC: o RF-05 saiu na T-63).

**Apêndice, no modelo do Distill (T-66).** No fim do fólio, numa faixa própria depois do artigo, na largura toda, com filete de 1 px em `line` em cima e fundo `sheet`: os apêndices do autor e as referências numeradas (SPEC RF-04). Os títulos (`Apêndice A · <título>`, `Referências`) são rótulos em mono 12 px maiúsculo e grafite, nunca lápis (seção 4: lápis sobre folha clara dá 4,2). De `lg` em diante, o rótulo fica na coluna da lateral (15rem, vão de 4rem) e o texto, em Plex Sans 15 px com entrelinha 1,6, na coluna do texto; abaixo de `lg`, o rótulo fica em cima do texto. Cada referência traz o número da lista em grafite, o título com link numa linha e, abaixo, autores, ano e veículo em grafite; só o título é link. A ficha de bancada saiu na T-62.

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
Primeira célula de todo caderno: cabeçalho renderizado com a assinatura, o fólio do post e o título. Parâmetros como controles do marimo (`mo.ui.slider` etc.), não como constantes soltas. Sem `pk.css`: o molab não aplica o `css_file` do caderno (T-97), e o caderno fica com o estilo do molab; a marca entra pelo cabeçalho da primeira célula. Os dados ficam na pasta do caderno e se leem com `mo.notebook_dir()` (SPEC §7).

### 9.8 Diagramas
- Tinta para elementos; prússia para **um** destaque por diagrama; tracejado fino para guias.
- Rótulos em mono; no máximo duas notas em IBM Plex Sans itálico (T-52, LCP).
- Sempre uma cota com medida real.
- Fundo com grade milimetrada; sem sombra, sem gradiente, sem 3D.
- Funcionam nos dois modos (cores sempre por token).

**Vocabulário (decisão, 10/11/2026, T-72).** Medidas em unidades do `viewBox`; a figura sai no tamanho natural e só encolhe.

- Célula: quadrado de 24 com vão de 4, em folha (`sheet`), com traço de 1 em tinta. O destaque único é a célula em prússia (`accent`), com o mesmo traço.
- Tensor: só a camada da frente tem células; as de trás são placas lisas, deslocadas (8, −8) a cada camada.
- Seta: haste de 1 em tinta e ponta aberta de dois traços de 8, a ±30°.
- Cota: linha de 1 em tinta, afastada 12 da forma, com marcas perpendiculares de 6 nas pontas; o valor em Plex Mono 12, a 8 além da linha.
- Grade: linhas de 1 a cada 8 em `grid` e reforço a cada 40 em `grid-strong`, num `<pattern>`; o reforço vai nas duas bordas do ladrilho, para não sair com metade da espessura.
- Rótulo: nunca abaixo de 10 px renderizados a 360 px.
- Legenda: "Figura N" no rótulo da seção 5 (Plex Mono 12, maiúsculas, 0,1em, tinta), seguido do texto em Plex Sans 16 px, grafite.
- "Ver dados": no mesmo rótulo, em grafite, com alvo de pelo menos 24 px de altura; tabela com o cabeçalho no rótulo e as células em Plex Sans 14 px, tinta, com linhas na cor `line`.
- Nota em itálico: fora das figuras do post B, que não pode ganhar a Plex Sans itálico (LCP). Um post novo com nota mede antes.

**Exploráveis (decisão, 10/11/2026, T-20).**

- Mapa de calor: células como no vocabulário acima, mas em tinta com transparência por degrau (0,15, 0,3, 0,45, 0,6 e 0,75, do menor ao maior valor da matriz), com o traço de 1 em tinta. O destaque único é o contorno da linha escolhida, em prússia, com traço de 2, por fora das células, sobre o papel (8,5 de contraste no claro e 7,8 no escuro). Sem número dentro das células: os degraus entre si não chegam a 3:1, por isso os valores vão também em texto, no "Ver dados" e no texto ao vivo.
- Rótulos do mapa: os nomes em Plex Mono 12, tinta, à esquerda das linhas e acima das colunas, estes girados −90°; a cota `[linhas, colunas]` embaixo.
- Controles: abaixo do desenho. Botão em Plex Mono 12, tinta, com borda de 1 em tinta, cantos retos e pelo menos 32 px de altura; desabilitado, com 60% de opacidade. Controle deslizante na cor prússia, com pelo menos 24 px de altura e o rótulo visível. Texto ao vivo em Plex Mono 12, grafite.
- Movimento: a troca de cor da célula tem transição curta, desligada com `prefers-reduced-motion`; o contorno do mapa muda de linha sem transição.

### 9.9 Botão de tema
Decisão da T-109; entra na T-24. Um controle segmentado com dois botões de ícone, em 12 px: o sol (`icone-sol.svg`), tema claro, e a lua (`icone-lua.svg`), tema escuro. Cada botão tem 36 × 32 px; o grupo tem borda `line`, filete `line` entre os dois e cantos de 0,375rem. O botão ativo tem fundo tinta e ícone papel, com `aria-pressed="true"`; o outro, ícone grafite. Os nomes para o leitor de tela são **Claro** e **Escuro** (`aria-label`), e o grupo se chama Tema. Fica no header, à direita (§9.13). Grava a escolha (localStorage) e aplica `data-theme` na raiz.

### 9.10 Foco e interação
Foco visível: contorno 2 px prússia com afastamento 3 px. Links em prússia, sublinhado de 1 px com afastamento 3 px.

### 9.11 Link com cara de botão (página 404)
O "Voltar ao início" da página 404 parece um botão, mas continua um link (`<a>`) para `/`. Fundo tinta, texto papel, IBM Plex Mono 400 em 14 px, 44 px de altura, 20 px de respiro nas laterais. Cantos retos e sem sombra, como os botões da seção 9.6. Sem sublinhado em repouso; no hover e no foco, sublinhado com afastamento de 3 px, sem troca de cor. O foco é o da seção 9.10. No tema escuro, os mesmos tokens invertem o par: fundo claro, texto escuro.

### 9.12 Busca e filtro (listas)
Decisão da T-109. O filtro entra na T-112, e a busca, na T-22; a barra "Filtrar por tipo" (T-63, T-64) sai na T-111. Só em `/artigos/` e `/prototipos/`, 2rem abaixo do h1 e acima da linha de contagem: o campo de busca e o filtro por tema, lado a lado de `sm` em diante (o filtro com 14rem) e empilhados abaixo, com 0,75rem de vão.

- **Busca:** `input type="search"` com 44 px de altura, IBM Plex Mono 16 px (abaixo de 16 px, o Safari do iPhone dá zoom no toque), borda `line`, cantos de 0,375rem e fundo `surface`. O placeholder é `Buscar artigos` ou `Buscar protótipos`, em grafite (o lápis fica abaixo de 4,5 sobre a folha). A lupa (`icone-busca.svg`, 12 px, grafite) fica à direita, dentro do campo. Sem rótulo visível: o rótulo fica no HTML, escondido, com o texto do placeholder.
- **Filtro:** `select` nativo, só por tema, sem filtro por tag. Sem a seta do sistema (`appearance: none`), com 44 px, IBM Plex Mono 16 px, fundo `sheet`, borda `line` e cantos de 0,375rem. O ícone do filtro (`icone-filtro.svg`, 12 px, grafite) fica à esquerda, e o texto também. Sem tema escolhido, mostra `Filtre por`, em grafite; com tema, o nome e o número de posts (`Bastidores (2)`), em tinta. Rótulo escondido: `Filtrar por tema`.
- No HTML do build, os dois saem `disabled`, já com as opções, e o script os habilita sem mudar a altura de nada (sem CLS). A escolha vai para a URL: `?tema=<slug>&q=<termo>`.
- **Contagem:** em mono 12 px, maiúsculas, lápis, com `aria-live="polite"`: `3 artigos`, `2 de 3 artigos`, `1 artigo com “cosseno”`. Com tema ou termo, o botão `Limpar` vem ao lado, em tinta, sublinhado.
- **Com termo:** a busca procura só no tipo da página e respeita o tema escolhido. Os resultados vêm por relevância, no card da lista (§9.2), com o trecho do texto embaixo, em Plex Sans 16 px, grafite, e o termo marcado com fundo `sheet`, sem negrito (a página não carrega a Plex Sans 600).
- **Sem resultado:** `Nenhum artigo nesse tema.` ou `Nenhum artigo com esse termo nesse tema.` (em `/prototipos/`, `Nenhum protótipo…`), entre filetes `line`.
- **Sem JavaScript:** os dois campos ficam desabilitados, a lista vem inteira, e um aviso em Plex Sans 14 px, grafite, abaixo deles: `A busca e o filtro precisam de JavaScript. Sem ele, a lista abaixo mostra todos os artigos, e cada tema tem a sua página:`, seguido dos links das páginas de tema.

### 9.13 Header e footer
Decisão da T-109. O header e o footer entram na T-113, o link "Comece aqui", na T-114, e o controle de tema, na T-24.

- **Header:** fundo `surface`, filete `line` embaixo, na largura do site (72rem), com 0,75rem de respiro em cima e embaixo. A assinatura (§3) fica à esquerda. Os links, nesta ordem: `Comece aqui` (`/comece-aqui/`), `Artigos`, com a folha, e `Protótipos`, com o frasco, os ícones em 12 px. Cada link em IBM Plex Mono 12 px, maiúsculas, letter-spacing .12em, grafite, indo para prússia no hover e no foco, com 44 px de toque e 1,25rem entre eles; o da página atual vai para tinta, com sublinhado de 2 px e `aria-current="page"`. `Protótipos` só aparece quando há protótipo publicado: sem ele, a página não existe. O controle de tema (§9.9) fica por último, à direita.
- **De `md` em diante:** uma linha só, com a assinatura à esquerda e os links e o controle de tema à direita.
- **Abaixo de `md`:** duas linhas, sem menu e sem JavaScript. Na de cima, a assinatura e o controle de tema; na de baixo, depois de um filete `line`, os links, rolando na horizontal se não couberem.
- **Footer:** filete `line` em cima, na largura do site, com 1,5rem de respiro. Numa linha, `Pedro Knoll · 2026`, em mono 12 px, maiúsculas, grafite, à esquerda, e `RSS`, `GitHub` e `LinkedIn` à direita, no estilo dos links do header. Abaixo de `sm`, as duas partes se empilham.

### 9.14 Fim do post
Decisão da T-109. O compartilhar entra na T-115, os relacionados, na T-26, e a newsletter, na T-116; o estilo da faixa do apêndice é revisto na T-117.

- **Ordem:** texto, compartilhar, faixa do apêndice (§9.3, só quando o post tem referências ou apêndices), posts relacionados, newsletter e footer.
- **Compartilhar:** no fim da coluna do texto, 2,5rem abaixo do último parágrafo. O rótulo `/ COMPARTILHAR`, em mono 12 px maiúsculo, tinta, sobre um filete de 1 px em tinta, com 8 px entre o texto e o filete; abaixo, `X`, `LinkedIn`, `E-mail` e `Copiar link`, no estilo dos links do header (§9.13). Os três primeiros são links com o título e a URL do post (o e-mail por `mailto:`), sem script de terceiro. `Copiar link` é um botão do próprio site, criado pelo script: sem JavaScript, ele não aparece. Ao copiar, vira `Link copiado` por 1,5 s, com o `aria-label` junto, como o botão do código (§9.5).
- **Posts relacionados:** na coluna do texto, o rótulo `/ POSTS RELACIONADOS`, no estilo do compartilhar, e até 3 cards da lista (§9.2).
- **Newsletter:** na coluna do texto, depois dos relacionados. Forma preferida: um bloco com fundo `sheet` e cantos de 0,375rem; o título `Receba os próximos fólios por e-mail.` na fonte de display 600, o campo de e-mail como o da busca (§9.12) e o botão `Receber fólios`, com fundo tinta, texto papel, IBM Plex Mono e cantos de 0,375rem. A forma final depende do formulário do provedor (T-116).

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
| Página 404 | Esta página foi arrancada do caderno. · texto: O endereço pode ter mudado, ou esta página ainda não foi escrita. O resto do caderno continua aqui. · link: Voltar ao início · notas da ilustração: estava aqui · nó não encontrado |
| Botão de código | Copiar → Copiado |
| Botão de tema | ícones de sol e lua · nomes acessíveis: Claro · Escuro |
| Busca | Buscar artigos · Buscar protótipos |
| Filtro | Filtre por · nome acessível: Filtrar por tema · botão: Limpar |
| Contagem | 3 artigos · 2 de 3 artigos · 1 artigo com “cosseno” |
| Lista sem resultado | Nenhum artigo nesse tema. · Nenhum artigo com esse termo nesse tema. |
| Lista sem JavaScript | A busca e o filtro precisam de JavaScript. Sem ele, a lista abaixo mostra todos os artigos, e cada tema tem a sua página: |
| Fim do post | / Compartilhar · Copiar link → Link copiado · / Posts relacionados |
| Botão do caderno | Abrir no marimo · Abrir com GPU |

---

## 11. Aplicações

| Peça | Fundo | Regras |
|---|---|---|
| **Site** | velino (claro) / cianotipia (escuro) | Acompanha o tema do leitor. |
| **Thumbnail YouTube** 16:9 | cianotipia fixa + grade | `Fól. 001 · Conceito` em latão no topo, símbolo com nó em latão, título grande na fonte de display, IBM Plex Sans Condensed 600 (parte em itálico prússia clara), mini-diagrama, rodapé `pk.log · pedroknoll.com` em mono. |
| **Imagem de link (OG)** 1200×630 | velino + grade | Decisão da T-109, gerada no build pela T-23, só para post sem capa. Margem de 72 px. No alto, `/ FÓL. 003` à esquerda e o tipo (ícone e nome) à direita, em mono 22 px, tinta, sobre um filete de 2 px em tinta. O título na fonte de display 600, 72 px, até 3 linhas, quebradas pelo gerador entre palavras, com reticências no fim da 3ª se passar. Abaixo, o tema em tinta e o nível (hachura e nome), em mono 22 px. No pé, um filete `line`, a assinatura à esquerda e `pedroknoll.com` à direita, em mono 22 px, grafite. Só as faces da marca, sem itálico. |
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

Desde a T-46, os três ícones animados não têm `<style>`. As classes `pkc-`, `pkt-` e `pkp-`, os keyframes e o `prefers-reduced-motion` estão em `src/styles/global.css`. Os blocos abaixo mostram o desenho e a animação de origem; os arquivos em `src/assets/brand/icones/` são a versão sem `<style>`.

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

### Ícones novos (T-109) · `src/assets/brand/icones/`

Só parados, sem versão animada (§7). Cada um entra com a tarefa que o usa: a folha e o frasco na T-110, o filtro na T-112, a lupa na T-22, o sol e a lua na T-24.

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

`icone-filtro.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges">
  <path d="M0 2h12v1h-12zM2 5h8v1h-8zM4 8h4v1h-4z"/>
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
