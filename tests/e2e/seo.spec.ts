import { expect, test, type Page } from "@playwright/test";

import { nextPageLink, publishedPosts } from "./published-posts";
import { authorName, homeTitle, titled } from "./site-literals";

function normalize(text: string | null) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

async function visit(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
}

async function tagNames(page: Page) {
  const nav = page.getByRole("navigation", {
    name: "Filtrar por tag",
    exact: true,
  });
  await expect(nav).toHaveCount(1);
  const links = nav.getByRole("link");
  const tags: string[] = [];
  const count = await links.count();
  for (let index = 0; index < count; index += 1) {
    const link = links.nth(index);
    const name = normalize(await link.textContent());
    if (name === "Todos") continue;
    await expect(link).toHaveAttribute("href", `/tags/${name}/`);
    tags.push(name);
  }
  return tags;
}

async function listingPagePaths(page: Page) {
  const paths: string[] = [];
  await page.goto("/");
  for (;;) {
    const next = nextPageLink(page);
    if ((await next.count()) === 0) break;
    const href = await next.getAttribute("href");
    if (!href || !/^\/page\/[0-9]+\/$/.test(href)) {
      throw new Error(`Próxima sem /page/n/: ${href}`);
    }
    paths.push(href);
    await next.click();
  }
  return paths;
}

async function discover(page: Page) {
  const posts = await publishedPosts(page);
  await page.goto("/");
  const tags = await tagNames(page);
  const pages = await listingPagePaths(page);
  const paths = [
    "/",
    ...posts.map((post) => post.href),
    ...tags.map((tag) => `/tags/${tag}/`),
    ...pages,
  ];
  return { posts, tags, pages, paths };
}

async function canonicalHref(page: Page) {
  const link = page.locator('link[rel="canonical"]');
  await expect(link).toHaveCount(1);
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();
  return href as string;
}

function sharedOrigin(href: string, origin: string) {
  const url = new URL(href);
  expect(url.origin).toBe(origin);
  expect(url.hostname).not.toBe("localhost");
  expect(url.hostname).not.toBe("127.0.0.1");
  return url;
}

async function metaContent(page: Page, property: string) {
  const meta = page.locator(`meta[property="${property}"]`);
  await expect(meta).toHaveCount(1);
  const content = await meta.getAttribute("content");
  expect(content).toBeTruthy();
  return content as string;
}

type Feed = {
  parserError: boolean;
  channelLink: string;
  language: string;
  items: { link: string; guid: string }[];
  atomSelf: string[];
};

async function readFeed(page: Page, source: string): Promise<Feed> {
  return page.evaluate((xml) => {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const channel = doc.querySelector("channel");
    let channelLink = "";
    let language = "";
    if (channel) {
      for (const child of channel.children) {
        if (child.localName === "link" && child.namespaceURI === null) {
          channelLink = child.textContent ?? "";
        }
        if (child.localName === "language" && child.namespaceURI === null) {
          language = child.textContent ?? "";
        }
      }
    }
    const items = [...doc.querySelectorAll("item")].map((item) => {
      let link = "";
      let guid = "";
      for (const child of item.children) {
        if (child.localName === "link" && child.namespaceURI === null) {
          link = child.textContent ?? "";
        }
        if (child.localName === "guid") guid = child.textContent ?? "";
      }
      return { link, guid };
    });
    const atomSelf = [
      ...doc.getElementsByTagNameNS("http://www.w3.org/2005/Atom", "link"),
    ]
      .filter((element) => element.getAttribute("rel") === "self")
      .map((element) => element.getAttribute("href") ?? "");
    return {
      parserError: doc.querySelector("parsererror") !== null,
      channelLink,
      language,
      items,
      atomSelf,
    };
  }, source);
}

async function locsOf(page: Page, source: string) {
  return page.evaluate((xml) => {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    return [...doc.getElementsByTagName("loc")].map((element) =>
      (element.textContent ?? "").trim(),
    );
  }, source);
}

