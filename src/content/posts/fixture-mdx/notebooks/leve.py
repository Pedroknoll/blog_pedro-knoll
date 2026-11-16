# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "humanize==4.9.0",
#     "marimo",
#     "pandas",
# ]
# ///

import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium", css_file="t97.css")


@app.cell
def _():
    import sys
    import time

    import marimo as mo

    return mo, sys, time


@app.cell
def _(mo):
    mo.md("""
    # T-97 · caderno leve

    Spike do molab. Cada bloco abaixo mostra o que foi medido; um erro aparece
    como texto, sem derrubar o caderno.
    """)
    return


@app.cell
def _(mo, sys):
    ambiente = {
        "marimo": mo.__version__,
        "python": sys.version,
        "platform": sys.platform,
    }
    mo.md(f"""
    ## Ambiente

    - marimo: `{ambiente["marimo"]}`
    - Python: `{ambiente["python"]}`
    - `sys.platform`: `{ambiente["platform"]}` (`emscripten` = navegador)
    """)
    return (ambiente,)


@app.cell
def _(mo):
    try:
        import humanize

        pep723 = f"humanize {humanize.__version__} (o bloco pede 4.9.0)"
    except Exception as erro:  # noqa: BLE001 (spike: o erro vira texto)
        pep723 = f"FALHOU: {type(erro).__name__}: {erro}"
    mo.md(f"""
    ## PEP 723

    {pep723}
    """)
    return (pep723,)


@app.cell
def _(mo):
    caminho = mo.notebook_location() / "public" / "pontos.csv"
    try:
        import pandas as pd

        tabela = pd.read_csv(str(caminho))
        dados = (
            f"{len(tabela)} linhas, soma de y = {int(tabela['y'].sum())} "
            "(esperado: 5 linhas, soma 55)"
        )
    except Exception as erro:  # noqa: BLE001 (spike: o erro vira texto)
        dados = f"FALHOU: {type(erro).__name__}: {erro}"
    mo.md(f"""
    ## Dados

    - caminho: `{caminho}`
    - leitura: {dados}
    """)
    return (dados,)


@app.cell
def _(mo):
    mo.md("""
    ## CSS

    Com o `t97.css` aplicado, os títulos deste caderno saem em fonte
    monoespaçada e com sublinhado ondulado.
    """)
    return


@app.cell
def _(mo):
    fator = mo.ui.slider(1, 10, value=1, label="fator")
    fator
    return (fator,)


@app.cell
def _(ambiente, dados, fator, mo, pep723, time):
    _ = (ambiente, dados, pep723)
    pronto = int(time.time() * 1000)
    mo.md(f"""
    ## Interativo

    - fator × 7 = **{fator.value * 7}** (muda com o slider)
    - pronto (epoch, ms): `{pronto}`
    """)
    return


if __name__ == "__main__":
    app.run()
