# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "marimo",
#     "numpy",
# ]
# ///

import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo

    mo.md("""
    pk.log · Fól. 003

    # O Motor Oculto dos LLMs: Como os Embeddings Fazem a IA Entender Dados

    Três perguntas para responder mexendo nos controles: que vetores dão
    cosseno 1? E −1? E o que acontece com o cosseno quando você dobra o
    tamanho de um deles sem mudar a direção? Anote o que encontrar.
    """)
    return (mo,)


@app.cell
def _(mo):
    u1 = mo.ui.slider(-1, 1, step=0.05, value=1, label="u1")
    u2 = mo.ui.slider(-1, 1, step=0.05, value=0, label="u2")
    u3 = mo.ui.slider(-1, 1, step=0.05, value=0, label="u3")
    v1 = mo.ui.slider(-1, 1, step=0.05, value=0, label="v1")
    v2 = mo.ui.slider(-1, 1, step=0.05, value=1, label="v2")
    v3 = mo.ui.slider(-1, 1, step=0.05, value=0, label="v3")
    mo.vstack(
        [
            mo.hstack([u1, u2, u3]),
            mo.hstack([v1, v2, v3]),
        ]
    )
    return u1, u2, u3, v1, v2, v3


@app.cell
def _(mo, u1, u2, u3, v1, v2, v3):
    import numpy as np

    def casa(numero: float) -> str:
        return f"{numero:.2f}".replace(".", ",").replace("-0,00", "0,00")

    u = np.array([u1.value, u2.value, u3.value], dtype=float)
    v = np.array([v1.value, v2.value, v3.value], dtype=float)
    norma_u = float(np.linalg.norm(u))
    norma_v = float(np.linalg.norm(v))
    if norma_u == 0 or norma_v == 0:
        texto = "Um dos vetores é (0, 0, 0). O cosseno não existe."
    else:
        cosseno = float(np.dot(u, v) / (norma_u * norma_v))
        texto = (
            f"u = ({casa(u[0])}, {casa(u[1])}, {casa(u[2])}) e "
            f"v = ({casa(v[0])}, {casa(v[1])}, {casa(v[2])}). "
            f"O cosseno é **{casa(cosseno)}**."
        )
    mo.md(texto)
    return


if __name__ == "__main__":
    app.run()
