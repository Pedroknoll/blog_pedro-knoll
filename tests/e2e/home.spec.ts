import { expect, test, type Locator, type Page } from "@playwright/test";

import { diskPosts } from "./disk-posts";
import {
  fixtureFormulas,
  fixtureMd,
  fixtureMdx,
  fixtureSemTitulos,
} from "./fixtures";
import { homeGreeting } from "./site-literals";

const PIXELS_TO_SIGNIFICANCE = 3;
const WIDTHS = [360, 1280] as const;

const RECENT = "/ RECENTES";
const VOTED = "/ MAIS VOTADOS";
const PROTO = "/ PROTÓTIPOS";

type Box = { id: string; tag: string; classes: string; top: number };

function band(page: Page, label: string) {
  return page.locator("section").filter({
    has: page.getByRole("heading", { level: 2, name: label, exact: true }),
  });
}

function fulfillVotes(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

async function markVisible(page: Page): Promise<Box[]> {
  return page.evaluate(() => {
    const elements = [...document.querySelectorAll("body *")];
    const boxes: Box[] = [];
    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (!(rect.bottom > 0 && rect.top < innerHeight)) continue;
      const id = String(index);
      element.setAttribute("data-cls", id);
      boxes.push({
        id,
        tag: element.tagName,
        classes: element.getAttribute("class") ?? "",
        top: rect.top,
      });
    }
    return boxes;
  });
}

async function topsOf(page: Page, ids: string[]) {
  return page.evaluate((ids) => {
    return ids.map((id) => {
      const element = document.querySelector(`[data-cls="${id}"]`);
      return element ? element.getBoundingClientRect().top : null;
    });
  }, ids);
}

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

function linkName(total: number, one: string, many: string) {
  return total === 1 ? `O único ${one}` : `Todos os ${total} ${many}`;
}

async function visibleText(link: Locator) {
  return link.evaluate((node) => {
    const parts: string[] = [];
    const walk = (current: Node) => {
      if (current instanceof Element && current.classList.contains("sr-only")) {
        return;
      }
      if (current.nodeType === Node.TEXT_NODE) {
        parts.push(current.textContent ?? "");
        return;
      }
      for (const child of current.childNodes) walk(child);
    };
    walk(node);
    return parts.join("").replace(/\s+/g, " ").trim();
  });
}

async function tokenColor(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
}

async function expectBandLink(
  page: Page,
  label: string,
  href: string,
  visible: string,
  name: string,
) {
  const link = band(page, label).getByRole("link", { name, exact: true });
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute("href", href);
  expect(await visibleText(link)).toBe(visible);
  return link;
}

async function expectBandLinks(page: Page) {
  const posts = diskPosts();
  const prototypes = posts.filter((post) => post.kind === "prototype");
  const postsName = linkName(posts.length, "post", "posts");
  await expectBandLink(page, RECENT, "/blog/", `${postsName} →`, postsName);
  const prototypesName = linkName(prototypes.length, "protótipo", "protótipos");
  await expectBandLink(
    page,
    PROTO,
    "/prototipos/",
    `${prototypesName} →`,
    prototypesName,
  );
  await expectBandLink(
    page,
    VOTED,
    "/mais-votados/",
    "Ver ranking →",
    "Ver ranking",
  );
}

async function baselineGap(page: Page, label: string) {
  return band(page, label)
    .locator("h2")
    .evaluate((heading) => {
      const link = heading.parentElement?.querySelector("a");
      const probe = () => {
        const span = document.createElement("span");
        span.style.display = "inline-block";
        span.style.width = "0";
        span.style.height = "0";
        span.style.verticalAlign = "baseline";
        return span;
      };
      const left = probe();
      const right = probe();
      heading.append(left);
      link?.append(right);
      const gap =
        left.getBoundingClientRect().top - right.getBoundingClientRect().top;
      left.remove();
      right.remove();
      return link ? gap : Number.NaN;
    });
}

async function articleTops(page: Page) {
  return band(page, RECENT)
    .locator("article")
    .evaluateAll((articles) =>
      articles.map((article) => {
        const title = article.querySelector("h3")?.getBoundingClientRect();
        const box = article.getBoundingClientRect();
        return {
          top: box.top,
          height: box.height,
          title: title?.top ?? Number.NaN,
        };
      }),
    );
}