test("E1 title [RF-12]", async ({ page }) => {
  const { paths } = await discover(page);

  for (const path of paths) {
    await visit(page, path);
    if (path === "/") {
      await expect(page).toHaveTitle(homeTitle);
      continue;
    }
    await expect(page.locator("h1")).toHaveCount(1);
    const heading = normalize(await page.locator("h1").innerText());
    await expect(page).toHaveTitle(titled(heading));
  }
});

test("E2 canonical [RF-12]", async ({ page }) => {
  const { paths } = await discover(page);
  await visit(page, "/");
  const homeCanonical = await canonicalHref(page);
  const origin = sharedOrigin(
    homeCanonical,
    new URL(homeCanonical).origin,
  ).origin;

  for (const path of paths) {
    await visit(page, path);
    const href = await canonicalHref(page);
    const url = sharedOrigin(href, origin);
    expect(url.pathname).toBe(path);
    expect(url.pathname.endsWith("/")).toBe(true);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      href,
    );
  }
});

test("E3 Open Graph [RF-12]", async ({ page }) => {
  const { paths } = await discover(page);
  let withImage = 0;
  let withoutImage = 0;

  for (const path of paths) {
    await visit(page, path);
    const isPost = path.startsWith("/blog/");
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      isPost ? "article" : "website",
    );
    await metaContent(page, "og:title");
    await metaContent(page, "og:description");
    await metaContent(page, "og:site_name");
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      "pt_BR",
    );

    const ogImage = page.locator('meta[property="og:image"]');
    if (!isPost) {
      await expect(ogImage).toHaveCount(0);
      continue;
    }

    const script = page.locator('script[type="application/ld+json"]');
    await expect(script).toHaveCount(1);
    const data = JSON.parse((await script.textContent()) ?? "") as {
      datePublished?: string;
      image?: string[];
    };
    await expect(
      page.locator('meta[property="article:published_time"]'),
    ).toHaveAttribute("content", data.datePublished ?? "");

    if (data.image === undefined) {
      await expect(ogImage).toHaveCount(0);
      withoutImage += 1;
      continue;
    }

    expect(data.image).toHaveLength(1);
    const imageUrl = data.image[0] ?? "";
    await expect(ogImage).toHaveCount(1);
    await expect(ogImage).toHaveAttribute("content", imageUrl);
    expect((await metaContent(page, "og:image:alt")).length).toBeGreaterThan(0);
    for (const property of ["og:image:width", "og:image:height"]) {
      const value = await metaContent(page, property);
      expect(value).toMatch(/^\d+$/);
      expect(Number.isInteger(Number(value))).toBe(true);
    }
    const imageResponse = await page.request.get(new URL(imageUrl).pathname);
    expect(imageResponse.status()).toBe(200);
    expect(imageResponse.headers()["content-type"] ?? "").toContain("image/");
    withImage += 1;
  }

  expect(withImage).toBeGreaterThan(0);
  expect(withoutImage).toBeGreaterThan(0);
});

test("E4 JSON-LD [RF-12]", async ({ page }) => {
  const { paths } = await discover(page);
  let withModified = 0;
  let withoutModified = 0;

  for (const path of paths) {
    await visit(page, path);
    await expect(page.locator("main")).toHaveCount(1);
    const script = page.locator('script[type="application/ld+json"]');
    if (!path.startsWith("/blog/")) {
      await expect(script).toHaveCount(0);
      continue;
    }

    await expect(script).toHaveCount(1);
    const data = JSON.parse((await script.textContent()) ?? "") as {
      "@type"?: string;
      headline?: string;
      url?: string;
      datePublished?: string;
      author?: { name?: string };
      dateModified?: string;
    };
    expect(data["@type"]).toBe("BlogPosting");
    expect(data.headline).toBe(normalize(await page.locator("h1").innerText()));
    expect(data.url).toBe(await canonicalHref(page));
    const datetime = await page
      .getByRole("article")
      .locator("time")
      .first()
      .getAttribute("datetime");
    expect(datetime).toBeTruthy();
    expect(String(data.datePublished).slice(0, 10)).toBe(
      String(datetime).slice(0, 10),
    );
    expect(data.author?.name).toBe(authorName);
    if ("dateModified" in data) withModified += 1;
    else withoutModified += 1;
  }

  expect(withModified).toBeGreaterThan(0);
  expect(withoutModified).toBeGreaterThan(0);
});

