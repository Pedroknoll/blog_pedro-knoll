import { expect, type Locator, type Page, test } from "@playwright/test";

const postHref = /^\/blog\/[a-z0-9-]+\/$/;

type PublishedPost = {
  href: string;
  title: string;
};

function normalize(text: string | null) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

async function titlePostsOnPage(page: Page): Promise<PublishedPost[]> {
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

async function publishedPosts(page: Page): Promise<PublishedPost[]> {
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

async function bodyHeadings(article: Locator) {
  return article.locator("h2, h3").evaluateAll((elements) =>
    elements
      .filter(
        (element) =>
          element.closest("header") === null && element.closest("nav") === null,
      )
      .map((element) => ({
        tag: element.tagName,
        id: element.id,
        text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
      })),
  );
}

test.describe("página do post [RF-04, RF-05]", () => {
  test("invariantes de cada post publicado", async ({ page }) => {
    const posts = await publishedPosts(page);

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);

        const header = page.getByRole("article").locator("header");
        await expect(header).toHaveCount(1);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(header.locator("h1")).toHaveCount(1);
        await expect(header.locator("h1")).toHaveText(post.title);
        await expect(header.getByText("Seu Nome", { exact: true })).toHaveText(
          "Seu Nome",
        );

        const times = header.locator("time");
        const timeCount = await times.count();
        expect([1, 2]).toContain(timeCount);
        for (let index = 0; index < timeCount; index += 1) {
          const time = times.nth(index);
          await expect(time).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
          await expect(time).toHaveText(/^\d{1,2} de .+ de \d{4}$/);
        }
        await expect(
          header.getByText("Atualizado em", { exact: true }),
        ).toHaveCount(timeCount - 1);

        await expect(header.getByText(/^\d+ min de leitura$/)).toHaveCount(1);

        const article = page.getByRole("article");
        const toc = page.getByRole("main").getByRole("navigation", {
          name: "Sumário",
          exact: true,
        });
        await expect(toc.locator("h1, h2, h3, h4, h5, h6")).toHaveCount(0);

        const headings = await bodyHeadings(article);
        if (headings.length === 0) {
          await expect(toc).toHaveCount(0);
        } else {
          const links = toc.getByRole("link");
          await expect(links).toHaveCount(headings.length);
          for (const [index, heading] of headings.entries()) {
            expect(heading.id).not.toBe("");
            const link = links.nth(index);
            await expect(link).toHaveText(heading.text);
            await expect(link).toHaveAttribute("href", `#${heading.id}`);
            await expect(article.locator(`[id="${heading.id}"]`)).toHaveCount(
              1,
            );
          }

          let h3AfterH2 = 0;
          let seenH2 = false;
          for (const heading of headings) {
            if (heading.tag === "H2") seenH2 = true;
            if (heading.tag === "H3" && seenH2) h3AfterH2 += 1;
          }
          expect(await toc.locator("li li a").count()).toBe(h3AfterH2);
        }

        await expect(header.locator('a[href*="/tags/"]')).toHaveCount(0);
      });
    }
  });

  test("rotas inexistentes respondem 404", async ({ page }) => {
    for (const path of ["/blog/nao-existe/", "/exemplo-md/", "/exemplo-mdx/"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
    }
  });

  test("o primeiro post da home abre a página dele", async ({ page }) => {
    await page.goto("/");
    const [post] = await titlePostsOnPage(page);
    expect(post).toBeDefined();
    if (!post) return;
    await page
      .getByRole("heading")
      .getByRole("link", { name: post.title, exact: true })
      .click();
    await expect(page).toHaveURL(post.href);
    await expect(page.locator("h1")).toHaveText(post.title);
  });
});
