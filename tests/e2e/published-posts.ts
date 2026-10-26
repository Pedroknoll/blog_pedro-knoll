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

  const nav = page.getByRole("navigation", {
    name: "Filtrar por tag",
    exact: true,
  });
  await expect(nav).toHaveCount(1);
  const hrefs = await nav
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  const tag = hrefs.find((href) => href?.startsWith("/tags/"));
  expect(tag, "a TagFilter não tem link de tag").toBeTruthy();

  return ["/", ...posts.map((post) => post.href), tag as string];
}
