# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "marimo",
#     "pandas",
# ]
# ///

import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _():
    import os
    import sys
    import time
    from pathlib import Path

    import marimo as mo

    return Path, mo, os, sys, time


@app.cell
def _(mo):
    mo.md("""
    # T-97 · sonda de dados

    Procura o `public/pontos.csv` por outros caminhos além do
    `mo.notebook_location()`. Cada linha "sonda N" é uma tentativa; um erro
    aparece como texto.
    """)
    return


@app.cell
def _(Path, mo, os, sys):
    REPO = "src/content/posts/fixture-mdx/notebooks/public/pontos.csv"
    RAW = (
        "https://raw.githubusercontent.com/Pedroknoll/blog_pedro-knoll/"
        "t-97-spike-molab/" + REPO
    )

    def ler(fonte):
        import pandas as pd

        tabela = pd.read_csv(fonte)
        return f"{len(tabela)} linhas, soma de y = {int(tabela['y'].sum())}"

    def tenta(func):
        try:
            return func()
        except Exception as erro:  # noqa: BLE001 (spike: o erro vira texto)
            return f"FALHOU: {type(erro).__name__}: {erro}"

    def achar():
        ignorar = {"/proc", "/dev", "/sys", "/lib", "/usr"}
        achados = []
        for raiz, pastas, arquivos in os.walk("/"):
            pastas[:] = [
                p for p in pastas if os.path.join(raiz, p) not in ignorar
            ]
            if "pontos.csv" in arquivos:
                achados.append(os.path.join(raiz, "pontos.csv"))
            if len(achados) >= 5:
                break
        return achados or "nenhum"

    def ler_url_pyodide():
        if sys.platform != "emscripten":
            return "não se aplica (fora do navegador)"
        from pyodide.http import open_url

        return ler(open_url(RAW))

    sondas = [
        ("cwd", lambda: os.getcwd()),
        ("cwd lista", lambda: sorted(os.listdir("."))[:15]),
        ("mo.notebook_dir()", lambda: str(mo.notebook_dir())),
        (
            "notebook_dir()/public/pontos.csv",
            lambda: ler(str(Path(mo.notebook_dir()) / "public" / "pontos.csv")),
        ),
        ("public/pontos.csv relativo ao cwd", lambda: ler("public/pontos.csv")),
        ("caminho do repo relativo ao cwd", lambda: ler(REPO)),
        ("busca por pontos.csv no disco", achar),
        ("pandas na URL raw do GitHub", lambda: ler(RAW)),
        ("pyodide.http.open_url na URL raw", ler_url_pyodide),
    ]
    resultados = [
        f"sonda {i}: {nome} → {tenta(func)}"
        for i, (nome, func) in enumerate(sondas, start=1)
    ]
    mo.md("\n".join(f"- {linha}" for linha in resultados))
    return (resultados,)


@app.cell
def _(mo, resultados, sys, time):
    _ = resultados
    pronto = int(time.time() * 1000)
    mo.md(f"""
    ## Fim

    - `sys.platform`: `{sys.platform}`
    - pronto (epoch, ms): `{pronto}`
    """)
    return


if __name__ == "__main__":
    app.run()
