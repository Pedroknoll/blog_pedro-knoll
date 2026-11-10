import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

import { checkDataDir, findDataDirs } from "../src/lib/data-lock.ts";

function exists(file) {
  try {
    statSync(file);
    return true;
  } catch {
    return false;
  }
}

function read(file) {
  if (!exists(file)) return undefined;
  return readFileSync(file);
}

function reasonText(reason) {
  if (reason === "lock-missing") return "falta o data.lock";
  if (reason === "lock-invalid") return "data.lock inválido";
  if (reason === "generator-missing") return "gerador ausente nas entradas";
  if (reason === "generator-lock-missing") {
    return "lock do gerador ausente nas entradas";
  }
  if (reason === "outside") return "caminho fora do lugar";
  if (reason === "no-outputs") return "nenhuma saída";
  if (reason === "file-missing") return "arquivo listado não existe";
  if (reason === "hash-mismatch") return "hash não bate";
  if (reason === "unlisted") return "arquivo fora do lock";
  return reason;
}

const output = execFileSync("git", [
  "ls-files",
  "-z",
  "--cached",
  "--others",
  "--exclude-standard",
  "--",
  "src/content/posts",
]);

const paths = [];
let start = 0;
for (let index = 0; index < output.length; index += 1) {
  if (output[index] !== 0) continue;
  if (index > start) {
    paths.push(output.subarray(start, index).toString("utf8"));
  }
  start = index + 1;
}

const existing = paths.filter((file) => exists(file));
const dataDirs = findDataDirs(existing);

let locks = 0;
let failed = false;

for (const dataDir of dataDirs) {
  const dataFiles = existing.filter((file) => file.startsWith(`${dataDir}/`));
  if (dataFiles.includes(`${dataDir}/data.lock`)) locks += 1;
  for (const problem of checkDataDir(dataDir, dataFiles, read)) {
    console.error(`${problem.file}: ${reasonText(problem.reason)}`);
    failed = true;
  }
}

const label = locks === 1 ? "lock conferido" : "locks conferidos";
console.log(`${locks} ${label}`);

if (failed) process.exit(1);
