import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { effectiveHeaders } from "../../src/integrations/headers.ts";
import { fixtureMdx } from "./fixtures";
import { publishedPosts } from "./published-posts";

const immutable = ["public, max-age=31536000, immutable"];

function fileNames(directory: string): string[] {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}

function sha256(file: string): string {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function cacheOf(text: string, pathname: string): string[] | undefined {
  return effectiveHeaders(text, pathname).get("cache-control");
}

function isImmutable(value: string[] | undefined): boolean {
  return (
    value?.length === immutable.length &&
    value.every((item, index) => item === immutable[index])
  );
}

test("regras de cache do dist/_headers [RNF-01, RNF-07]", async ({ page }) => {
  const headersText = fs.readFileSync(path.resolve("dist/_headers"), "utf8");

  const astroNames = fileNames(path.resolve("dist/_astro"));
  expect(astroNames.length).toBeGreaterThanOrEqual(1);
  const astro: Record<string, string[] | null> = {};
  for (const name of astroNames) {
    const pathname = `/_astro/${name}`;
    const value = cacheOf(headersText, pathname);
    if (!isImmutable(value)) astro[pathname] = value ?? null;
  }
  expect(astro).toEqual({});

  // O nome em /_astro/fonts/ é o hash do conteúdo só para arquivo local
  // (T-95): toda fonte servida tem os bytes de uma de src/assets/fonts/.
  const localDir = path.resolve("src/assets/fonts");
  const local = new Set(
    fs.existsSync(localDir)
      ? fileNames(localDir).map((name) => sha256(path.join(localDir, name)))
      : [],
  );
  const fontNames = fileNames(path.resolve("dist/_astro/fonts"));
  expect(fontNames.length).toBeGreaterThanOrEqual(1);
  const fonts: Record<string, string[] | null> = {};
  const remote: string[] = [];
  for (const name of fontNames) {
    const pathname = `/_astro/fonts/${name}`;
    if (!local.has(sha256(path.resolve("dist/_astro/fonts", name)))) {
      remote.push(pathname);
    }
    const value = cacheOf(headersText, pathname);
    if (!isImmutable(value)) fonts[pathname] = value ?? null;
  }
  expect(remote).toEqual([]);
  expect(fonts).toEqual({});

  const posts = await publishedPosts(page);
  const pages: Record<string, string[]> = {};
  for (const pathname of [
    "/",
    fixtureMdx.href,
    ...posts.map((post) => post.href),
  ]) {
    const value = cacheOf(headersText, pathname);
    if (value !== undefined) pages[pathname] = value;
  }
  expect(pages).toEqual({});

  const root: Record<string, string[]> = {};
  for (const name of fileNames(path.resolve("dist"))) {
    const pathname = `/${name}`;
    const value = cacheOf(headersText, pathname);
    if (value !== undefined) root[pathname] = value;
  }
  expect(root).toEqual({});
});
