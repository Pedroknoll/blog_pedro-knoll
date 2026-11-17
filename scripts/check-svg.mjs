import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { svgBreakouts } from "../src/lib/svg-breakout.ts";

const distName = process.argv[2] ?? "dist";
const distDir = path.resolve(distName);

function exists(file) {
  try {
    statSync(file);
    return true;
  } catch {
    return false;
  }
}

if (!exists(path.join(distDir, "index.html"))) {
  console.error(`${distName}/index.html não existe`);
  process.exit(1);
}

function htmlFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...htmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      found.push(full);
    }
  }
  return found;
}

let pages = 0;
let svgs = 0;
let failures = 0;
for (const file of htmlFiles(distDir).sort()) {
  pages += 1;
  const result = svgBreakouts(readFileSync(file, "utf8"));
  svgs += result.svgs;
  const relative = path.relative(distDir, file).split(path.sep).join("/");
  for (const breakout of result.breakouts) {
    failures += 1;
    const where = breakout.figure ? ` da figura ${breakout.figure}` : "";
    console.error(
      `${distName}/${relative}:${breakout.line}: ${breakout.tag} dentro do <svg>${where}`,
    );
  }
}

console.log(
  `check:svg ${distName}: ${pages} páginas, ${svgs} svg, ${failures} tags que fecham o svg`,
);
if (svgs === 0) {
  console.error(`${distName}: nenhum <svg> lido`);
  process.exit(1);
}
if (failures > 0) process.exit(1);
