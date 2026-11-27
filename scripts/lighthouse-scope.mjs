// Decide o que o job `lighthouse` mede (T-86): lê o diff entre BASE_SHA e
// HEAD e grava `mode` e `posts` no $GITHUB_OUTPUT. Qualquer erro mede tudo.
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

import { lighthouseScope } from "../src/lib/lighthouse-scope.ts";

function changedFiles(base) {
  if (!base || /^0+$/.test(base)) {
    throw new Error(`sem base para comparar (BASE_SHA=${base ?? ""})`);
  }
  const output = execFileSync("git", ["diff", "--name-only", base, "HEAD"], {
    encoding: "utf8",
  });
  return output.split("\n").filter(Boolean);
}

let scope = { mode: "full", posts: [] };
try {
  const files = changedFiles(process.env.BASE_SHA);
  console.log(`Arquivos no diff (${files.length}):`);
  for (const file of files) console.log(`  ${file}`);
  scope = lighthouseScope(files);
} catch (error) {
  console.log(`Mede tudo: ${error instanceof Error ? error.message : error}`);
}

const posts = scope.posts.join(" ");
console.log(`mode=${scope.mode}`);
console.log(`posts=${posts}`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `mode=${scope.mode}\nposts=${posts}\n`,
  );
}
