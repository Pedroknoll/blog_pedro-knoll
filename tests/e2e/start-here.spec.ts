import { expect, test } from "@playwright/test";

test("página Comece aqui [RF-14]", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const response = await page.goto("/comece-aqui/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("Comece aqui");

  const lists = page.locator("[data-reading-list]");
  expect(await lists.count()).toBeGreaterThan(0);
  const items = lists.locator(":scope > li");
  expect(await items.count()).toBeGreaterThan(0);

  const links = lists.getByRole("link");
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const href = await links.nth(index).getAttribute("href");
    expect(href).toMatch(/^\/blog\/[a-z0-9-]+\/$|^https:\/\//);
  }

  const mainLinks = page.locator("main a");
  const mainCount = await mainLinks.count();
  for (let index = 0; index < mainCount; index += 1) {
    const href = (await mainLinks.nth(index).getAttribute("href")) ?? "";
    expect(href).not.toContain("github.com");
  }

  const overflows = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});
