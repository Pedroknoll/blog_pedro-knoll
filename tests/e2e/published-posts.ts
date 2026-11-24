import { expect, type Page } from "@playwright/test";

const postHref = /^\/blog\/[a-z0-9-]+\/$/;

export type PublishedPost = {
  href: string;
  title: string;
};

function normalize(text: string | null) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

export function isPostPath(path: string): boolean {
  return postHref.test(path);
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
  const response = await page.goto("/blog/");
  expect(response?.status()).toBe(200);
  const posts = await titlePostsOnPage(page);
  expect(posts.length).toBeGreaterThan(0);
  return posts;
}

export async function pagesForTheme(page: Page): Promise<string[]> {
  const posts = await publishedPosts(page);

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

  const paths = ["/", ...posts.map((post) => post.href), tag, "/blog/"];
  expect(paths[0]).toBe("/");
  for (const post of posts) {
    expect(isPostPath(post.href)).toBe(true);
  }
  expect(tag).toMatch(/^\/tags\/[a-z0-9-]+\/$/);
  expect(paths.at(-1)).toBe("/blog/");
  return paths;
}
