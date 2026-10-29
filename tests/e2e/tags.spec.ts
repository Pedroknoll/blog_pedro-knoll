import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  nextPageLink,
  publishedPosts,
  titlePostsOnPage,
  type PublishedPost,
} from "./published-posts";

type TaggedPost = PublishedPost & { tags: string[] };

function normalize(text: string | null) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function byName(left: string, right: string) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function uniqueTags(posts: readonly TaggedPost[]) {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const post of posts) {
    for (const tag of post.tags) {
      if (seen.has(tag)) continue;
      seen.add(tag);
      tags.push(tag);
    }
  }
  return tags;
}

function slugFrom(href: string) {
  const match = /^\/blog\/([a-z0-9-]+)\/$/.exec(href);
  if (!match?.[1]) {
    throw new Error(`href sem slug: ${href}`);
  }
  return match[1];
}

// O chip é um span até a implementação e um link da lista "Tags" depois.
// O texto é o mesmo, então E3, E4 e E6 abrem /tags/<tag>/ já neste commit.
async function chipNames(page: Page) {
  const header = page.getByRole("article").locator("header");
  await expect(header).toHaveCount(1);
  const label = header.getByText("Tags", { exact: true });
  if ((await label.count()) === 0) return [];

  const chips = label.locator("..").locator("span, li a");
  const names: string[] = [];
  const count = await chips.count();
  for (let index = 0; index < count; index += 1) {
    const text = normalize(await chips.nth(index).textContent());
    if (text) names.push(text);
  }
  return names;
}

async function publishedPostsWithTags(page: Page): Promise<TaggedPost[]> {
  const posts = await publishedPosts(page);
  const tagged: TaggedPost[] = [];
  for (const post of posts) {
    const response = await page.goto(post.href);
    expect(response?.status()).toBe(200);
    tagged.push({ ...post, tags: await chipNames(page) });
  }
  expect(tagged.flatMap((post) => post.tags).length).toBeGreaterThan(0);
  return tagged;
}

test("E1 tags do post são links [RF-02]", async ({ page }) => {
  const posts = await publishedPosts(page);
  let linkCount = 0;

  for (const post of posts) {
    const response = await page.goto(post.href);
    expect(response?.status()).toBe(200);

    const links = page
      .getByRole("list", { name: "Tags", exact: true })
      .getByRole("link");
    const count = await links.count();
    for (let index = 0; index < count; index += 1) {
      const link = links.nth(index);
      const text = normalize(await link.textContent());
      await expect(link).toHaveAttribute("href", `/tags/${text}/`);
      linkCount += 1;
    }
  }

  expect(linkCount).toBeGreaterThan(0);
});

test("E2 nenhum card lista tags [RF-02]", async ({ page }) => {
  const home = await page.goto("/");
  expect(home?.status()).toBe(200);

  const paths = ["/"];
  for (;;) {
    const next = nextPageLink(page);
    if ((await next.count()) === 0) break;
    const href = await next.getAttribute("href");
    expect(href).toBeTruthy();
    const response = await page.goto(href ?? "");
    expect(response?.status()).toBe(200);
    paths.push(href ?? "");
  }

  await page.goto("/");
  const nav = page.getByRole("navigation", {
    name: "Filtrar por tag",
    exact: true,
  });
  await expect(nav).toHaveCount(1);
  const hrefs = await nav
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  const tags = hrefs.filter((href): href is string =>
    Boolean(href?.startsWith("/tags/")),
  );
  expect(tags.length).toBeGreaterThan(0);

  for (const path of [...paths, ...tags]) {
    await test.step(path, async () => {
      const response = await page.goto(path ?? "");
      expect(response?.status()).toBe(200);
      await expect(
        page
          .locator("article")
          .getByRole("list", { name: "Tags", exact: true }),
      ).toHaveCount(0);
    });
  }
});

