---

title: "Como o blog é feito"

description: "Astro gera o HTML, marimo exporta os notebooks e a Cloudflare só serve arquivos estáticos: a arquitetura deste blog."

pubDate: 2026-10-16

tags: [astro, marimo, cloudflare]

---
O blog é um site estático. Todo o trabalho acontece no build; em produção, nenhum código roda do meu lado, só no seu navegador.
 
## As peças
 
- **Astro** gera o HTML a partir de arquivos Markdown e MDX. Cada post é uma pasta com o texto, a capa, os dados dos gráficos e os notebooks. O frontmatter é validado no build: um campo errado quebra o build em vez de chegar ao leitor.
- **marimo** cuida dos notebooks. No build, cada notebook vira uma página WebAssembly autônoma, que roda Python no navegador com o Pyodide. O post a embute num iframe.
- **Svelte e D3** fazem os gráficos. O D3 só calcula escalas e formas; quem desenha o SVG é o Svelte. Assim o gráfico já sai pronto no HTML e pode ser lido mesmo sem JavaScript.
- **Cloudflare** serve os arquivos, a partir de um Worker com Static Assets. Não há servidor de aplicação.
## Do commit à produção
 
Tudo passa por pull request. O GitHub Actions roda lint, checagem de tipos, testes unitários, o build de produção e testes de ponta a ponta com Playwright, incluindo verificações de acessibilidade. Cada pull request ganha uma URL de preview, e só o merge na branch principal publica o site.
 
## Notebooks pesados
 
O Pyodide só instala pacotes compilados para WebAssembly, e o PyTorch não está entre eles. Por isso, o plano para notebooks com treino pesado é rodar o treino antes, na minha máquina, e versionar o export com os resultados. No navegador, o leitor interage com o que já foi calculado.
 
## Peso e segurança
 
O runtime do Python no navegador pesa dezenas de megabytes. Ele só carrega em páginas que têm notebook, e só dentro do iframe. A política de segurança de conteúdo segue a mesma divisão: a permissão para executar WebAssembly vale apenas nas rotas dos notebooks, nunca nas páginas de texto.
 
## O que ficou de fora
 
Pensei em rodar células de notebook no meio do texto, sem iframe. Testei e adiei: a ferramenta ainda não permitia controlar a versão do Python nem a do marimo no build, e isso tornaria a manutenção frágil. Por enquanto, notebook é sempre iframe.