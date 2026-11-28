import { expect, test, type Page } from "@playwright/test";

import { fixtureMdx } from "./fixtures";
import { GISCUS_STUB_HEIGHT, stubGiscus } from "./giscus";

// Comentários pelo Giscus (RF-19, T-28, BRAND §9.14). O iframe de
// giscus.app é trocado por um stub (`./giscus.ts`): nenhum teste depende da
// rede. O stub manda o resizeHeight e guarda a última mensagem que recebe.

function comments(page: Page) {
  return page.locator("[data-post-comments]");
}

function frame(page: Page) {
  return comments(page).locator("iframe");
}

async function received(page: Page): Promise<unknown> {
  const child = page
    .frames()
    .find((item) => item.url().startsWith("https://giscus.app/"));
  if (!child) return null;
  return child.evaluate(() => {
    const raw = document.body.dataset.received;
    return raw ? (JSON.parse(raw) as unknown) : null;
  });
}

test.describe("comentários [RF-19]", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/votes", (route) => route.abort());
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("seção depois dos relacionados, sem pedido a giscus.app no carregamento", async ({
    page,
  }) => {
    const requests: string[] = [];
    await stubGiscus(page, requests);
    const response = await page.goto(fixtureMdx.href);
    expect(response?.status()).toBe(200);

    const section = comments(page);
    await expect(
      section.getByRole("heading", { level: 2, name: "/ COMENTÁRIOS" }),
    ).toBeAttached();
    const after = await page.evaluate(() => {
      const related = document.querySelector("[data-post-related]");
      const own = document.querySelector("[data-post-comments]");
      if (!related || !own) return false;
      return Boolean(
        related.compareDocumentPosition(own) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(after).toBe(true);

    await page.waitForTimeout(500);
    await expect(frame(page)).toHaveCount(0);
    expect(requests).toEqual([]);
  });

  test("ao rolar, o iframe nasce com o widget do post e cresce pelo resizeHeight", async ({
    page,
  }) => {
    const requests: string[] = [];
    await stubGiscus(page, requests);
    await page.goto(fixtureMdx.href);
    await comments(page).scrollIntoViewIfNeeded();

    await expect(frame(page)).toHaveCount(1);
    await expect(frame(page)).toHaveAttribute("title", "Comentários");
    const src = new URL((await frame(page).getAttribute("src")) ?? "");
    expect(src.origin).toBe("https://giscus.app");
    expect(src.pathname).toBe("/pt/widget");
    expect(src.searchParams.get("term")).toBe("fixture-mdx");
    expect(src.searchParams.get("strict")).toBe("1");
    expect(src.searchParams.get("reactionsEnabled")).toBe("0");
    expect(src.searchParams.get("theme")).toBe("noborder_light");
    expect(src.searchParams.get("repoId")).toBeTruthy();
    expect(src.searchParams.get("categoryId")).toBeTruthy();
    expect(src.searchParams.has("session")).toBe(false);

    await expect
      .poll(() => frame(page).evaluate((element) => element.style.height))
      .toBe(`${GISCUS_STUB_HEIGHT}px`);
    expect(requests).toHaveLength(1);
  });

  test("trocar para a lua manda o tema escuro ao widget", async ({ page }) => {
    await stubGiscus(page);
    await page.goto(fixtureMdx.href);
    await comments(page).scrollIntoViewIfNeeded();
    await expect
      .poll(() => frame(page).evaluate((element) => element.style.height))
      .toBe(`${GISCUS_STUB_HEIGHT}px`);

    await page
      .getByRole("group", { name: "Tema" })
      .getByRole("button", { name: "Escuro" })
      .click();
    await expect
      .poll(() => received(page))
      .toEqual({ giscus: { setConfig: { theme: "noborder_dark" } } });
  });

  test("a sessão do login sai da URL e vai para o widget", async ({ page }) => {
    await stubGiscus(page);
    await page.goto(`${fixtureMdx.href}?giscus=abc`);
    await expect.poll(() => page.url()).not.toContain("giscus=");
    expect(
      await page.evaluate(() => localStorage.getItem("giscus-session")),
    ).toBe('"abc"');

    await comments(page).scrollIntoViewIfNeeded();
    await expect(frame(page)).toHaveCount(1);
    const src = new URL((await frame(page).getAttribute("src")) ?? "");
    expect(src.searchParams.get("session")).toBe("abc");
    expect(src.searchParams.get("origin")).toBe(
      new URL(fixtureMdx.href, page.url()).href,
    );
  });
});

test.describe("comentários sem JavaScript [RF-19]", () => {
  test.use({ javaScriptEnabled: false });

  test("aviso com o link das Discussions", async ({ page }) => {
    await page.goto(fixtureMdx.href);
    const section = comments(page);
    await expect(
      section.getByText("Os comentários precisam de JavaScript."),
    ).toBeVisible();
    await expect(
      section.getByRole("link", { name: "GitHub Discussions" }),
    ).toHaveAttribute(
      "href",
      /^https:\/\/github\.com\/Pedroknoll\/blog_pedro-knoll\/discussions\//,
    );
    await expect(frame(page)).toHaveCount(0);
  });
});
