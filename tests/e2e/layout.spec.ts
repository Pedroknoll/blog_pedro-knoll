import { expect, test, type Page } from "@playwright/test";

import { fixtureMd } from "./fixtures";
import { isPostPath, pagesForTheme } from "./published-posts";
import { authorName, homeTitle, siteTitle, titled } from "./site-literals";

const routes = ["/", fixtureMd.href] as const;

const expectedTitle: Record<(typeof routes)[number], string> = {
  "/": homeTitle,
  [fixtureMd.href]: titled(fixtureMd.title),
};

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
      await expect(page).toHaveTitle(expectedTitle[path]);
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
        name: siteTitle,
        exact: true,
      });
      await expect(home).toHaveAttribute("href", "/");
    });

    test("footer com o nome do autor", async ({ page }) => {
      await open(page, path);
      await expect(
        page.getByRole("contentinfo").getByText(authorName, { exact: true }),
      ).toHaveText(authorName);
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

test("home, listas e tags só com o script do item [RNF-02]", async ({
  page,
}) => {
  for (const path of await pagesForTheme(page)) {
    await test.step(path, async () => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);

      const extra = page.locator('script:not([type="application/ld+json"])');
      if (!isPostPath(path)) {
        const executable = page.locator(
          'script:not([type="application/ld+json"]):not([type="application/json"])',
        );
        // Comece aqui repete o script do card: o script da busca no layout
        // impede o Astro de juntar os scripts que vêm do MDX. As listas
        // inteiras somam o módulo da ordenação (T-133): 3 na página de tag,
        // 4 em /blog/, com o do filtro.
        const scripts: Record<string, number> = {
          "/": 3,
          "/comece-aqui/": 3,
          "/blog/": 4,
        };
        await expect(executable).toHaveCount(
          scripts[path] ?? (path.startsWith("/tags/") ? 3 : 2),
        );
        await expect(
          page.locator('script[type="application/json"]'),
        ).toHaveCount(path === "/" ? 1 : 0);
        return;
      }
      const pres = await page.getByRole("article").locator("pre").count();
      // O post não tem mais o script do título na lateral (T-128). O índice
      // (T-129) soma um módulo no post com 2 h2 ou mais, e o bloco de voto e
      // compartilhar (T-130) soma um em todo post.
      const toc = (await page.locator("[data-post-toc]").count()) === 0 ? 0 : 1;
      const modules = (pres === 0 ? 3 : 4) + toc;
      await expect(page.locator('script[type="module"]')).toHaveCount(modules);

      const plain = page.locator("script:not([type])");
      const plainCount =
        (await page.locator("astro-island").count()) === 0 ? 0 : 2;
      await expect(plain).toHaveCount(plainCount);
      await expect(extra).toHaveCount(modules + plainCount);
      for (let index = 0; index < plainCount; index += 1) {
        await expect(plain.nth(index)).not.toHaveAttribute("src");
      }
    });
  }
});
