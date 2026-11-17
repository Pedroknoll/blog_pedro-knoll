# /// script
# requires-python = ">=3.14"
# dependencies = []
# ///
"""rei − homem + mulher, 3 casas. Lê raw/analogia.json e grava
analogia.json. Rode com uv run scripts/build-data.py <pasta do post>.
A saída não se edita à mão."""

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
Point = tuple[float, float]


def dump(data: object) -> bytes:
    text = json.dumps(
        data, ensure_ascii=False, indent=2, sort_keys=True, allow_nan=False
    )
    return (text + "\n").encode("utf-8")


def rounded(point: Point) -> list[float]:
    return [round(point[0], 3), round(point[1], 3)]


def as_point(value: object, token: str) -> Point:
    if (
        not isinstance(value, list)
        or len(value) != 2
        or not all(isinstance(item, (int, float)) for item in value)
    ):
        raise SystemExit(f"ponto inválido: {token}")
    return (float(value[0]), float(value[1]))


def words_of(raw: object) -> dict[str, Point]:
    if not isinstance(raw, dict):
        raise SystemExit("raw/analogia.json precisa ser um objeto")
    rows = raw.get("words")
    if not isinstance(rows, list):
        raise SystemExit("words precisa ser uma lista")
    found: dict[str, Point] = {}
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("token"), str):
            raise SystemExit("cada palavra precisa de token")
        token = row["token"]
        found[token] = as_point(row.get("at"), token)
    return found


def require(words: dict[str, Point], token: str) -> Point:
    found = words.get(token)
    if found is None:
        raise SystemExit(f"falta o vetor: {token}")
    return found


def analogia() -> dict[str, object]:
    raw = json.loads((HERE / "raw" / "analogia.json").read_text(encoding="utf-8"))
    words = words_of(raw)
    rei = require(words, "rei")
    homem = require(words, "homem")
    mulher = require(words, "mulher")
    rainha = require(words, "rainha")
    origin = (0.0, 0.0)
    sem_homem = (rei[0] - homem[0], rei[1] - homem[1])
    soma = (sem_homem[0] + mulher[0], sem_homem[1] + mulher[1])
    if rounded(soma) != rounded(rainha):
        raise SystemExit("a conta não cai em rainha")
    steps = [
        (origin, rei),
        (rei, sem_homem),
        (sem_homem, soma),
        (origin, rainha),
    ]
    rows = raw["words"]
    return {
        "steps": [
            {"from": rounded(start), "to": rounded(end)} for start, end in steps
        ],
        "words": [
            {"at": rounded(words[row["token"]]), "token": row["token"]}
            for row in rows
        ],
    }


def main() -> None:
    (HERE / "analogia.json").write_bytes(dump(analogia()))


if __name__ == "__main__":
    main()
