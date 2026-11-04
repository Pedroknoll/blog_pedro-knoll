import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

import { isBinaryPath, utf8Problem } from "../src/lib/utf8.ts";

function exists(file) {
  try {
    statSync(file);
    return true;
  } catch {
    return false;
  }
}

const output = execFileSync("git", [
  "ls-files",
  "-z",
  "--cached",
  "--others",
  "--exclude-standard",
  "--",
  "src",
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

let text = 0;
let binary = 0;
let failed = false;

for (const file of paths) {
  if (!exists(file)) continue;
  if (isBinaryPath(file)) {
    binary += 1;
    continue;
  }
  const bytes = readFileSync(file);
  text += 1;
  const problem = utf8Problem(bytes);
  if (problem === "invalid") {
    console.error(`${file}: byte que não forma UTF-8 válido`);
    failed = true;
  } else if (problem === "bom") {
    console.error(`${file}: BOM no início`);
    failed = true;
  }
}

const textLabel =
  text === 1 ? "arquivo de texto checado" : "arquivos de texto checados";
const binaryLabel = binary === 1 ? "binário pulado" : "binários pulados";
console.log(`${text} ${textLabel}, ${binary} ${binaryLabel}`);

if (failed || text === 0) process.exit(1);