test("E3 página de tag existe [RF-02]", async ({ page }) => {
  const tagged = await publishedPostsWithTags(page);

  for (const tag of uniqueTags(tagged)) {
    const response = await page.goto(`/tags/${tag}/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(`Tag: ${tag}`);
  }
});

test("E4 página de tag lista os posts na ordem de publicação [RF-02]", async ({
  page,
}) => {
  const tagged = await publishedPostsWithTags(page);

  for (const tag of uniqueTags(tagged)) {
    const expected = tagged
      .filter((post) => post.tags.includes(tag))
      .map((post) => post.href);
    const response = await page.goto(`/tags/${tag}/`);
    expect(response?.status()).toBe(200);

    const titles = await titlePostsOnPage(page);
    const hrefs = titles.map((post) => post.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs).toHaveLength(expected.length);
    expect([...hrefs].sort(byName)).toEqual([...expected].sort(byName));

    const cards = page
      .getByRole("list", { name: "Posts", exact: true })
      .locator(":scope > li");
    expect(await cards.count()).toBe(hrefs.length);

    const rows: { datetime: string; slug: string }[] = [];
    for (let index = 0; index < hrefs.length; index += 1) {
      const href = hrefs[index];
      if (!href) throw new Error("link de título ausente");
      const time = cards.nth(index).locator("time");
      await expect(time).toHaveCount(1);
      const datetime = await time.getAttribute("datetime");
      expect(datetime, `card sem time datetime: ${href}`).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
      if (!datetime) throw new Error(`card sem time datetime: ${href}`);
      rows.push({ datetime, slug: slugFrom(href) });
    }

    for (let index = 1; index < rows.length; index += 1) {
      const previous = rows[index - 1];
      const current = rows[index];
      if (!previous || !current) {
        throw new Error("linha de ordem ausente");
      }
      expect(current.datetime <= previous.datetime).toBe(true);
      if (current.datetime === previous.datetime) {
        expect(current.slug > previous.slug).toBe(true);
      }
    }
  }
});

test("E5 tag inexistente responde 404 [RF-02]", async ({ page }) => {
  const response = await page.goto("/tags/tag-que-nao-existe/");
  expect(response?.status()).toBe(404);
});

test("E6 página de tag sem script e com um h1 fora do banner [RF-02]", async ({
  page,
}) => {
  const tagged = await publishedPostsWithTags(page);

  for (const tag of uniqueTags(tagged)) {
    await test.step(tag, async () => {
      const response = await page.goto(`/tags/${tag}/`);
      expect(response?.status()).toBe(200);

      const banner = page.getByRole("banner");
      await expect(banner).toHaveCount(1);
      await expect(banner.locator("h1")).toHaveCount(0);
      await expect(
        page.locator('script:not([type="application/ld+json"])'),
      ).toHaveCount(0);

      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical",
      );
      expect(blocking.map((violation) => violation.id)).toEqual([]);
    });
  }
});

test("E7 barra de filtro por tag [RF-02]", async ({ page }) => {
  const tagged = await publishedPostsWithTags(page);
  const expected = [...uniqueTags(tagged)].sort(byName);

  const home = await page.goto("/");
  expect(home?.status()).toBe(200);
  const homeNav = page.getByRole("navigation", {
    name: "Filtrar por tag",
    exact: true,
  });
  await expect(homeNav).toHaveCount(1);

  const homeLinks = homeNav.getByRole("link");
  await expect(homeLinks.first()).toHaveText("Todos");
  await expect(homeLinks.first()).toHaveAttribute("href", "/");
  await expect(homeLinks.first()).toHaveAttribute("aria-current", "true");

  const homeCount = await homeLinks.count();
  expect(homeCount).toBe(expected.length + 1);
  const names: string[] = [];
  for (let index = 1; index < homeCount; index += 1) {
    const link = homeLinks.nth(index);
    const text = normalize(await link.textContent());
    names.push(text);
    await expect(link).toHaveAttribute("href", `/tags/${text}/`);
    await expect(link).not.toHaveAttribute("aria-current");
  }
  expect(names).toEqual(expected);

  for (const tag of expected) {
    const response = await page.goto(`/tags/${tag}/`);
    expect(response?.status()).toBe(200);
    const nav = page.getByRole("navigation", {
      name: "Filtrar por tag",
      exact: true,
    });
    await expect(nav).toHaveCount(1);
    const current = nav.locator('a[aria-current="true"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText(tag);
    await expect(current).toHaveAttribute("href", `/tags/${tag}/`);
  }

  for (const post of tagged) {
    const response = await page.goto(post.href);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(
      page.getByRole("navigation", { name: "Filtrar por tag", exact: true }),
    ).toHaveCount(0);
  }
});
