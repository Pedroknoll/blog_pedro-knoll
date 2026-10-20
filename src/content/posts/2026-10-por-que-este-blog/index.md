---
title: "Por que este blog existe"

description: "Notas de estudo sobre aprendizado de máquina, com notebooks que rodam no navegador e gráficos interativos."

pubDate: 2026-10-16

tags: [meta]

featured: true

cover: ./cover.png

coverAlt: "Fundo preto com texto"
---

Este blog é o meu caderno de estudos em público. Escrevo sobre aprendizado de máquina do jeito que eu gostaria de ter aprendido: com o texto, o código e o resultado no mesmo lugar.

## Por que escrever

Explicar uma ideia por escrito é o teste mais honesto que conheço para saber se entendi. Quando um parágrafo não fecha, quase sempre faltou alguma coisa no meu entendimento, não no texto. Publicar me obriga a ir até o fim. Quando a conta é um quadrado, escrevo $x_i^2$.

## O que muda em relação a um caderno comum

Alguns posts vão trazer notebooks marimo que rodam no seu navegador. O Python executa ali mesmo, via WebAssembly, sem instalar nada e sem servidor. Dá para mexer num controle e ver o resultado mudar, em vez de só ler sobre ele.

Outros vão ter gráficos interativos. O gráfico já chega desenhado na página; a interatividade só carrega quando ele aparece na tela.

Quando um exemplo depende de treino pesado, com GPU, o treino roda antes, na minha máquina, e o post traz os resultados prontos. As partes leves continuam interativas.

## O que esperar

- Posts longos e com calma, em vez de muitos posts curtos.
- Código que roda, com as versões das dependências travadas.
- Correções feitas às claras, no próprio repositório do blog.
  Se quiser ver como tudo isso é montado por dentro, o post "Como o blog é feito" conta a arquitetura.
