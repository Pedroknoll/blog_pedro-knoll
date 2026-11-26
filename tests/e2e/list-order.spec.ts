import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { diskPosts, type DiskPost } from "./disk-posts";
import { fixtureTag } from "./fixtures";

// Ordenação das listas inteiras (T-133, RF-02, BRAND §9.2): um select nativo
// `Ordenar por` à direita do rótulo `/ LISTAGEM`, com `Mais recentes` (o
// padrão, a ordem do HTML), `Mais antigos` e `Mais votados`, gravado em
// `?ordem=`. O rótulo tem a fonte e o tamanho do link das faixas da home; o
// select não tem caixa. Sem controle em /mais-votados/.

const TAG_PAGE = `/tags/${fixtureTag}/`;
const WIDTHS = [360, 1280] as const;

function tagged(): DiskPost[] {
  return diskPosts().filter((post) => post.tags.includes(fixtureTag));
}

function hrefOf(slug: string) {
  return `/blog/${slug}/`;
}

function votesBody(votes: Record<string, number>, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: status === 200 ? JSON.stringify({ votes }) : "{}",
  };
}

async function visibleHrefs(page: Page) {
  return page
    .locator("[data-listing] h3 a:visible")
    .evaluateAll((nodes) => nodes.map((anchor) => anchor.getAttribute("href")));
}

async function tokenColor(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.setProperty("color", `var(${name})`);
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
}

function byDateDesc(left: DiskPost, right: DiskPost) {
  if (left.date !== right.date) return left.date < right.date ? 1 : -1;
  return left.slug < right.slug ? -1 : left.slug > right.slug ? 1 : 0;
}

const ORDER_LABEL = "Ordenar por";

