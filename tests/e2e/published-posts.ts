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

    const next = page
      .getByRole("navigation", { name: "Paginação", exact: true })
      .getByRole("link", { name: "Próxima", exact: true });
    if ((await next.count()) === 0) break;
    await next.click();
  }

  expect(posts.length).toBeGreaterThan(0);
  return posts;
}
