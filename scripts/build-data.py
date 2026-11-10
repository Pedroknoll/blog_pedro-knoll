# /// script
# requires-python = ">=3.14"
# dependencies = []
# ///
"""Gera os dados pré-calculados dos posts e o data.lock de cada pasta data/.

Roda na máquina do autor, da raiz do repositório:

    uv run scripts/build-data.py

O CI não executa este script: o pnpm check:data só confere os hashes do
data.lock (SPEC §8, T-73). Dependência nova no bloco acima é "Pare e
pergunte"; com ela, rode uv lock --script scripts/build-data.py e commite o
scripts/build-data.py.lock, que entra nas entradas do lock.
"""

import hashlib
import json
import math
import platform
from collections.abc import Callable
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GENERATOR = "scripts/build-data.py"
GENERATOR_LOCK = "scripts/build-data.py.lock"
POSTS = "src/content/posts"
DIGITS = 3

type Job = Callable[[str], tuple[list[str], dict[str, object]]]


def dump(data: object) -> bytes:
    text = json.dumps(
        data, ensure_ascii=False, indent=2, sort_keys=True, allow_nan=False
    )
    return (text + "\n").encode("utf-8")


def write(path: str, payload: bytes) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(payload)


def sha256(path: str) -> str:
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def attention(tokens_path: str) -> dict[str, object]:
    """Autoatenção softmax(X·Xᵀ/√d), por linha, arredondada em DIGITS casas."""
    raw = json.loads((ROOT / tokens_path).read_text(encoding="utf-8"))
    vectors: list[list[float]] = raw["vectors"]
    scale = math.sqrt(len(vectors[0]))
    weights = []
    for query in vectors:
        scores = [
            sum(q * k for q, k in zip(query, key, strict=True)) / scale
            for key in vectors
        ]
        top = max(scores)
        exps = [math.exp(score - top) for score in scores]
        total = sum(exps)
        weights.append([round(value / total, DIGITS) for value in exps])
    return {"tokens": raw["tokens"], "weights": weights}


def proof_post(data_dir: str) -> tuple[list[str], dict[str, object]]:
    """Prova da T-73, consumida pelo Heatmap da T-20; vai para o post da T-21."""
    tokens = f"{data_dir}/raw/tokens.json"
    return [tokens], {f"{data_dir}/attention.json": attention(tokens)}


JOBS: dict[str, Job] = {
    f"{POSTS}/2026-10-como-o-blog-e-feito/data": proof_post,
}


def main() -> None:
    for data_dir, job in JOBS.items():
        inputs, outputs = job(data_dir)
        for path, data in outputs.items():
            write(path, dump(data))
        sources = [GENERATOR, *inputs]
        if (ROOT / GENERATOR_LOCK).exists():
            sources.append(GENERATOR_LOCK)
        lock = {
            "format": 1,
            "generator": GENERATOR,
            "inputs": {path: sha256(path) for path in sources},
            "outputs": {path: sha256(path) for path in outputs},
            "python": platform.python_version(),
        }
        write(f"{data_dir}/data.lock", dump(lock))
        print(f"{data_dir}: {len(outputs)} saída(s) e data.lock")


if __name__ == "__main__":
    main()