const NOW = new Date("2000-01-06T12:00:00.000Z");
const LATER = new Date("2030-01-01T12:00:00.000Z");

test.describe("home [RF-01]", () => {
  test("três faixas, 5 recentes e os protótipos", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: homeGreeting,
        exact: true,
      }),
    ).toHaveCount(1);
    await expect(page.locator("h2")).toHaveCount(3);
    for (const label of [RECENT, VOTED, PROTO]) {
      await expect(
        page.getByRole("heading", { level: 2, name: label, exact: true }),
      ).toHaveCount(1);
    }

    const recent = band(page, RECENT);
    const recentLinks = recent.locator("h3 a");
    await expect(recentLinks).toHaveCount(5);
    await expect(recentLinks.first()).toHaveAttribute(
      "href",
      fixtureSemTitulos.href,
    );
    await expect(recent.locator(`a[href="${fixtureMd.href}"]`)).toHaveCount(0);
    await expect(recent.locator("[data-vote-value]")).toHaveCount(0);
    await expect(recent.locator("img")).toHaveCount(0);

    const prototypes = band(page, PROTO);
    const prototypeLinks = prototypes.locator("h3 a");
    await expect(prototypeLinks).toHaveCount(1);
    await expect(prototypeLinks).toHaveAttribute("href", fixtureMd.href);
    await expect(prototypes.locator("time")).toHaveCount(0);
    await expect(prototypes.locator("[data-reading]")).toHaveCount(0);
    await expect(prototypes.locator("[data-vote-value]")).toHaveCount(0);
  });

  test("item de Protótipos: miniatura e descrição", async ({ page }) => {
    for (const width of WIDTHS) {
      await test.step(`${width}px`, async () => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto("/");
        const item = band(page, PROTO).locator("article").first();
        const thumb = item.locator("img");
        await expect(thumb).toHaveCount(1);
        await expect(thumb).toHaveAttribute("alt", "");
        await expect(thumb).toHaveAttribute("width", "72");
        await expect(thumb).toHaveAttribute("height", "54");
        await expect(thumb).toHaveCSS("object-fit", "cover");
        expect(await thumb.evaluate((node) => node.closest("a") === null)).toBe(
          true,
        );
        const box = await thumb.boundingBox();
        expect(Math.abs((box?.width ?? 0) - 72)).toBeLessThan(0.5);
        expect(Math.abs((box?.height ?? 0) - 54)).toBeLessThan(0.5);
        const title = await item.locator("h3").boundingBox();
        expect(
          (title?.x ?? 0) - ((box?.x ?? 0) + (box?.width ?? 0)),
        ).toBeGreaterThan(0);

        const description = item.locator("[data-description]");
        await expect(description).toHaveText(fixtureMd.description);
        await expect(description).toHaveCSS("-webkit-line-clamp", "2");
        const lines = await description.evaluate((node) => {
          const style = getComputedStyle(node);
          return (
            node.getBoundingClientRect().height /
            Number.parseFloat(style.lineHeight)
          );
        });
        expect(lines).toBeLessThanOrEqual(2.05);
      });
    }
  });

  test("item de Recentes: data, título e tempo, sem votos", async ({
    page,
  }) => {
    await page.goto("/");
    const items = band(page, RECENT).locator("article");
    await expect(items).toHaveCount(5);
    const pencil = await tokenColor(page, "--color-pencil");
    const count = await items.count();
    for (let index = 0; index < count; index += 1) {
      const item = items.nth(index);
      await expect(item.locator("time")).toHaveCount(1);
      await expect(item.locator("time")).toHaveText(/^\d{2}\.[a-z]{3}\.\d{4}$/);
      const reading = item.locator("[data-reading]");
      await expect(reading).toHaveCount(1);
      await expect(reading.locator("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      const shown = await visibleText(reading);
      expect(shown).toMatch(/^(1 minuto|(?:[02-9]|\d{2,}) minutos)$/);
      await expect(reading).toHaveText(`${shown} de leitura`, {
        useInnerText: false,
      });
      await expect(reading.locator(".sr-only")).toHaveText(" de leitura", {
        useInnerText: false,
      });
      await expect(reading).toHaveAttribute("title", `${shown} de leitura`);
      await expect(reading).toHaveCSS("color", pencil);
      await expect(reading).toHaveCSS("font-size", "12px");
      await expect(item.locator("[data-vote-value]")).toHaveCount(0);
      await expect(item.locator("[data-vote-word]")).toHaveCount(0);
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    const first = items.first();
    const layout = await first.evaluate((article) => {
      const date = article.querySelector("time")?.getBoundingClientRect();
      const title = article.querySelector("h3")?.getBoundingClientRect();
      const reading = article
        .querySelector("[data-reading]")
        ?.getBoundingClientRect();
      return {
        columns: getComputedStyle(article).gridTemplateColumns,
        dateRight: date?.right ?? Number.NaN,
        titleLeft: title?.left ?? Number.NaN,
        titleRight: title?.right ?? Number.NaN,
        readingLeft: reading?.left ?? Number.NaN,
      };
    });
    expect(layout.columns.split(" ")[0]).toBe("104px");
    expect(layout.dateRight).toBeLessThanOrEqual(layout.titleLeft);
    expect(layout.readingLeft).toBeGreaterThanOrEqual(layout.titleRight);

    await page.setViewportSize({ width: 360, height: 800 });
    const stacked = await first.evaluate((article) => {
      const date = article.querySelector("time")?.getBoundingClientRect();
      const title = article.querySelector("h3")?.getBoundingClientRect();
      const reading = article
        .querySelector("[data-reading]")
        ?.getBoundingClientRect();
      return {
        date: date?.bottom ?? Number.NaN,
        titleTop: title?.top ?? Number.NaN,
        titleBottom: title?.bottom ?? Number.NaN,
        reading: reading?.top ?? Number.NaN,
      };
    });
    expect(stacked.date).toBeLessThanOrEqual(stacked.titleTop);
    expect(stacked.titleBottom).toBeLessThanOrEqual(stacked.reading);
  });

  test("NOVO nos últimos 7 dias, sem deslocar a lista", async ({ page }) => {
    for (const width of WIDTHS) {
      await test.step(`${width}px`, async () => {
        await page.setViewportSize({ width, height: 800 });
        await page.clock.setFixedTime(NOW);
        await page.goto("/");
        const recent = band(page, RECENT);
        const novo = (href: string) =>
          recent.locator(`article:has(a[href="${href}"]) [data-novo]`);
        await expect(novo(fixtureFormulas.href)).toHaveText("NOVO");
        await expect(novo(fixtureMdx.href)).toHaveText("NOVO");
        await expect(novo(fixtureSemTitulos.href)).toHaveText("");
        await expect(recent.locator("[data-novo]")).toHaveCount(5);
        await expect(
          recent.locator("[data-novo]", { hasText: "NOVO" }),
        ).toHaveCount(2);
        const label = novo(fixtureMdx.href);
        await expect(label).toHaveCSS("font-size", "12px");
        await expect(label).toHaveCSS("text-transform", "uppercase");
        await expect(label).toHaveCSS(
          "color",
          await tokenColor(page, "--color-muted"),
        );
        expect(await label.evaluate((node) => node.closest("a") === null)).toBe(
          true,
        );
        const place = await label.evaluate((node) => {
          const date = node
            .closest("article")
            ?.querySelector("time")
            ?.getBoundingClientRect();
          const box = node.getBoundingClientRect();
          return {
            below: date ? box.top >= date.bottom - 0.5 : false,
            beside: date
              ? box.left >= date.right && Math.abs(box.top - date.top) < 4
              : false,
          };
        });
        if (width === 1280) expect(place.below).toBe(true);
        else expect(place.beside).toBe(true);
        await page.evaluate(() => document.fonts.ready);
        const withLabel = await articleTops(page);

        await page.clock.setFixedTime(LATER);
        await page.goto("/");
        await expect(
          recent.locator("[data-novo]", { hasText: "NOVO" }),
        ).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        const without = await articleTops(page);
        expect(without.length).toBe(withLabel.length);
        for (let index = 0; index < without.length; index += 1) {
          const a = withLabel[index];
          const b = without[index];
          if (!a || !b) continue;
          expect(Math.abs(a.top - b.top)).toBeLessThan(1);
          expect(Math.abs(a.height - b.height)).toBeLessThan(1);
          expect(Math.abs(a.title - b.title)).toBeLessThan(1);
        }
      });
    }
  });

  test("hover e foco: fundo sheet e título em accent, sem sublinhado", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const sheet = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.backgroundColor = "var(--color-sheet)";
      document.body.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    const accent = await tokenColor(page, "--color-accent");
    for (const label of [RECENT, PROTO]) {
      const items = band(page, label).locator("article");
      const item = items.first();
      const link = item.locator("h3 a");
      await expect(item).not.toHaveCSS("background-color", sheet);
      await item.hover();
      await expect(item).toHaveCSS("background-color", sheet);
      await expect(link).toHaveCSS("color", accent);
      await expect(link).toHaveCSS("text-decoration-line", "none");
      const opacities = await band(page, label)
        .locator("article")
        .evaluateAll((nodes) =>
          nodes.map((node) => getComputedStyle(node).opacity),
        );
      expect(opacities.every((value) => value === "1")).toBe(true);
      await page.mouse.move(0, 0);
      await expect(item).not.toHaveCSS("background-color", sheet);
      await link.focus();
      await expect(item).toHaveCSS("background-color", sheet);
      await expect(link).toHaveCSS("color", accent);
      await expect(link).toHaveCSS("text-decoration-line", "none");
      await link.blur();
    }
  });

  test("abaixo de sm, rótulo de 15 px, filete de 2 px e título de 20 px", async ({
    page,
  }) => {
    for (const [width, label, rule, title] of [
      [360, "15px", "2px", "20px"],
      [1280, "12px", "1px", "26px"],
    ] as const) {
      await test.step(`${width}px`, async () => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto("/");
        for (const name of [RECENT, VOTED, PROTO]) {
          const heading = band(page, name).locator("h2");
          await expect(heading).toHaveCSS("font-size", label);
          const border = await heading.evaluate(
            (node) =>
              getComputedStyle(node.parentElement as Element).borderBottomWidth,
          );
          expect(border).toBe(rule);
        }
        await expect(
          band(page, RECENT).locator("article h3").first(),
        ).toHaveCSS("font-size", title);
      });
    }
  });

  test("títulos e descrição menores nas colunas de lg em diante", async ({
    page,
  }) => {
    await page.route("**/api/votes", async (route) => {
      await route.fulfill(fulfillVotes({ votes: { "fixture-md": 2 } }));
    });
    for (const [width, recent, column, description] of [
      [360, "20px", "20px", "16px"],
      [800, "26px", "22px", "16px"],
      [1023, "26px", "22px", "16px"],
      [1024, "26px", "20px", "14px"],
      [1280, "26px", "20px", "14px"],
    ] as const) {
      await test.step(`${width}px`, async () => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto("/");
        await expect(
          band(page, RECENT).locator("article h3").first(),
        ).toHaveCSS("font-size", recent);
        await expect(band(page, PROTO).locator("article h3").first()).toHaveCSS(
          "font-size",
          column,
        );
        const ranked = band(page, VOTED).locator("[data-ranking] article h3");
        await expect(ranked).not.toHaveCount(0);
        await expect(ranked.first()).toHaveCSS("font-size", column);
        const text = band(page, PROTO).locator("[data-description]");
        await expect(text).toHaveCSS("font-size", description);
        await expect(text).toHaveCSS("-webkit-line-clamp", "2");
      });
    }
  });

  test("links das faixas", async ({ page }) => {
    const votes: Record<string, number> = {};
    for (const post of diskPosts()) votes[post.slug] = 2;
    await page.route("**/api/votes", async (route) => {
      await route.fulfill(fulfillVotes({ votes }));
    });
    await page.goto("/");
    await expect(
      band(page, VOTED).locator("[data-ranking] article"),
    ).not.toHaveCount(0);
    await expectBandLinks(page);

    const accent = await tokenColor(page, "--color-accent");
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      for (const label of [RECENT, VOTED, PROTO]) {
        const link = band(page, label).locator("h2 + a");
        await expect(link).toHaveCSS("color", accent);
        const arrow = link.locator('[aria-hidden="true"]');
        await expect(arrow).toHaveText("→");
        const gap = await baselineGap(page, label);
        expect(Math.abs(gap), `${label} ${width}`).toBeLessThan(1);
        const rightGap = await link.evaluate((node) => {
          const header = node.parentElement?.getBoundingClientRect();
          return header
            ? header.right - node.getBoundingClientRect().right
            : NaN;
        });
        expect(Math.abs(rightGap)).toBeLessThan(1);
      }
    }

    for (const body of [{ votes: {} }, { error: "no" }]) {
      await page.unrouteAll({ behavior: "ignoreErrors" });
      await page.route("**/api/votes", async (route) => {
        await route.fulfill(fulfillVotes(body, "error" in body ? 500 : 200));
      });
      const answered = page.waitForResponse(
        (response) => response.url().includes("/api/votes"),
        { timeout: 5_000 },
      );
      await page.goto("/");
      await answered;
      await settle(page);
      await expectBandLinks(page);
    }
  });

  test("ranking com votos, sem votos e com a API falhando", async ({
    page,
  }) => {
    const voted = band(page, VOTED);

    await page.route("**/api/votes", async (route) => {
      await route.fulfill(
        fulfillVotes({
          votes: {
            "fixture-md": 5,
            "fixture-sem-titulos": 1,
            "fixture-mdx": 1,
            "fixture-formulas": 1,
            "2026-10-como-o-blog-e-feito": 1,
            "2026-10-por-que-este-blog": 1,
          },
        }),
      );
    });
    await page.goto("/");
    const ranked = voted.locator("[data-ranking] article");
    await expect(ranked).toHaveCount(6);
    await expect(ranked.locator("h3 a").first()).toHaveAttribute(
      "href",
      fixtureMd.href,
    );
    await expect(ranked.locator("h3")).toHaveCount(6);
    const positions = await ranked
      .locator("[data-rank-position]")
      .allTextContents();
    expect(positions).toEqual(["01", "02", "03", "04", "05", "06"]);
    const topArticle = voted.locator(
      `article:has(a[href="${fixtureMd.href}"])`,
    );
    await expect(topArticle.locator("[data-vote-value]")).toHaveText("5");
    await expect(topArticle.locator("[data-vote-word]")).toHaveText("votos");
    const ink = await tokenColor(page, "--color-ink");
    for (const selector of [
      "[data-vote-value]",
      "[data-vote-word]",
      "[data-votes]",
    ]) {
      await expect(topArticle.locator(selector)).toHaveCSS("color", ink);
    }
    expect(await visibleText(topArticle.locator("[data-votes]"))).toBe(
      "5 votos",
    );
    await expect(topArticle.locator("[data-votes] svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    const order = await topArticle.evaluate((article) => {
      const position = article.querySelector("[data-rank-position]");
      const title = article.querySelector("h3");
      const votes = article.querySelector("[data-votes]");
      if (!position || !title || !votes) return [];
      return [
        position.getBoundingClientRect().left,
        title.getBoundingClientRect().left,
        votes.getBoundingClientRect().left,
      ];
    });
    expect(order).toHaveLength(3);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    const one = voted.locator(
      `article:has(a[href="${fixtureSemTitulos.href}"])`,
    );
    await expect(one.locator("[data-vote-value]")).toHaveText("1");
    await expect(one.locator("[data-vote-word]")).toHaveText("voto");
    await expect(ranked.locator("time")).toHaveCount(0);
    await expect(ranked.locator("[data-reading]")).toHaveCount(0);
    await page.setViewportSize({ width: 360, height: 800 });
    await expect(ranked.first().locator("h3")).toHaveCSS("font-size", "20px");

    await page.unrouteAll({ behavior: "ignoreErrors" });
    await page.route("**/api/votes", async (route) => {
      await route.fulfill(fulfillVotes({ votes: {} }));
    });
    await page.goto("/");
    await expect(voted).toContainText("Nenhum voto ainda.");
    await expect(voted.locator("[data-ranking] article")).toHaveCount(0);

    await page.unrouteAll({ behavior: "ignoreErrors" });
    await page.route("**/api/votes", async (route) => {
      await route.fulfill(fulfillVotes({ error: "no" }, 500));
    });
    const failed = page.waitForResponse(
      (response) => response.url().includes("/api/votes"),
      { timeout: 5_000 },
    );
    await page.goto("/");
    await failed;
    await expect(voted).toContainText("O ranking precisa de JavaScript.");
    await expect(voted).not.toContainText("Nenhum voto ainda.");
    await expect(voted.locator("[data-ranking] article")).toHaveCount(0);
  });

  test("o GET no topo move menos de 3 px", async ({ page }) => {
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
          await route.fulfill(
            fulfillVotes({
              votes: {
                "fixture-md": 2,
                "fixture-sem-titulos": 1,
              },
            }),
          );
        });
        await page.setViewportSize({ width, height: 800 });
        await page.goto("/");
        await expect(band(page, VOTED)).toContainText(
          "O ranking precisa de JavaScript.",
        );
        await page.evaluate(() => document.fonts.ready);
        const before = await markVisible(page);
        open = true;
        release();
        await expect(
          band(page, VOTED).locator("[data-ranking] article"),
        ).not.toHaveCount(0);
        await settle(page);
        const after = await topsOf(
          page,
          before.map((box) => box.id),
        );
        const moved = [];
        for (let index = 0; index < before.length; index += 1) {
          const box = before[index];
          const topAfter = after[index];
          if (!box || typeof topAfter !== "number") continue;
          const delta = topAfter - box.top;
          if (Math.abs(delta) >= PIXELS_TO_SIGNIFICANCE) {
            moved.push({ tag: box.tag, classes: box.classes, delta });
          }
        }
        expect(moved).toEqual([]);
      });
    }
  });

  test("o ranking empurra / PROTÓTIPOS e não mexe em / RECENTES", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let open = false;
    await page.route("**/api/votes", async (route) => {
      if (!open) await gate;
      await route.fulfill(
        fulfillVotes({
          votes: { "fixture-md": 2, "fixture-sem-titulos": 1 },
        }),
      );
    });
    await page.goto("/");
    const recent = page.getByRole("heading", {
      level: 2,
      name: RECENT,
      exact: true,
    });
    const prototypes = page.getByRole("heading", {
      level: 2,
      name: PROTO,
      exact: true,
    });
    await page
      .getByRole("heading", { level: 2, name: VOTED, exact: true })
      .scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    const topOf = (heading: Locator) =>
      heading.evaluate((element) => element.getBoundingClientRect().top);
    const before = {
      recent: await topOf(recent),
      prototypes: await topOf(prototypes),
    };
    open = true;
    release();
    await expect(
      band(page, VOTED).locator("[data-ranking] article"),
    ).not.toHaveCount(0);
    await settle(page);
    expect(Math.abs((await topOf(recent)) - before.recent)).toBeLessThan(
      PIXELS_TO_SIGNIFICANCE,
    );
    expect((await topOf(prototypes)) - before.prototypes).toBeGreaterThan(
      PIXELS_TO_SIGNIFICANCE,
    );
  });
});

test.describe("ranking sem JavaScript [RF-01]", () => {
  test.use({ javaScriptEnabled: false });

  test("o bloco fica com o aviso do build", async ({ page }) => {
    await page.goto("/");
    const voted = band(page, VOTED);
    await expect(voted).toContainText("O ranking precisa de JavaScript.");
    await expect(voted.locator("[data-ranking] article")).toHaveCount(0);
    await expect(voted).not.toContainText("Nenhum voto ainda.");
    await expectBandLinks(page);
    await expect(band(page, RECENT).locator("[data-novo]")).toHaveCount(5);
    for (const text of await band(page, RECENT)
      .locator("[data-novo]")
      .allTextContents()) {
      expect(text).toBe("");
    }
  });
});