test.describe("ordenação das listas inteiras [RF-02]", () => {
  test("o controle fica à direita de / LISTAGEM, na mesma linha", async ({
    page,
  }) => {
    for (const path of ["/blog/", "/artigos/", "/prototipos/", TAG_PAGE]) {
      for (const width of WIDTHS) {
        await test.step(`${path} ${width}px`, async () => {
          await page.setViewportSize({ width, height: 800 });
          await page.goto(path);
          const section = page.locator("[data-list-section]");
          const select = section.getByLabel(ORDER_LABEL);
          await expect(select).toBeEnabled();
          await expect(select).toHaveValue("");
          const labels = await select
            .locator("option")
            .evaluateAll((nodes) =>
              nodes.map((node) => [
                (node as HTMLOptionElement).value,
                node.textContent?.trim(),
              ]),
            );
          expect(labels).toEqual([
            ["", "Mais recentes"],
            ["antigos", "Mais antigos"],
            ["votados", "Mais votados"],
          ]);
          // Sem caixa: sem borda, sem fundo, o valor em accent; 12 px de sm
          // em diante e 16 px abaixo (zoom do Safari no toque).
          await expect(select).toHaveCSS("border-top-width", "0px");
          await expect(select).toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)",
          );
          await expect(select).toHaveCSS("appearance", "none");
          await expect(select).toHaveCSS(
            "color",
            await tokenColor(page, "--color-accent"),
          );
          await expect(select).toHaveCSS(
            "font-size",
            width === 360 ? "16px" : "12px",
          );
          await expect(select).toHaveCSS("height", "44px");
          const label = section.locator("label");
          const heading2 = section.locator("h2");
          const mono = await heading2.evaluate(
            (node) => getComputedStyle(node).fontFamily,
          );
          await expect(select).toHaveCSS("font-family", mono);
          if (width === 1280) {
            await expect(label).toBeVisible();
            await expect(label).toHaveCSS("font-size", "12px");
            await expect(label).toHaveCSS("font-family", mono);
          }
          const heading = await section.locator("h2").boundingBox();
          const control = await select.boundingBox();
          const list = await page.locator("[data-listing]").boundingBox();
          if (!heading || !control || !list) throw new Error("sem caixa");
          expect(control.x).toBeGreaterThan(heading.x + heading.width);
          expect(control.x + control.width).toBeLessThanOrEqual(
            list.x + list.width + 1,
          );
          expect(control.y).toBeLessThan(heading.y + heading.height);
          expect(control.y + control.height).toBeGreaterThan(heading.y);
          expect(list.y).toBeGreaterThanOrEqual(control.y + control.height);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth,
          );
          expect(overflow).toBe(false);
        });
      }
    }
  });

  test("/mais-votados/ não tem o controle", async ({ page }) => {
    await page.goto("/mais-votados/");
    await expect(page.getByLabel(ORDER_LABEL)).toHaveCount(0);
  });

  test("escolher a ordem reordena e grava ?ordem=", async ({ page }) => {
    const posts = tagged();
    expect(posts.length).toBeGreaterThanOrEqual(3);
    await page.goto(TAG_PAGE);
    const select = page.getByLabel(ORDER_LABEL);
    await expect(select).toBeEnabled();
    expect(await visibleHrefs(page)).toEqual(
      posts.map((post) => hrefOf(post.slug)),
    );

    await select.focus();
    await select.selectOption("antigos");
    await expect(page).toHaveURL(/\/tags\/fixture\/\?ordem=antigos$/);
    const oldest = [...posts].reverse();
    expect(await visibleHrefs(page)).toEqual(
      oldest.map((post) => hrefOf(post.slug)),
    );
    await expect(select).toBeFocused();

    await select.selectOption("");
    await expect(page).toHaveURL(/\/tags\/fixture\/$/);
    expect(await visibleHrefs(page)).toEqual(
      posts.map((post) => hrefOf(post.slug)),
    );
  });

  test("a URL escolhe a ordem e um valor inválido sai", async ({ page }) => {
    const posts = tagged();
    await page.goto(`${TAG_PAGE}?ordem=antigos`);
    const select = page.getByLabel(ORDER_LABEL);
    await expect(select).toHaveValue("antigos");
    expect(await visibleHrefs(page)).toEqual(
      [...posts].reverse().map((post) => hrefOf(post.slug)),
    );

    await page.goto(`${TAG_PAGE}?ordem=curtos`);
    await expect(page).toHaveURL(/\/tags\/fixture\/$/);
    await expect(select).toHaveValue("");

    await page.goto(`${TAG_PAGE}?ordem=xyz`);
    await expect(page).toHaveURL(/\/tags\/fixture\/$/);
    await expect(select).toHaveValue("");
    expect(await visibleHrefs(page)).toEqual(
      posts.map((post) => hrefOf(post.slug)),
    );
  });

  test("mais votados usa os votos e, no empate, a data", async ({ page }) => {
    const posts = tagged();
    const [first, second, third] = posts;
    if (!first || !second || !third) throw new Error("poucas fixtures");
    const votes = { [third.slug]: 5, [second.slug]: 2, [first.slug]: 2 };
    await page.route("**/api/votes", async (route) => {
      await route.fulfill(votesBody(votes));
    });
    await page.goto(TAG_PAGE);
    const select = page.getByLabel(ORDER_LABEL);
    await expect(select.locator('option[value="votados"]')).toBeEnabled();
    await select.selectOption("votados");
    await expect(page).toHaveURL(/\?ordem=votados$/);
    const expected = [
      third,
      first,
      second,
      ...posts.filter((post) => !(post.slug in votes)),
    ];
    expect(await visibleHrefs(page)).toEqual(
      expected.map((post) => hrefOf(post.slug)),
    );

    await page.goto(`${TAG_PAGE}?ordem=votados`);
    await expect(select).toHaveValue("votados");
    expect(await visibleHrefs(page)).toEqual(
      expected.map((post) => hrefOf(post.slug)),
    );
  });

  test("com a API falhando, mais votados fica desabilitado e sai da URL", async ({
    page,
  }) => {
    const posts = tagged();
    await page.route("**/api/votes", async (route) => {
      await route.fulfill(votesBody({}, 500));
    });
    const failed = page.waitForResponse((response) =>
      response.url().includes("/api/votes"),
    );
    await page.goto(`${TAG_PAGE}?ordem=votados`);
    await failed;
    const select = page.getByLabel(ORDER_LABEL);
    await expect(page).toHaveURL(/\/tags\/fixture\/$/);
    await expect(select).toBeEnabled();
    await expect(select).toHaveValue("");
    await expect(select.locator('option[value="votados"]')).toBeDisabled();
    expect(await visibleHrefs(page)).toEqual(
      posts.map((post) => hrefOf(post.slug)),
    );
  });

  test("a ordem e o filtro convivem na URL de /blog/", async ({ page }) => {
    const posts = tagged();
    await page.goto(`/blog/?tag=${fixtureTag}&ordem=antigos`);
    await expect(page.getByLabel("Filtrar por")).toHaveValue(fixtureTag);
    await expect(page.getByLabel(ORDER_LABEL)).toHaveValue("antigos");
    expect(await visibleHrefs(page)).toEqual(
      [...posts].reverse().map((post) => hrefOf(post.slug)),
    );

    await page.getByLabel("Filtrar por").selectOption("");
    await expect(page).toHaveURL(/\/blog\/\?ordem=antigos$/);
    await page.getByLabel("Filtrar por").selectOption(fixtureTag);
    await expect(page).toHaveURL(
      new RegExp(`/blog/\\?ordem=antigos&tag=${fixtureTag}$`),
    );
    await page.getByLabel(ORDER_LABEL).selectOption("");
    await expect(page).toHaveURL(new RegExp(`/blog/\\?tag=${fixtureTag}$`));
    expect(await visibleHrefs(page)).toEqual(
      posts.map((post) => hrefOf(post.slug)),
    );
  });

  test("abrir com ?ordem= não desloca a página", async ({ page }) => {
    await page.goto(`${TAG_PAGE}?ordem=antigos`);
    await expect(page.getByLabel(ORDER_LABEL)).toHaveValue("antigos");
    const shift = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((entries) => {
            for (const entry of entries.getEntries()) {
              const shiftEntry = entry as PerformanceEntry & {
                value: number;
                hadRecentInput: boolean;
              };
              if (!shiftEntry.hadRecentInput) total += shiftEntry.value;
            }
          }).observe({ type: "layout-shift", buffered: true });
          setTimeout(() => resolve(total), 500);
        }),
    );
    expect(shift).toBeLessThan(0.01);
  });

  test("sem violações serious/critical do axe com o select", async ({
    page,
  }) => {
    await page.goto(`${TAG_PAGE}?ordem=antigos`);
    await expect(page.getByLabel(ORDER_LABEL)).toBeEnabled();
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );
    expect(blocking.map((violation) => violation.id)).toEqual([]);
  });
});

test.describe("ordenação sem JavaScript [RF-02]", () => {
  test.use({ javaScriptEnabled: false });

  test("select desabilitado e lista por data", async ({ page }) => {
    const posts = tagged();
    await page.goto(`${TAG_PAGE}?ordem=antigos`);
    const select = page.getByLabel(ORDER_LABEL);
    await expect(select).toBeDisabled();
    await expect(select).toHaveCSS("height", "44px");
    const hrefs = await page
      .locator("[data-listing] h3 a")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
    expect(hrefs).toEqual(
      [...posts].sort(byDateDesc).map((post) => hrefOf(post.slug)),
    );
  });
});
