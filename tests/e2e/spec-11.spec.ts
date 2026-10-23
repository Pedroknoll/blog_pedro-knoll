import fs from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

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

async function filterNames(page: Page) {
  const nav = page.getByRole("navigation", {
    name: "Filtrar por tag",
    exact: true,
  });
  await expect(nav).toHaveCount(1);
  return (await nav.getByRole("link").allTextContents()).map((name) =>
    name.trim(),
  );
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

    const tags = (await filterNames(page)).filter((name) => name !== "Todos");
    for (const tag of tags) {
      const response = await page.goto(`/tags/${tag}/`);
      expect(response?.status()).toBe(200);
      const tagHrefs = await hrefsOf(page);
      for (const draft of drafts) {
        expect(tagHrefs.some((href) => href.includes(draft.slug))).toBe(false);
      }
    }

    await page.goto("/");
    const names = await filterNames(page);
    for (const tag of draftOnly) {
      expect(names).not.toContain(tag);
      const response = await page.goto(`/tags/${tag}/`);
      expect(response?.status()).toBe(404);
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

test.describe("Gráfico acessível [RF-09, RNF-04]", () => {
  test.fixme("leitor sem JavaScript", async () => {
    throw new Error("Cenário da SPEC §11 ainda não implementado.");
  });
});
