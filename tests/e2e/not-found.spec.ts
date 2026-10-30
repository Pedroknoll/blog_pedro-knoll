import { expect, test } from "@playwright/test";

import { notFoundHeading, notFoundIntro, titled } from "./site-literals";

test("página 404 [BRAND §10, RF-12]", async ({ page }) => {
  const response = await page.goto("/caminho-que-nao-existe/");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(titled("Página não encontrada"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: notFoundHeading,
      exact: true,
    }),
  ).toHaveCount(1);
  await expect(page.getByText(notFoundIntro, { exact: true })).toHaveCount(1);
  const back = page.getByRole("link", {
    name: "Voltar ao início",
    exact: true,
  });
  await expect(back).toHaveCount(1);
  await expect(back).toHaveAttribute("href", "/");
  const svg = page.locator('main svg[aria-hidden="true"]');
  await expect(svg).toHaveCount(1);
  await expect(svg).toContainText("nó não encontrado");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
});
