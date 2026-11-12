import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { distLeaksFixtures } from "../src/lib/published.ts";

const rootArg = process.argv[2] ?? "dist";
const distDir = path.resolve(rootArg);

function exists(file) {
  try {
    statSync(file);
    return true;
  } catch {
    return false;
  }
}

if (!exists(distDir) || !statSync(distDir).isDirectory()) {
  console.error(`${rootArg}: pasta ausente`);
  process.exit(1);
}

function collect(dir, directories, texts) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(distDir, full).split(path.sep).join("/");
    if (entry.isDirectory()) {
      directories.push(rel);
      collect(full, directories, texts);
    } else if (entry.isFile()) {
      texts.push(readFileSync(full, "utf8"));
    }
  }
}

const directories = [];
const texts = [];
collect(distDir, directories, texts);

if (distLeaksFixtures(directories, texts)) {
  console.error(
    `${rootArg}: vazamento de fixture (pasta blog/fixture-* ou texto /blog/fixture-)`,
  );
  process.exit(1);
}

console.log(`${rootArg}: sem fixture`);
