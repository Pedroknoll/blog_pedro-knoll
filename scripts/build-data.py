# /// script
# requires-python = ">=3.14"
# dependencies = []
# ///
"""Só acha os data/build.py e os roda.

Dependência nova no bloco PEP 723 continua sendo pergunta.
"""

import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS = "src/content/posts"


def dump(data: object) -> bytes:
    text = json.dumps(
        data, ensure_ascii=False, indent=2, sort_keys=True, allow_nan=False
    )
    return (text + "\n").encode("utf-8")


def git_paths() -> list[str]:
    result = subprocess.run(
        [
            "git",
            "ls-files",
            "-z",
            "--cached",
            "--others",
            "--exclude-standard",
            "--",
            POSTS,
        ],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    paths: list[str] = []
    for raw in result.stdout.split(b"\0"):
        if not raw:
            continue
        path = raw.decode("utf-8")
        if (ROOT / path).exists():
            paths.append(path)
    return paths


def discover(paths: list[str]) -> list[str]:
    suffix = "/data/build.py"
    return sorted(
        path.removesuffix("/build.py") for path in paths if path.endswith(suffix)
    )


def files_in(data_dir: str, paths: list[str]) -> list[str]:
    prefix = f"{data_dir}/"
    return sorted(path for path in paths if path.startswith(prefix))


def classify(data_dir: str, paths: list[str]) -> tuple[list[str], list[str]]:
    prefix = f"{data_dir}/"
    inputs: list[str] = []
    outputs: list[str] = []
    for path in paths:
        if not path.startswith(prefix):
            continue
        name = path[len(prefix) :]
        if name in {"build.py", "build.py.lock"} or name.startswith("raw/"):
            inputs.append(path)
        elif name != "data.lock":
            outputs.append(path)
    return inputs, outputs


def sha256(path: str) -> str:
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def hashes(paths: list[str]) -> dict[str, str]:
    return {path: sha256(path) for path in paths}


def output_keys(data_dir: str) -> set[str] | None:
    lock_path = ROOT / data_dir / "data.lock"
    if not lock_path.is_file():
        return None
    try:
        value = json.loads(lock_path.read_bytes())
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None
    if not isinstance(value, dict):
        return None
    outputs = value.get("outputs")
    if not isinstance(outputs, dict):
        return None
    return set(outputs)


def refuse(paths: list[str]) -> None:
    for path in paths:
        print(path, file=sys.stderr)
    sys.exit(1)


def run(data_dir: str) -> None:
    listed = files_in(data_dir, git_paths())
    inputs, generated = classify(data_dir, listed)
    keys = output_keys(data_dir)
    if keys is None:
        blocked = generated
    else:
        blocked = [path for path in generated if path not in keys]
    if blocked:
        refuse(blocked)
    odd = [path for path in generated if not (ROOT / path).is_file()]
    if odd:
        refuse(odd)
    for path in generated:
        (ROOT / path).unlink()

    before = hashes(inputs)
    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    completed = subprocess.run(
        ["uv", "run", "--script", "build.py"],
        check=False,
        cwd=ROOT / data_dir,
        env=env,
    )
    if completed.returncode != 0:
        sys.exit(completed.returncode)

    inputs, outputs = classify(data_dir, files_in(data_dir, git_paths()))
    if not outputs:
        print(f"{data_dir}: nenhuma saída", file=sys.stderr)
        sys.exit(1)
    if hashes(inputs) != before:
        print(f"{data_dir}: entradas diferentes", file=sys.stderr)
        sys.exit(1)

    script = f"{data_dir}/build.py"
    found = subprocess.run(
        ["uv", "python", "find", "--script", script, "--show-version"],
        check=False,
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if found.returncode != 0:
        sys.stderr.write(found.stderr)
        sys.exit(found.returncode)

    lock = {
        "format": 2,
        "generator": script,
        "inputs": hashes(inputs),
        "outputs": hashes(outputs),
        "python": found.stdout.strip(),
    }
    (ROOT / data_dir / "data.lock").write_bytes(dump(lock))


def post_data_dir(post: str) -> str:
    folder = Path(post).as_posix().removeprefix("./").rstrip("/")
    data_dir = f"{folder}/data"
    build = f"{data_dir}/build.py"
    if not (ROOT / build).is_file():
        print(f"{build} ausente", file=sys.stderr)
        sys.exit(1)
    return data_dir


def main() -> None:
    if len(sys.argv) == 1:
        data_dirs = discover(git_paths())
    else:
        data_dirs = [post_data_dir(post) for post in sys.argv[1:]]
    for data_dir in data_dirs:
        run(data_dir)


if __name__ == "__main__":
    main()
