import { expect, test, type Page } from "@playwright/test";

import { fixtureMdx, fixtureSemTitulos } from "./fixtures";

// Índice do post (RF-26, T-129, BRAND §9.3). Os cenários da §11 na
// `fixture-mdx` (4 h2) e na `fixture-sem-titulos` (nenhum h2).

// Chrome conta o ponto se ele muda pelo menos 3 px (https://wicg.github.io/layout-instability).
const PIXELS_TO_SIGNIFICANCE = 3;

function toc(page: Page) {
  return page.getByRole("navigation", { name: "Neste artigo" });
}

function proseH2(page: Page) {
  return page.locator("article [data-pagefind-body] h2");
}

async function open(page: Page, href: string, width = 1280) {
  await page.setViewportSize({ width, height: 800 });
  const response = await page.goto(href);
  expect(response?.status()).toBe(200);
}

async function tops(page: Page) {
  return page.evaluate(() => {
    const h2 = document.querySelector("article [data-pagefind-body] h2");
    const nav = document.querySelector("[data-post-toc]");
    if (!h2 || !nav) throw new Error("sem h2 ou sem índice");
    return {
      h2: h2.getBoundingClientRect().top + scrollY,
      nav: nav.getBoundingClientRect().top + scrollY,
    };
  });
}

async function resolveColor(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, token);
}

async function scrollToHeading(page: Page, index: number) {
  await proseH2(page)
    .nth(index)
    .evaluate((element) => {
      scrollTo({
        top: element.getBoundingClientRect().top + scrollY - 40,
        behavior: "instant",
      });
    });
}

