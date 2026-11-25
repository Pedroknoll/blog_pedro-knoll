import { expect, test } from "@playwright/test";

import { readCspViolations, watchCsp } from "../e2e/csp";

test.describe("busca na CSP [RF-15, RNF-07]", () => {
  test("abrir e buscar na home não viola a CSP nem gera erro", async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });
    await watchCsp(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    await page
      .getByRole("banner")
      .getByRole("button", { name: /^Buscar (⌘K|Ctrl K)$/, exact: true })
      .click();
    const input = page.getByRole("dialog").locator('input[type="search"]');
    await expect(input).toBeFocused();
    await input.fill("teste");
    await expect(page.locator("pagefind-summary")).toHaveText(/resultado/, {
      timeout: 15_000,
    });

    expect(await readCspViolations(page)).toEqual([]);
    expect(errors).toEqual([]);
  });
});
