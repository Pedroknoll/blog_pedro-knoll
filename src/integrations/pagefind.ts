import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type { AstroIntegration } from "astro";
import { close, createIndex } from "pagefind";

const postGlob = "**/blog/*/index.html";
const searchCall = "search:(term,options2={})=>wrapper.search(term,options2)";

// O índice guarda a letra solta ("a", "e", "o"). Uma consulta que não existe
// e começa por essa letra volta todas as páginas, pelo prefixo inverso do
// Pagefind. O modal usa o search do createInstance; este filtro descarta o
// resultado cujo destaque é só essa letra.
const filteredSearch = `search:async(term,options2={})=>{const result=await wrapper.search(term,options2);const words=String(term??"").trim().split(/\\s+/).filter(Boolean);if(!result?.results?.length||words.every((word)=>[...word].length<=1))return result;const checks=await Promise.all(result.results.map(async(hit)=>{try{const data=await hit.data();const excerpts=[data?.excerpt];if(Array.isArray(data?.sub_results)){for(const sub of data.sub_results)excerpts.push(sub?.excerpt);}const marks=excerpts.flatMap((excerpt)=>[...String(excerpt??"").matchAll(/<mark>([^<]*)<\\/mark>/g)].map((match)=>match[1]));return marks.length===0||marks.some((mark)=>[...mark].length>1)?hit:null;}catch{return hit;}}));return{...result,results:checks.filter((hit)=>hit!==null)};}`;

async function dropLoneLetterMatches(scriptPath: string): Promise<void> {
  const source = await readFile(scriptPath, "utf8");
  const count = source.split(searchCall).length - 1;
  if (count !== 1) {
    throw new Error(
      "O Pagefind mudou o createInstance; o filtro da letra solta não entrou.",
    );
  }
  await writeFile(scriptPath, source.replace(searchCall, filteredSearch));
}

async function postPageCount(directory: string): Promise<number> {
  const entries = await readdir(join(directory, "blog"), {
    withFileTypes: true,
  });
  let count = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await stat(join(directory, "blog", entry.name, "index.html"));
      count += 1;
    } catch {
      // Pasta sem a página do post.
    }
  }
  return count;
}

function failure(errors: readonly string[], fallback: string): Error {
  const message = errors.filter((error) => error.trim() !== "").join("\n");
  return new Error(message === "" ? fallback : message);
}

export function pagefindIntegration(): AstroIntegration {
  return {
    name: "pagefind",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const directory = fileURLToPath(dir);
        const created = await createIndex({
          excludeSelectors: [".katex-mathml"],
        });
        try {
          if (created.errors.length > 0 || !created.index) {
            throw failure(created.errors, "O Pagefind não criou o índice.");
          }
          const posts = await postPageCount(directory);
          const indexed = await created.index.addDirectory({
            path: directory,
            glob: postGlob,
          });
          if (indexed.errors.length > 0) {
            throw failure(indexed.errors, "O Pagefind não indexou o site.");
          }
          if (indexed.page_count !== posts) {
            throw new Error(
              `O Pagefind indexou ${indexed.page_count} páginas; o build tem ${posts} posts.`,
            );
          }
          const written = await created.index.writeFiles({
            outputPath: join(directory, "pagefind"),
          });
          if (written.errors.length > 0) {
            throw failure(written.errors, "O Pagefind não gravou o índice.");
          }
          logger.info(`Pagefind indexou ${indexed.page_count} páginas.`);
          await dropLoneLetterMatches(
            join(directory, "pagefind", "pagefind.js"),
          );
        } finally {
          await close();
        }
      },
    },
  };
}
