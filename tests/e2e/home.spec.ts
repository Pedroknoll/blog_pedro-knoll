import { expect, test } from "@playwright/test";

import { notFoundHeading } from "./site-literals";

const featuredHref = "/blog/2026-10-por-que-este-blog/";

test.describe("home [RF-01, RF-03]", () => {
  test("destaque com um heading, capa eager e sem style", async ({ page }) => {
    await page.goto("/");

    const destaque = page.getByRole("region", {
      name: "Destaque",
      exact: true,
    });
    await expect(destaque.getByRole("heading")).toHaveCount(1);

    const link = destaque.getByRole("heading").getByRole("link");
    await expect(link).toHaveAttribute("href", featuredHref);

    const img = destaque.locator("img");
    await expect(img).toHaveCount(1);
    await expect(img).toHaveAttribute("width", /^\d+$/);
    await expect(img).toHaveAttribute("height", /^\d+$/);
    await expect(img).toHaveAttribute("src", /\/_astro\/.+\.webp$/);
    await expect(img).toHaveAttribute("loading", "eager");
    await expect(img).not.toHaveAttribute("style");
  });

  test("grade com 1 a 12 cards e pelo menos um sem imagem", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = page
      .getByRole("list", { name: "Posts", exact: true })
      .locator(":scope > li");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(12);

    const hrefs: string[] = [];
    let cardsWithoutImage = 0;
    for (const card of await cards.all()) {
      const link = card.locator("h2").getByRole("link");
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", /^\/blog\/[a-z0-9-]+\/$/);
      hrefs.push((await link.getAttribute("href")) ?? "");

      const time = card.locator("time");
      await expect(time).toHaveCount(1);
      await expect(time).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
      await expect(time).toHaveText(
        /^\d{2}\.(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\.\d{4}$/,
      );

      if ((await card.locator("img").count()) === 0) {
        cardsWithoutImage += 1;
      }
    }

    expect(cardsWithoutImage).toBeGreaterThan(0);
    expect(hrefs).not.toContain(featuredHref);
  });

  test("/page/1/ responde 404", async ({ page }) => {
    const response = await page.goto("/page/1/");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: notFoundHeading,
        exact: true,
      }),
    ).toHaveCount(1);
  });
});
