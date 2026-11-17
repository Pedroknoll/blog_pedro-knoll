import { existsSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";

const MOLAB = "https://molab.marimo.io/github/Pedroknoll/blog_pedro-knoll/blob";
const SRC = /^\.\/notebooks\/[a-z0-9_-]+\.py$/;
const REPO_PATH =
  /^src\/content\/posts\/[a-z0-9-]+\/notebooks\/[a-z0-9_-]+\.py$/;
const REF = /^[A-Za-z0-9._-]+$/;

export function notebookRef(value: string | undefined): string {
  if (value === undefined || value === "") return "main";
  if (!REF.test(value)) throw new Error(`NOTEBOOK_REF inválido: ${value}`);
  return value;
}

export function molabUrl(path: string, ref: string, gpu: boolean): string {
  if (!REPO_PATH.test(path)) {
    throw new Error(
      `Caderno sem o caminho do repositório: ${path} (importe o componente como Notebook)`,
    );
  }
  const url = `${MOLAB}/${ref}/${path}`;
  return gpu ? url : `${url}/wasm`;
}

export function notebookRepoPath(
  mdxPath: string,
  src: unknown,
  root: string,
  exists: (path: string) => boolean = existsSync,
): string {
  if (typeof src !== "string" || !SRC.test(src)) {
    throw new Error(
      `Caderno fora de ./notebooks/<nome>.py: ${String(src)} em ${mdxPath}`,
    );
  }
  const absolute = resolve(dirname(mdxPath), src);
  if (!exists(absolute)) {
    throw new Error(`Caderno não encontrado: ${src} em ${mdxPath}`);
  }
  return relative(root, absolute).split(sep).join("/");
}
