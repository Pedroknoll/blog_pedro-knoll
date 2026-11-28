import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import {
  effectiveHeaders,
  extractHashes,
} from "../../src/integrations/headers.ts";
import { KINDS } from "../../src/lib/kind";
import {
  directiveValue,
  policyOf,
  readCspViolations,
  serveDocument,
  watchCsp,
} from "./csp";
import {
  fixtureFormulas,
  fixtureMd,
  fixtureMdx,
  fixtureSemTitulos,
} from "./fixtures";
import { pagesForTheme, publishedPosts } from "./published-posts";
import { blockGiscus } from "./giscus";

// O widget de giscus.app não entra nestes testes (RF-19, T-28).
test.beforeEach(async ({ page }) => {
  await blockGiscus(page);
});

test.describe("Caderno no molab [RF-08, RNF-03]", () => {
  test("post sem caderno não carrega runtime", async ({ page }) => {
    const requested = await pageRequests(page, fixtureMd.href);
    await expect(molabLinks(page)).toHaveCount(0);
    expect(requested.filter((url) => RUNTIME.test(url))).toEqual([]);
  });

  test("post com caderno não carrega runtime", async ({ page }) => {
    const requested = await pageRequests(page, fixtureMdx.href);
    await expect(molabLinks(page)).toHaveCount(2);
    expect(requested.filter((url) => RUNTIME.test(url))).toEqual([]);
  });

  test("o botão aponta para o molab", async ({ page }) => {
    const response = await page.goto(fixtureMdx.href);
    expect(response?.status()).toBe(200);
    await expect(molabLinks(page)).toHaveCount(2);
    await expect(
      page.getByRole("link", { name: "Abrir no marimo", exact: true }),
    ).toHaveAttribute("href", `${fixtureMdx.notebook}/wasm`);
    await expect(
      page.getByRole("link", { name: "Abrir com GPU", exact: true }),
    ).toHaveAttribute("href", fixtureMdx.notebook);
  });
});

const RUNTIME = /pyodide|marimo/;

function molabLinks(page: Page) {
  return page.locator('a[href^="https://molab.marimo.io/"]');
}

async function pageRequests(page: Page, href: string): Promise<string[]> {
  const requested: string[] = [];
  page.on("request", (request) => {
    requested.push(request.url());
  });
  const response = await page.goto(href);
  expect(response?.status(), href).toBe(200);
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await page.waitForTimeout(1000);
  const paths = requested.map((url) => new URL(url).pathname);
  expect(paths, href).toContain(href);
  expect(
    paths.some((path) => path.startsWith("/_astro/") && path.endsWith(".css")),
    href,
  ).toBe(true);
  return requested;
}

test.describe("CSP por rota [RNF-06, RNF-07]", () => {
  test("rota sem notebook", async ({ page }) => {
    const headersText = fs.readFileSync(path.resolve("dist/_headers"), "utf8");
    const posts = await publishedPosts(page);
    const artifactPaths = [
      ...new Set(["/", fixtureMdx.href, ...posts.map((post) => post.href)]),
    ];
    for (const pathname of artifactPaths) {
      assertArtifact(headersText, pathname);
    }

    const svg = fs.readFileSync(path.resolve("dist/favicon.svg"), "utf8");
    const faviconHashes = faviconStyleHashes(svg);
    expect(faviconHashes.length).toBeGreaterThan(0);
    const styleElem = directiveValue(
      policyOf(headersText, "/"),
      "style-src-elem",
    );
    for (const hash of faviconHashes) {
      expect(styleElem).toContain(hash);
    }
    expect(extractHashes(svg).styles).toEqual(faviconHashes);

    const themePaths = await pagesForTheme(page);
    const missing = "/nao-existe/";
    const browserPaths = [
      ...new Set([
        ...themePaths,
        fixtureMd.href,
        fixtureMdx.href,
        fixtureSemTitulos.href,
        fixtureFormulas.href,
        missing,
      ]),
    ];
    const violations: Record<string, CspHit> = {};
    for (const pathname of browserPaths) {
      await page.unrouteAll();
      await serveDocument(page, pathname, policyOf(headersText, pathname));
      await watchCsp(page);
      const response = await page.goto(pathname);
      expect(response?.status(), pathname).toBe(
        pathname === missing ? 404 : 200,
      );
      await page.waitForTimeout(1000);
      const found = await readCspViolations(page);
      const first = found[0];
      if (!first) continue;
      violations[pathname] = {
        directive: first.directive,
        sample: first.sample,
        count: found.length,
      };
    }
    expect(violations).toEqual({});
  });
});

