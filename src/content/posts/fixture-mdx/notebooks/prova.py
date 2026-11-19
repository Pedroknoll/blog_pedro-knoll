# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "marimo",
# ]
# ///

import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo

    mo.md("""
    pk.log

    # Fixture de MDX

    Caderno de prova do componente `Notebook`. Mude o tamanho do vetor e
    acompanhe a soma dos quadrados e a norma.
    """)
    return (mo,)


@app.cell
def _(mo):
    n = mo.ui.slider(1, 10, value=4, label="tamanho do vetor")
    n
    return (n,)


@app.cell
def _(mo, n):
    import math

    x = list(range(1, n.value + 1))
    soma = sum(valor**2 for valor in x)
    mo.md(f"""
    Com x = {x}, a soma dos quadrados é **{soma}** e a norma é
    **{math.sqrt(soma):.2f}**.
    """)
    return


if __name__ == "__main__":
    app.run()
