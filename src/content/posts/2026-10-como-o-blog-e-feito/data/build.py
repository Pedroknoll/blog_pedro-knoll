# /// script
# requires-python = ">=3.14"
# dependencies = []
# ///
"""A conta é a autoatenção. A saída não se edita à mão.
"""

import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent


def dump(data: object) -> bytes:
    text = json.dumps(
        data, ensure_ascii=False, indent=2, sort_keys=True, allow_nan=False
    )
    return (text + "\n").encode("utf-8")


def attention() -> dict[str, object]:
    raw = json.loads((HERE / "raw" / "tokens.json").read_text(encoding="utf-8"))
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
        weights.append([round(value / total, 3) for value in exps])
    return {"tokens": raw["tokens"], "weights": weights}


def main() -> None:
    (HERE / "attention.json").write_bytes(dump(attention()))


if __name__ == "__main__":
    main()