type CspHit = {
  directive: string;
  sample: string;
  count: number;
};

function assertArtifact(text: string, pathname: string): void {
  const applied = effectiveHeaders(text, pathname);
  const policy = policyOf(text, pathname);
  expect(directiveValue(policy, "script-src"), pathname).toContain(
    "'wasm-unsafe-eval'",
  );
  expect(policy, pathname).toContain("frame-ancestors 'self'");
  // O iframe dos comentários (RF-19, T-28) é a única origem de frame.
  expect(directiveValue(policy, "frame-src"), pathname).toBe(
    "https://giscus.app",
  );
  expect(applied.get("strict-transport-security"), pathname).toEqual([
    "max-age=63072000; includeSubDomains",
  ]);
  expect(applied.get("x-content-type-options"), pathname).toEqual(["nosniff"]);
  expect(applied.get("referrer-policy"), pathname).toEqual([
    "strict-origin-when-cross-origin",
  ]);
  expect(applied.get("permissions-policy"), pathname).toEqual([
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  ]);
}

function faviconStyleHashes(svg: string): string[] {
  return [...svg.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(
    (match) => {
      const digest = createHash("sha256")
        .update(match[1] ?? "")
        .digest("base64");
      return `'sha256-${digest}'`;
    },
  );
}

type DiskPost = {
  slug: string;
  draft: boolean;
  tags: string[];
  kind: (typeof KINDS)[number];
};

function frontmatterOf(text: string) {
  const start = text.indexOf("---");
  const end = text.indexOf("---", start + 3);
  if (start === -1 || end === -1) {
    throw new Error("frontmatter ausente");
  }
  return text.slice(start + 3, end);
}

function tagsOf(frontmatter: string, file: string) {
  const lines = frontmatter
    .split("\n")
    .filter((entry) => entry.trimStart().startsWith("tags:"));
  for (const line of lines) {
    if (!line.includes("[")) {
      throw new Error(`${file}: linha tags sem [`);
    }
  }
  if (lines.length === 0) return [];
  const match = /^tags:\s*\[([^\]]*)\]/m.exec(frontmatter);
  if (!match) {
    throw new Error(`${file}: linha tags sem [`);
  }
  return (match[1] ?? "")
    .split(",")
    .map((tag) => tag.trim().replace(/['"]/g, ""))
    .filter((tag) => tag.length > 0);
}

function kindOf(frontmatter: string, file: string) {
  const match = /^kind:\s*([a-z]+)\s*$/m.exec(frontmatter);
  const kind = KINDS.find((item) => item === match?.[1]);
  if (!kind) throw new Error(`${file}: kind ausente`);
  return kind;
}

function diskPosts(): DiskPost[] {
  const root = path.resolve("src/content/posts");
  const posts: DiskPost[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const fileName of ["index.md", "index.mdx"]) {
      const file = path.join(root, entry.name, fileName);
      if (!fs.existsSync(file)) continue;
      const frontmatter = frontmatterOf(fs.readFileSync(file, "utf8"));
      posts.push({
        slug: entry.name,
        draft: frontmatter
          .split("\n")
          .some((line) => line.trim() === "draft: true"),
        tags: tagsOf(frontmatter, path.relative(process.cwd(), file)),
        kind: kindOf(frontmatter, path.relative(process.cwd(), file)),
      });
    }
  }
  return posts;
}

async function hrefsOf(page: Page) {
  return page
    .locator("a")
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute("href") ?? ""),
    );
}

