import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { diskPosts, tagsOf, type DiskPost } from "./disk-posts";
import { fixtureFormulas, fixtureTag, fixtureTagMath } from "./fixtures";

const PIXELS = 3;
const WIDTHS = [360, 1280] as const;

function countText(shown: number, total: number, one: string, many: string) {
  const word = total === 1 ? one : many;
  return shown === total ? `${total} ${word}` : `${shown} de ${total} ${word}`;
}

function fulfillVotes(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

function hrefOf(slug: string) {
  return `/blog/${slug}/`;
}

async function visibleHrefs(page: Page, list: string) {
  return page
    .locator(`${list} :is(h2, h3) a:visible`)
    .evaluateAll((nodes) => nodes.map((anchor) => anchor.getAttribute("href")));
}

async function optionValues(page: Page) {
  return page
    .getByLabel("Filtrar por")
    .locator("option")
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLOptionElement).value),
    );
}

async function seriousAxe(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(blocking.map((violation) => violation.id)).toEqual([]);
}

async function point(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, left: rect.left };
  });
}

test("o filtro aparece nas quatro listas [RF-02]", async ({ page }) => {
  const posts = diskPosts();
  const articles = posts.filter((post) => post.kind === "article");
  const prototypes = posts.filter((post) => post.kind === "prototype");
  const cases: { path: string; tags: string[] }[] = [
    { path: "/blog/", tags: tagsOf(posts) },
    { path: "/artigos/", tags: tagsOf(articles) },
    { path: "/prototipos/", tags: tagsOf(prototypes) },
    { path: "/mais-votados/", tags: tagsOf(posts) },
  ];

  for (const item of cases) {
    await test.step(item.path, async () => {
      const response = await page.goto(item.path);
      expect(response?.status()).toBe(200);
      const select = page.getByLabel("Filtrar por");
      await expect(select).toHaveCount(1);
      await expect(select).toHaveCSS("height", "44px");
      await expect(select).toHaveCSS("font-size", "16px");
      await expect(select.locator("option")).toHaveText([
        "Todas as tags",
        ...item.tags,
      ]);
      await seriousAxe(page);
    });
  }

  for (const path of ["/", `/tags/${fixtureTag}/`]) {
    await page.goto(path);
    await expect(page.getByLabel("Filtrar por")).toHaveCount(0);
  }
});

test("filtrar /blog/ grava a tag e volta ao total [RF-02]", async ({
  page,
}) => {
  const posts = diskPosts();
  const fixtures = posts.filter((post) => post.tags.includes(fixtureTag));
  expect(fixtures).toHaveLength(4);
  await page.goto("/blog/");
  const select = page.getByLabel("Filtrar por");
  await expect(select).toBeEnabled();
  const before = await page.evaluate(() => history.length);
  await select.selectOption(fixtureTag);
  await expect(page).toHaveURL(/\/blog\/\?tag=fixture$/);
  expect(await visibleHrefs(page, "[data-listing]")).toEqual(
    fixtures.map((post) => hrefOf(post.slug)),
  );
  await expect(page.locator("[data-count]")).toHaveText(
    countText(fixtures.length, posts.length, "post", "posts"),
  );
  await select.selectOption("");
  await expect(page).toHaveURL(/\/blog\/$/);
  expect(await visibleHrefs(page, "[data-listing]")).toEqual(
    posts.map((post) => hrefOf(post.slug)),
  );
  await expect(page.locator("[data-count]")).toHaveText(
    countText(posts.length, posts.length, "post", "posts"),
  );
  expect(await page.evaluate(() => history.length)).toBe(before);
});

test("a contagem de /artigos/ e de /prototipos/ usa o substantivo [RF-02]", async ({
  page,
}) => {
  const posts = diskPosts();
  const articles = posts.filter((post) => post.kind === "article");
  const prototypes = posts.filter((post) => post.kind === "prototype");
  const withFixture = articles.filter((post) => post.tags.includes(fixtureTag));
  expect(prototypes).toHaveLength(1);
  expect(withFixture.length).toBeGreaterThan(0);
  expect(withFixture.length).toBeLessThan(articles.length);

  await page.goto("/artigos/");
  await expect(page.locator("[data-count]")).toHaveText(
    countText(articles.length, articles.length, "artigo", "artigos"),
  );
  await page.getByLabel("Filtrar por").selectOption(fixtureTag);
  await expect(page.locator("[data-count]")).toHaveText(
    countText(withFixture.length, articles.length, "artigo", "artigos"),
  );

  await page.goto("/prototipos/");
  await expect(page.locator("[data-count]")).toHaveText(
    countText(prototypes.length, prototypes.length, "protótipo", "protótipos"),
  );
  await page.getByLabel("Filtrar por").selectOption(fixtureTag);
  await expect(page.locator("[data-count]")).toHaveText("1 protótipo");
});

