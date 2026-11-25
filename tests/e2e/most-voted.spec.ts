import { expect, test, type Page } from "@playwright/test";

const PIXELS_TO_SIGNIFICANCE = 3;
const WIDTHS = [360, 1280] as const;

function fulfillVotes(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

const votes = {
  "fixture-md": 4,
  "fixture-sem-titulos": 3,
  "fixture-mdx": 1,
  "fixture-formulas": 1,
  "2026-10-como-o-blog-e-feito": 1,
  "2026-10-por-que-este-blog": 1,
};

async function settle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      }),
  );
}

test.describe("mais votados [RF-01, RF-02]", () => {
  test("h1 com o fogo", async ({ page }) => {
    const response = await page.goto("/mais-votados/");
    expect(response?.status()).toBe(200);
    const h1 = page.getByRole("heading", {
      level: 1,
      name: "Mais votados",
      exact: true,
    });
    await expect(h1).toHaveCount(1);
    const icon = h1.locator("svg");
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon).toHaveCSS("width", "24px");
    await expect(icon).toHaveCSS("height", "24px");
  });

  test("lista inteira com voto e nenhum voto", async ({ page }) => {
    await page.route("**/api/votes", async (route) => {
      await route.fulfill(fulfillVotes({ votes }));
    });
    await page.goto("/mais-votados/");
    const items = page.locator("[data-ranking] article");
    await expect(items).toHaveCount(6);
    await expect(items.locator("h2 a").first()).toHaveAttribute(
      "href",
      "/blog/fixture-md/",
    );
    const count = await items.count();
    for (let index = 0; index < count; index += 1) {
      const value = items.nth(index).locator("[data-vote-value]");
      await expect(value).toHaveText(/^[1-9]\d*$/);
    }
    await expect(items.nth(0).locator("[data-vote-value]")).toHaveText("4");
    await expect(items.nth(0).locator("[data-vote-word]")).toHaveText("votos");
    await expect(items.nth(0).locator("[data-reading]")).toContainText(
      /\d+ minutos?/,
    );
    const words = await items
      .filter({
        has: page.locator("[data-vote-value]", { hasText: /^1$/ }),
      })
      .locator("[data-vote-word]")
      .allTextContents();
    expect(words.length).toBeGreaterThan(0);
    expect(words.every((word) => word === "voto")).toBe(true);

    await page.unrouteAll({ behavior: "ignoreErrors" });
    await page.route("**/api/votes", async (route) => {
      await route.fulfill(fulfillVotes({ votes: {} }));
    });
    await page.goto("/mais-votados/");
    await expect(page.locator("main")).toContainText("Nenhum voto ainda.");
    await expect(page.locator("[data-ranking] article")).toHaveCount(0);
  });

  test("o GET no topo não move o h1", async ({ page }) => {
    for (const width of WIDTHS) {
      await test.step(`${width}px`, async () => {
        await page.unrouteAll({ behavior: "ignoreErrors" });
        let release = () => {};
        const gate = new Promise<void>((resolve) => {
          release = resolve;
        });
        let open = false;
        await page.route("**/api/votes", async (route) => {
          if (!open) await gate;
          await route.fulfill(fulfillVotes({ votes }));
        });
        await page.setViewportSize({ width, height: 800 });
        await page.goto("/mais-votados/");
        await expect(page.locator("main")).toContainText(
          "O ranking precisa de JavaScript.",
        );
        await page.evaluate(() => document.fonts.ready);
        const h1 = page.getByRole("heading", { level: 1 });
        const before = await h1.evaluate(
          (element) => element.getBoundingClientRect().top,
        );
        open = true;
        release();
        await expect(page.locator("[data-ranking] article")).not.toHaveCount(0);
        await settle(page);
        const after = await h1.evaluate(
          (element) => element.getBoundingClientRect().top,
        );
        expect(Math.abs(after - before)).toBeLessThan(PIXELS_TO_SIGNIFICANCE);
      });
    }
  });

  test("com a página rolada, o footer desce com a lista", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let open = false;
    await page.route("**/api/votes", async (route) => {
      if (!open) await gate;
      await route.fulfill(fulfillVotes({ votes }));
    });
    await page.goto("/mais-votados/");
    const footer = page.getByRole("contentinfo");
    await footer.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    const before = await footer.evaluate(
      (element) => element.getBoundingClientRect().top,
    );
    open = true;
    release();
    await expect(page.locator("[data-ranking] article")).not.toHaveCount(0);
    await settle(page);
    const after = await footer.evaluate(
      (element) => element.getBoundingClientRect().top,
    );
    expect(after - before).toBeGreaterThan(PIXELS_TO_SIGNIFICANCE);
  });
});

test.describe("mais votados sem JavaScript [RF-01]", () => {
  test.use({ javaScriptEnabled: false });

  test("só o aviso", async ({ page }) => {
    const response = await page.goto("/mais-votados/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toContainText(
      "O ranking precisa de JavaScript.",
    );
    await expect(page.locator("[data-ranking] article")).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText("Nenhum voto ainda.");
  });
});
