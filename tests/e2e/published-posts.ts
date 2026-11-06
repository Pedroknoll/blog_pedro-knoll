import { expect, type Page } from "@playwright/test";

const postHref = /^\/blog\/[a-z0-9-]+\/$/;

export type PublishedPost = {
  href: string;
  title: string;
};

function normalize(text: string | null) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

export async function titlePostsOnPage(page: Page): Promise<PublishedPost[]> {
  const posts: PublishedPost[] = [];
  const links = page.getByRole("heading").getByRole("link");
  const count = await links.count();
  for (let index = 0; index < count; index += 1) {
    const link = links.nth(index);
    const href = await link.getAttribute("href");
    if (!href || !postHref.test(href)) continue;
    posts.push({ href, title: normalize(await link.textContent()) });
  }
  return posts;
}

export function nextPageLink(page: Page) {
  return page
    .getByRole("navigation", { name: "Paginação", exact: true })
    .getByRole("link", { name: "Próxima", exact: true });
}

export async function publishedPosts(page: Page): Promise<PublishedPost[]> {
  const posts: PublishedPost[] = [];
  const seen = new Set<string>();
  await page.goto("/");

  for (;;) {
    for (const post of await titlePostsOnPage(page)) {
      if (seen.has(post.href)) continue;
      seen.add(post.href);
      posts.push(post);
    }

    const next = nextPageLink(page);
    if ((await next.count()) === 0) break;
    await next.click();
  }

  expect(posts.length).toBeGreaterThan(0);
  return posts;
}

export async function pagesForTheme(page: Page): Promise<string[]> {
  const posts = await publishedPosts(page);
  const home = await page.goto("/");
  expect(home?.status()).toBe(200);

  let tag: string | undefined;
  for (const post of posts) {
    const response = await page.goto(post.href);
    expect(response?.status(), post.href).toBe(200);
    const links = page
      .getByRole("list", { name: "Tags", exact: true })
      .getByRole("link");
    if ((await links.count()) === 0) continue;
    const href = await links.first().getAttribute("href");
    if (href && /^\/tags\/[a-z0-9-]+\/$/.test(href)) {
      tag = href;
      break;
    }
  }
  if (!tag) {
    throw new Error("nenhum post publicado tem lista Tags");
  }

  const back = await page.goto("/");
  expect(back?.status()).toBe(200);
  const nav = page.getByRole("navigation", {
    name: "Filtrar por tipo",
    exact: true,
  });
  await expect(nav).toHaveCount(1);
  const hrefs = await nav
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  const tipo = hrefs.find(
    (href): href is string =>
      typeof href === "string" && /^\/tipos\/[a-z0-9-]+\/$/.test(href),
  );
  if (!tipo) {
    throw new Error("a barra não tem link de tipo");
  }

  const paths = ["/", ...posts.map((post) => post.href), tag, tipo];
  expect(paths[0]).toBe("/");
  for (const post of posts) {
    expect(post.href).toMatch(/^\/blog\/[a-z0-9-]+\/$/);
  }
  expect(tag).toMatch(/^\/tags\/[a-z0-9-]+\/$/);
  expect(tipo).toMatch(/^\/tipos\/[a-z0-9-]+\/$/);
  return paths;
}