test("a URL escolhe a tag e uma tag inválida sai [RF-02]", async ({ page }) => {
  const posts = diskPosts();
  const math = posts.filter((post) => post.tags.includes(fixtureTagMath));
  expect(math.map((post) => post.slug)).toEqual(["fixture-formulas"]);

  await page.goto(`/blog/?tag=${fixtureTagMath}`);
  await expect(page.getByLabel("Filtrar por")).toHaveValue(fixtureTagMath);
  expect(await visibleHrefs(page, "[data-listing]")).toEqual([
    fixtureFormulas.href,
  ]);

  await page.goto("/blog/?tag=nao-existe");
  await expect(page).toHaveURL(/\/blog\/$/);
  await expect(page.getByLabel("Filtrar por")).toHaveValue("");
  expect(await visibleHrefs(page, "[data-listing]")).toEqual(
    posts.map((post) => hrefOf(post.slug)),
  );
});

test("o filtro de /mais-votados/ usa as tags do ranking [RF-02]", async ({
  page,
}) => {
  const posts = diskPosts();
  const quiet = posts.find((post) => post.tags.includes(fixtureTagMath));
  expect(quiet?.slug).toBe("fixture-formulas");
  const votes: Record<string, number> = { "slug-desconhecido": 9 };
  for (const post of posts) {
    votes[post.slug] = post.slug === quiet?.slug ? 0 : 1;
  }
  const voted = posts.filter((post) => (votes[post.slug] ?? 0) >= 1);
  const onlyMd = voted.filter((post) => post.tags.includes("md"));
  expect(onlyMd).toHaveLength(1);
  expect(tagsOf(voted)).not.toContain(fixtureTagMath);

  await page.route("**/api/votes", async (route) => {
    await route.fulfill(fulfillVotes({ votes }));
  });
  await page.goto("/mais-votados/");
  const select = page.getByLabel("Filtrar por");
  await expect(select).toBeEnabled();
  const values = await optionValues(page);
  expect(values[0]).toBe("");
  expect(values.slice(1)).toEqual(tagsOf(voted));
  expect(values).not.toContain(fixtureTagMath);

  await select.selectOption("md");
  expect(await visibleHrefs(page, "[data-ranking]")).toEqual([
    hrefOf(onlyMd[0]?.slug ?? ""),
  ]);
  await expect(page.locator("[data-count]")).toHaveText(
    countText(1, voted.length, "post", "posts"),
  );

  await page.goto(`/mais-votados/?tag=${fixtureTagMath}`);
  await expect(page).toHaveURL(/\/mais-votados\/$/);
  await expect(select).toHaveValue("");
  expect(await visibleHrefs(page, "[data-ranking]")).toEqual(
    voted.map((post) => hrefOf(post.slug)),
  );
});

test("sem voto e com a API falhando o select continua desabilitado [RF-02]", async ({
  page,
}) => {
  await page.route("**/api/votes", async (route) => {
    await route.fulfill(fulfillVotes({ votes: {} }));
  });
  await page.goto("/mais-votados/");
  const select = page.getByLabel("Filtrar por");
  await expect(page.locator("main")).toContainText("Nenhum voto ainda.");
  await expect(select).toBeDisabled();
  await expect(select).toHaveCSS("height", "44px");
  expect(await optionValues(page)).toContain(fixtureTagMath);
  await expect(page.locator("[data-count]")).toHaveText("");

  await page.unrouteAll({ behavior: "ignoreErrors" });
  await page.route("**/api/votes", async (route) => {
    await route.fulfill(fulfillVotes({ error: "no" }, 500));
  });
  const failed = page.waitForResponse(
    (response) => response.url().includes("/api/votes"),
    { timeout: 5_000 },
  );
  await page.goto("/mais-votados/");
  await failed;
  await expect(page.locator("main")).toContainText(
    "O ranking precisa de JavaScript.",
  );
  await expect(page.getByLabel("Filtrar por")).toBeDisabled();
  await expect(page.locator("[data-count]")).toHaveText("");
});