async function publishedTagNames(page: Page, slugs: readonly string[]) {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const slug of slugs) {
    const response = await page.goto(`/blog/${slug}/`);
    expect(response?.status(), slug).toBe(200);
    const links = page
      .getByRole("list", { name: "Tags", exact: true })
      .getByRole("link");
    const count = await links.count();
    for (let index = 0; index < count; index += 1) {
      const name = ((await links.nth(index).textContent()) ?? "")
        .replace(/\s+/g, " ")
        .trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

test.describe("Rascunhos [RF-11]", () => {
  test("draft em produção", async ({ page }) => {
    const posts = diskPosts();
    const drafts = posts.filter((post) => post.draft);
    expect(drafts.length).toBeGreaterThan(0);

    const publishedTags = new Set(
      posts.filter((post) => !post.draft).flatMap((post) => post.tags),
    );
    const draftOnly = [
      ...new Set(
        drafts
          .flatMap((post) => post.tags)
          .filter((tag) => !publishedTags.has(tag)),
      ),
    ];
    expect(draftOnly.length).toBeGreaterThan(0);

    const home = await page.goto("/");
    expect(home?.status()).toBe(200);
    const homeHrefs = await hrefsOf(page);

    for (const draft of drafts) {
      expect(homeHrefs.some((href) => href.includes(draft.slug))).toBe(false);
    }

    const names = await publishedTagNames(
      page,
      posts.filter((post) => !post.draft).map((post) => post.slug),
    );
    for (const tag of names) {
      const response = await page.goto(`/tags/${tag}/`);
      expect(response?.status()).toBe(200);
      const tagHrefs = await hrefsOf(page);
      for (const draft of drafts) {
        expect(tagHrefs.some((href) => href.includes(draft.slug))).toBe(false);
      }
    }

    for (const tag of draftOnly) {
      expect(names).not.toContain(tag);
      const response = await page.goto(`/tags/${tag}/`);
      expect(response?.status()).toBe(404);
    }

    for (const listPath of ["/blog/", "/artigos/", "/prototipos/"]) {
      const response = await page.goto(listPath);
      expect(response?.status(), listPath).toBe(200);
      const listHrefs = await hrefsOf(page);
      for (const draft of drafts) {
        expect(listHrefs.some((href) => href.includes(draft.slug))).toBe(false);
      }
    }

    for (const catalogPath of ["/", "/mais-votados/"]) {
      const response = await page.goto(catalogPath);
      expect(response?.status(), catalogPath).toBe(200);
      const catalog = page.locator('script[type="application/json"]');
      await expect(catalog).toHaveCount(1);
      const text = (await catalog.textContent()) ?? "";
      for (const draft of drafts) {
        expect(text).not.toContain(draft.slug);
      }
    }

    for (const draft of drafts) {
      const response = await page.goto(`/blog/${draft.slug}/`);
      expect(response?.status()).toBe(404);
    }

    const rss = await page.request.get("/rss.xml");
    expect(rss.status()).toBe(200);
    const rssText = await rss.text();
    for (const draft of drafts) {
      expect(rssText).not.toContain(draft.slug);
    }

    const sitemap = await page.request.get("/sitemap-index.xml");
    expect(sitemap.status()).toBe(200);
    let sitemapText = await sitemap.text();
    const indexLocs = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => match[1] ?? "",
    );
    for (const loc of indexLocs) {
      const child = await page.request.get(new URL(loc).pathname);
      expect(child.status()).toBe(200);
      sitemapText += await child.text();
    }
    for (const draft of drafts) {
      expect(sitemapText).not.toContain(draft.slug);
    }
  });
});