test.describe("índice do post [RF-26, RNF-01]", () => {
  test.describe("sem JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("índice sem JavaScript", async ({ page }) => {
      await open(page, fixtureMdx.href);
      const nav = toc(page);
      await expect(nav).toBeVisible();

      const headings = proseH2(page);
      await expect(headings).toHaveCount(4);
      const links = nav.getByRole("link");
      await expect(links).toHaveCount(4);
      for (let index = 0; index < 4; index += 1) {
        const heading = headings.nth(index);
        const id = await heading.getAttribute("id");
        expect(id).toBeTruthy();
        await expect(links.nth(index)).toHaveAttribute("href", `#${id}`);
        await expect(links.nth(index)).toContainText(
          (await heading.textContent())?.trim() ?? "",
        );
      }
      await expect(nav.locator("[aria-current]")).toHaveCount(0);
      await expect(nav.locator("[data-toc-percent]")).toHaveText("");
    });
  });

  test("o índice não desloca o texto", async ({ browser, page }) => {
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJs.newPage();
    await open(staticPage, fixtureMdx.href);
    const before = await tops(staticPage);
    await noJs.close();

    await open(page, fixtureMdx.href);
    await expect(toc(page).locator("[data-toc-percent]")).toHaveText(/%$/);
    const after = await tops(page);
    expect(Math.abs(after.h2 - before.h2)).toBeLessThan(PIXELS_TO_SIGNIFICANCE);
    expect(Math.abs(after.nav - before.nav)).toBeLessThan(
      PIXELS_TO_SIGNIFICANCE,
    );

    // O 600 do item ativo não muda a altura de nenhum item.
    const items = toc(page).locator("li");
    const heights = () =>
      items.evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().height),
      );
    const idle = await heights();
    for (let index = 0; index < 4; index += 1) {
      await scrollToHeading(page, index);
      await expect(toc(page).getByRole("link").nth(index)).toHaveAttribute(
        "aria-current",
        "location",
      );
      expect(await heights()).toEqual(idle);
    }
  });

  test("post sem índice", async ({ page }) => {
    await open(page, fixtureSemTitulos.href);
    await expect(page.locator("article h2")).toHaveCount(0);
    await expect(toc(page)).toHaveCount(0);
    await expect(page.locator("[data-post-toc]")).toHaveCount(0);
  });

  test("começa na altura do texto, abaixo do filete; some abaixo de lg", async ({
    page,
  }) => {
    await open(page, fixtureMdx.href);
    const nav = await page.locator("[data-post-toc]").boundingBox();
    const prose = await page
      .locator("article [data-pagefind-body]")
      .boundingBox();
    const header = await page.locator("[data-post-header]").boundingBox();
    if (!nav || !prose || !header) throw new Error("sem caixa");
    expect(Math.abs(nav.y - prose.y)).toBeLessThanOrEqual(1.5);
    expect(nav.y).toBeGreaterThan(header.y + header.height);
    expect(nav.x + nav.width).toBeLessThan(prose.x);

    await open(page, fixtureMdx.href, 360);
    await expect(page.locator("[data-post-toc]")).toBeHidden();
  });

  test("progresso e seção ativa ao rolar", async ({ page }) => {
    await open(page, fixtureMdx.href);
    const nav = toc(page);
    const percent = nav.locator("[data-toc-percent]");
    await expect(percent).toHaveText("0%");
    await expect(nav.locator("[aria-current]")).toHaveCount(0);

    await scrollToHeading(page, 1);
    const links = nav.getByRole("link");
    await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
    await expect(nav.locator("[aria-current]")).toHaveCount(1);
    await expect(percent).toHaveText(/^([1-9]\d?|100)%$/);
    // A barra desenhada tem a largura da porcentagem (±2 px).
    const drawn = await nav.evaluate((element) => {
      const bar = element.querySelector("[data-toc-bar]");
      const fill = element.querySelector("[data-toc-fill]");
      const text = element.querySelector("[data-toc-percent]")?.textContent;
      if (!bar || !fill || !text) throw new Error("sem barra");
      return {
        bar: bar.getBoundingClientRect().width,
        fill: fill.getBoundingClientRect().width,
        percent: Number.parseInt(text, 10),
      };
    });
    expect(drawn.fill).toBeGreaterThan(0);
    expect(
      Math.abs(drawn.fill - (drawn.bar * drawn.percent) / 100),
    ).toBeLessThanOrEqual(2 + drawn.bar / 200);

    const sheet = await resolveColor(page, "--color-sheet");
    const active = links.nth(1);
    await expect(active).toHaveCSS("background-color", sheet);
    await expect(active.locator("[data-toc-title]")).toHaveCSS(
      "font-weight",
      "600",
    );
    await expect(links.nth(0).locator("[data-toc-title]")).toHaveCSS(
      "font-weight",
      "400",
    );

    await page.evaluate(() =>
      scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      }),
    );
    await expect(percent).toHaveText("100%");
    await expect(links.nth(3)).toHaveAttribute("aria-current", "location");
  });

  test("rolagem suave só sem prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await open(page, fixtureMdx.href);
    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "smooth");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await open(page, fixtureSemTitulos.href);
    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  });

  test("forma: rótulo, números e minutos", async ({ page }) => {
    await open(page, fixtureMdx.href);
    const nav = toc(page);
    const label = nav.locator("[data-toc-label]");
    await expect(label).toHaveText("/ NESTE ARTIGO");
    await expect(label).toHaveCSS("font-size", "12px");
    await expect(nav.locator("[data-toc-percent]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    const numbers = nav.locator("[data-toc-number]");
    await expect(numbers).toHaveText(["01", "02", "03", "04"]);
    const ink = await resolveColor(page, "--color-ink");
    await expect(label).toHaveCSS("color", ink);
    await expect(nav.locator("[data-toc-fill]")).toHaveCSS(
      "background-color",
      ink,
    );
    await expect(nav.locator("[data-toc-bar]")).toHaveCSS("height", "2px");
    await expect(nav.locator("[data-toc-minutes]")).toHaveText(
      /^\d+ minutos? de leitura$/,
    );
    await expect(nav.locator("[data-toc-reading] svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