test.describe("filtro sem JavaScript [RF-02]", () => {
  test.use({ javaScriptEnabled: false });

  test("select desabilitado, lista inteira e links de /tags/", async ({
    page,
  }) => {
    const posts = diskPosts();
    const groups: {
      path: string;
      posts: DiskPost[];
      noun: [string, string];
    }[] = [
      { path: "/blog/", posts, noun: ["post", "posts"] },
      {
        path: "/artigos/",
        posts: posts.filter((post) => post.kind === "article"),
        noun: ["artigo", "artigos"],
      },
      {
        path: "/prototipos/",
        posts: posts.filter((post) => post.kind === "prototype"),
        noun: ["protótipo", "protótipos"],
      },
    ];
    for (const group of groups) {
      await test.step(group.path, async () => {
        await page.goto(group.path);
        await expect(page.getByLabel("Filtrar por")).toBeDisabled();
        await expect(page.locator("[data-listing] article")).toHaveCount(
          group.posts.length,
        );
        await expect(page.locator("[data-count]")).toHaveText(
          countText(group.posts.length, group.posts.length, ...group.noun),
        );
        const tags = tagsOf(group.posts);
        expect(tags.length).toBeGreaterThan(0);
        for (const tag of tags) {
          await expect(page.locator(`a[href="/tags/${tag}/"]`)).toHaveCount(1);
        }
        const link = page.locator(`a[href="/tags/${tags[0]}/"]`);
        await expect(link).toHaveCSS("font-size", "12px");
        await expect(link).toHaveCSS("min-height", "44px");
        await expect(link).toHaveCSS("text-transform", "uppercase");
      });
    }
  });

  test("em /mais-votados/ só o aviso", async ({ page }) => {
    await page.goto("/mais-votados/");
    await expect(page.getByLabel("Filtrar por")).toBeDisabled();
    await expect(page.locator("main")).toContainText(
      "O ranking precisa de JavaScript.",
    );
    await expect(page.locator('a[href^="/tags/"]')).toHaveCount(0);
    await expect(page.locator("[data-ranking] article")).toHaveCount(0);
  });
});

test("o select e a contagem ficam no lugar [RF-02]", async ({
  page,
  browser,
  baseURL,
}) => {
  const posts = diskPosts();
  const votes: Record<string, number> = {};
  for (const post of posts) votes[post.slug] = 1;
  const paths = [
    "/blog/",
    `/blog/?tag=${fixtureTagMath}`,
    "/artigos/",
    "/prototipos/",
    "/mais-votados/",
    `/mais-votados/?tag=${fixtureTagMath}`,
  ];

  for (const width of WIDTHS) {
    for (const path of paths) {
      await test.step(`${width}px ${path}`, async () => {
        await page.unrouteAll({ behavior: "ignoreErrors" });
        if (path.startsWith("/mais-votados")) {
          await page.route("**/api/votes", async (route) => {
            await route.fulfill(fulfillVotes({ votes }));
          });
        }
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        if (path === `/blog/?tag=${fixtureTagMath}`) {
          await expect(page.getByLabel("Filtrar por")).toHaveValue(
            fixtureTagMath,
          );
        }
        if (path.startsWith("/mais-votados")) {
          await expect(page.locator("[data-ranking] article")).not.toHaveCount(
            0,
          );
        }
        await page.evaluate(() => document.fonts.ready);
        const withJs = {
          select: await point(page, "#filtro-tag"),
          count: await point(page, "[data-count]"),
        };

        const plain = await browser.newContext({
          baseURL,
          javaScriptEnabled: false,
          viewport: { width, height: 800 },
        });
        const plainPage = await plain.newPage();
        await plainPage.goto(path);
        await plainPage.evaluate(() => document.fonts.ready);
        const without = {
          select: await point(plainPage, "#filtro-tag"),
          count: await point(plainPage, "[data-count]"),
        };
        await plain.close();

        expect(Math.abs(withJs.select.top - without.select.top)).toBeLessThan(
          PIXELS,
        );
        expect(Math.abs(withJs.select.left - without.select.left)).toBeLessThan(
          PIXELS,
        );
        expect(Math.abs(withJs.count.top - without.count.top)).toBeLessThan(
          PIXELS,
        );
        expect(Math.abs(withJs.count.left - without.count.left)).toBeLessThan(
          PIXELS,
        );
      });
    }
  }
});
