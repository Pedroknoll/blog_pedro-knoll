import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const routes = ["/", "/blog/2026-10-como-o-blog-e-feito/"] as const;

async function open(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
}

for (const path of routes) {
  test.describe(`layout de ${path} [RNF-04, RNF-05]`, () => {
    test("html lang pt-BR", async ({ page }) => {
      await open(page, path);
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    });

    test("meta viewport presente", async ({ page }) => {
      await open(page, path);
      await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
    });

    test("title igual ao que a página passou", async ({ page }) => {
      await open(page, path);
      await expect(page).toHaveTitle("Blog");
    });

    test("exatamente um h1", async ({ page }) => {
      await open(page, path);
      await expect(page.locator("h1")).toHaveCount(1);
    });

    test("exatamente um banner", async ({ page }) => {
      await open(page, path);
      await expect(page.getByRole("banner")).toHaveCount(1);
    });

    test("exatamente um main com id conteudo", async ({ page }) => {
      await open(page, path);
      await expect(page.locator("main#conteudo")).toHaveCount(1);
    });

    test("exatamente um contentinfo", async ({ page }) => {
      await open(page, path);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
    });

    test("o primeiro Tab foca o link de pular", async ({ page }) => {
      await open(page, path);
      const link = page.getByRole("link", {
        name: "Pular para o conteúdo",
        exact: true,
      });
      await expect(link).toHaveCount(1);

      const before = await link.boundingBox();
      expect(before).not.toBeNull();
      expect(before?.width).toBeLessThanOrEqual(1);

      await page.keyboard.press("Tab");
      await expect(link).toBeFocused();
      await expect(link).toHaveAttribute("href", "#conteudo");

      const after = await link.boundingBox();
      expect(after).not.toBeNull();
      expect(after?.width).toBeGreaterThan(1);
    });

    test("nenhum h1 dentro do header", async ({ page }) => {
      await open(page, path);
      const banner = page.getByRole("banner");
      await expect(banner).toHaveCount(1);
      await expect(banner.locator("h1")).toHaveCount(0);
      await expect(page.getByRole("main").locator("h1")).toHaveCount(1);
    });

    test("link do header para / com o título do site", async ({ page }) => {
      await open(page, path);
      const home = page.getByRole("banner").getByRole("link", {
        name: "Nome do blog",
        exact: true,
      });
      await expect(home).toHaveAttribute("href", "/");
    });

    test("footer com o nome do autor", async ({ page }) => {
      await open(page, path);
      await expect(
        page.getByRole("contentinfo").getByText("Seu Nome", { exact: true }),
      ).toHaveText("Seu Nome");
    });

    test("axe sem violações serious nem critical", async ({ page }) => {
      await open(page, path);
      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical",
      );
      expect(blocking.map((violation) => violation.id)).toEqual([]);
    });

    test("nenhum script além de JSON-LD", async ({ page }) => {
      await open(page, path);
      await expect(
        page.locator('script:not([type="application/ld+json"])'),
      ).toHaveCount(0);
    });

    test("sem rolagem horizontal a 360 px", async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await open(page, path);
      const overflows = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(overflows).toBe(false);
    });
  });
}