test("E5 RSS [RF-10]", async ({ page }) => {
  const response = await page.request.get("/rss.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"] ?? "").toContain("xml");

  const { posts } = await discover(page);
  await visit(page, "/");
  const homeCanonical = await canonicalHref(page);

  const feed = await readFeed(page, await response.text());
  expect(feed.parserError).toBe(false);
  expect(feed.items).toHaveLength(posts.length);
  expect(feed.channelLink).toBe(homeCanonical);
  expect(feed.language).toBe("pt-br");
  expect(feed.atomSelf.some((href) => href.endsWith("/rss.xml"))).toBe(true);

  const seen = new Set<string>();
  for (const item of feed.items) {
    expect(item.guid).toBe(item.link);
    const pathname = sharedOrigin(
      item.link,
      new URL(homeCanonical).origin,
    ).pathname;
    const post = posts.find((entry) => entry.href === pathname);
    expect(post).toBeTruthy();
    seen.add(pathname);
    await visit(page, pathname);
    expect(item.link).toBe(await canonicalHref(page));
  }
  expect([...seen].sort()).toEqual(posts.map((post) => post.href).sort());
});

test("E6 RSS e sitemap no head [RF-10]", async ({ page }) => {
  const { paths } = await discover(page);

  for (const path of paths) {
    await visit(page, path);
    const alternate = page.locator(
      'link[rel="alternate"][type="application/rss+xml"]',
    );
    await expect(alternate).toHaveCount(1);
    const href = await alternate.getAttribute("href");
    expect(href).toBeTruthy();
    const origin = new URL(await canonicalHref(page)).origin;
    const url = sharedOrigin(href as string, origin);
    expect(url.pathname).toBe("/rss.xml");
    await expect(page.locator('link[rel="sitemap"]')).toHaveAttribute(
      "href",
      "/sitemap-index.xml",
    );
  }
});

test("E7 sitemap [RF-10]", async ({ page }) => {
  const index = await page.request.get("/sitemap-index.xml");
  expect(index.status()).toBe(200);

  const { paths } = await discover(page);
  await visit(page, "/");
  const origin = new URL(await canonicalHref(page)).origin;
  const indexLocs = await locsOf(page, await index.text());
  expect(indexLocs.length).toBeGreaterThan(0);

  const found = new Set<string>();
  for (const loc of indexLocs) {
    const indexUrl = sharedOrigin(loc, origin);
    const child = await page.request.get(indexUrl.pathname);
    expect(child.status()).toBe(200);
    for (const childLoc of await locsOf(page, await child.text())) {
      const url = sharedOrigin(childLoc, origin);
      found.add(url.pathname);
      const response = await page.request.get(url.pathname);
      expect(response.status()).toBe(200);
      await visit(page, url.pathname);
      const canonical = new URL(await canonicalHref(page));
      expect(url.pathname).toBe(canonical.pathname);
    }
  }

  expect([...found].sort()).toEqual([...paths].sort());
});

test("E8 robots.txt [RF-10]", async ({ page }) => {
  const response = await page.request.get("/robots.txt");
  expect(response.status()).toBe(200);
  await visit(page, "/");
  const origin = new URL(await canonicalHref(page)).origin;
  const lines = (await response.text())
    .split(/\r?\n/)
    .filter((line) => line.startsWith("Sitemap:"));
  expect(lines).toEqual([`Sitemap: ${origin}/sitemap-index.xml`]);
});
