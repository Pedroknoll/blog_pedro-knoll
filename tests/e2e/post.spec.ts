import { expect, test } from "@playwright/test";

import { publishedPosts, titlePostsOnPage } from "./published-posts";
import { authorName, notFoundHeading } from "./site-literals";

test.describe("página do post [RF-04]", () => {
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
        await expect(header.getByText(authorName, { exact: true })).toHaveText(
          authorName,
        );

        const times = header.locator("time");
        const timeCount = await times.count();
        expect([1, 2]).toContain(timeCount);
        for (let index = 0; index < timeCount; index += 1) {
          const time = times.nth(index);
          await expect(time).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
          await expect(time).toHaveText(
            /^\d{2}\.(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\.\d{4}$/,
          );
        }
        await expect(
          header.getByText("Atualizado em", { exact: true }),
        ).toHaveCount(timeCount - 1);

        await expect(header.getByText(/^\d+ min de leitura$/)).toHaveCount(1);

        await expect(
          page.getByRole("navigation", { name: "Sumário", exact: true }),
        ).toHaveCount(0);
      });
    }
  });

  test("rotas inexistentes respondem 404", async ({ page }) => {
    for (const path of ["/blog/nao-existe/", "/exemplo-md/", "/exemplo-mdx/"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: notFoundHeading,
          exact: true,
        }),
      ).toHaveCount(1);
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
