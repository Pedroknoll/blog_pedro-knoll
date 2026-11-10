import fs from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { KIND_LABELS, KINDS } from "../../src/lib/kind";
import { kindPath } from "./site-literals";

test.describe("Notebook marimo inline [RF-08, RNF-03]", () => {
  test.fixme("leitor abre post com notebook", async () => {
    throw new Error("Cenário da SPEC §11 ainda não implementado.");
  });

  test.fixme("post sem notebook não carrega runtime", async () => {
    throw new Error("Cenário da SPEC §11 ainda não implementado.");
  });

  test.fixme("fences sem declaração", async () => {
    throw new Error("Cenário da SPEC §11 ainda não implementado.");
  });

  test.fixme("inline com src", async () => {
    throw new Error("Cenário da SPEC §11 ainda não implementado.");
  });
});

test.describe("Notebook pesado [RF-08, RNF-09]", () => {
  test.fixme("export desatualizado", async () => {
    throw new Error("Cenário da SPEC §11 ainda não implementado.");
  });

  test.fixme("notebook pesado em modo inline", async () => {
    throw new Error("Cenário da SPEC §11 ainda não implementado.");
  });

  test.fixme("leitor interage com notebook cacheado", async () => {
    throw new Error("Cenário da SPEC §11 ainda não implementado.");
  });
});

test.describe("CSP por rota [RNF-06, RNF-07]", () => {
  test.fixme("rota sem notebook", async () => {
    throw new Error("Cenário da SPEC §11 ainda não implementado.");
  });

  test.fixme("rota com notebook", async () => {
    throw new Error("Cenário da SPEC §11 ainda não implementado.");
  });
});

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
    const destaque = page.getByRole("region", {
      name: "Destaque",
      exact: true,
    });
    await expect(destaque).toHaveCount(1);
    const destaqueHref = await destaque
      .locator("a")
      .first()
      .getAttribute("href");

    for (const draft of drafts) {
      expect(homeHrefs.some((href) => href.includes(draft.slug))).toBe(false);
      expect(destaqueHref ?? "").not.toContain(draft.slug);
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

    const homeAgain = await page.goto("/");
    expect(homeAgain?.status()).toBe(200);
    const nav = page.getByRole("navigation", {
      name: "Filtrar por tipo",
      exact: true,
    });
    await expect(nav).toHaveCount(1);

    const publishedKinds = new Set(
      posts.filter((post) => !post.draft).map((post) => post.kind),
    );
    const draftOnlyKinds = KINDS.filter(
      (kind) =>
        drafts.some((post) => post.kind === kind) && !publishedKinds.has(kind),
    );
    expect(draftOnlyKinds.length).toBeGreaterThan(0);
    for (const kind of draftOnlyKinds) {
      await expect(
        nav.getByRole("link", { name: KIND_LABELS[kind] }),
      ).toHaveCount(0);
    }
    for (const kind of draftOnlyKinds) {
      const response = await page.goto(kindPath(kind));
      expect(response?.status(), kindPath(kind)).toBe(404);
    }

    for (const kind of KINDS) {
      if (!publishedKinds.has(kind)) continue;
      const tipo = kindPath(kind);
      const response = await page.goto(tipo);
      expect(response?.status(), tipo).toBe(200);
      const typeHrefs = await hrefsOf(page);
      for (const draft of drafts) {
        expect(typeHrefs.some((href) => href.includes(draft.slug))).toBe(false);
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
