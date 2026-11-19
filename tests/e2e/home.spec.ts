import { expect, test } from "@playwright/test";

import { fixtureSemTitulos } from "./fixtures";
import { notFoundHeading } from "./site-literals";

test.describe("home [RF-01, RF-03]", () => {
  test("lista sem destaque, sem capa e com a fixture de 2099 em primeiro", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("region", { name: "Destaque", exact: true }),
    ).toHaveCount(0);

    const cards = page
      .getByRole("list", { name: "Posts", exact: true })
      .locator(":scope > li");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(12);
    await expect(page.locator("article img")).toHaveCount(0);

    const hrefs: string[] = [];
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
      await expect(card.locator("img")).toHaveCount(0);
    }

    expect(hrefs[0]).toBe(fixtureSemTitulos.href);
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
