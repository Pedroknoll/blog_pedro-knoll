# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "humanize==4.9.0",
#     "marimo",
#     "torch",
# ]
# ///

import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _():
    import sys
    import time

    import marimo as mo

    return mo, sys, time


@app.cell
def _(mo):
    mo.md("""
    # T-97 · caderno pesado

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
def _(mo, time):
    try:
        import torch

        linhas = [f"torch `{torch.__version__}`"]
        if torch.cuda.is_available():
            linhas.append(f"GPU: `{torch.cuda.get_device_name(0)}`")
            a = torch.randn(4096, 4096, device="cuda")
            torch.cuda.synchronize()
            inicio = time.perf_counter()
            for _i in range(10):
                a @ a
            torch.cuda.synchronize()
            ms = (time.perf_counter() - inicio) * 1000 / 10
            linhas.append(f"matmul 4096×4096 na GPU: {ms:.1f} ms (média de 10)")
        else:
            linhas.append("GPU: nenhuma (`torch.cuda.is_available()` é False)")
        gpu = " · ".join(linhas)
    except Exception as erro:  # noqa: BLE001 (spike: o erro vira texto)
        gpu = f"FALHOU: {type(erro).__name__}: {erro}"
    mo.md(f"""
    ## torch e GPU

    {gpu}
    """)
    return (gpu,)


@app.cell
def _(ambiente, gpu, mo, pep723, time):
    _ = (ambiente, gpu, pep723)
    pronto = int(time.time() * 1000)
    mo.md(f"""
    ## Fim

    - pronto (epoch, ms): `{pronto}`
    """)
    return


if __name__ == "__main__":
    app.run()
