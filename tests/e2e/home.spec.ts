import { expect, test, type Page } from "@playwright/test";

import { fixtureMd, fixtureSemTitulos } from "./fixtures";
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
    await expect(recent.locator("[data-listing]")).toHaveCSS(
      "border-top-width",
      "0px",
    );

    const prototypes = band(page, PROTO);
    const prototypeLinks = prototypes.locator("h3 a");
    const prototypeList = prototypes.locator("[data-listing]");
    await expect(prototypeList).toHaveCSS("border-top-width", "0px");
    await expect(prototypeList).toHaveCSS("border-bottom-width", "0px");
    await expect(prototypes.locator("time")).toHaveCount(0);
    await expect(prototypes.locator("p.footer")).toHaveCount(0);
    await expect(prototypes.locator("li")).toHaveCSS("border-top-width", "0px");
    await expect(prototypes.locator("li")).toHaveCSS("padding-top", "16px");
    await expect(
      prototypes.locator("h2").locator("xpath=../../div[2]"),
    ).toHaveCSS("margin-top", "8px");
    await expect(prototypeLinks).toHaveCount(1);
    await expect(prototypeLinks).toHaveAttribute("href", fixtureMd.href);
    await expect(page.locator("article img")).toHaveCount(0);
  });

  test("os três Todos", async ({ page }) => {
    await page.goto("/");
    const links = [
      {
        label: RECENT,
        name: "Todos os posts recentes",
        href: "/blog/",
      },
      {
        label: VOTED,
        name: "Todos os mais votados",
        href: "/mais-votados/",
      },
      {
        label: PROTO,
        name: "Todos os protótipos",
        href: "/prototipos/",
      },
    ];
    for (const item of links) {
      const link = band(page, item.label).getByRole("link", {
        name: item.name,
        exact: true,
      });
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", item.href);
      const visible = await link.evaluate((node) =>
        [...node.childNodes]
          .filter(
            (child) =>
              !(
                child instanceof Element && child.classList.contains("sr-only")
              ),
          )
          .map((child) => child.textContent ?? "")
          .join(""),
      );
      expect(visible).toBe("Todos");
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
    const top = voted.locator(
      `article:has(a[href="${fixtureMd.href}"]) [data-vote-value]`,
    );
    await expect(top).toHaveText("5");
    await expect(ranked.locator("time")).toHaveCount(0);
    await expect(ranked.locator("[data-reading]")).toHaveCount(0);
    await expect(voted.locator("[data-ranking]")).toHaveCSS(
      "border-top-width",
      "0px",
    );
    const itemBorders = await voted
      .locator("[data-ranking] li")
      .evaluateAll((items) =>
        items.map((item) => getComputedStyle(item).borderTopWidth),
      );
    expect(itemBorders).toEqual(Array.from({ length: 6 }, () => "0px"));
    await expect(voted.locator("h2").locator("xpath=../../div[2]")).toHaveCSS(
      "margin-top",
      "8px",
    );

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

  test("com a página rolada, / PROTÓTIPOS move menos de 3 px", async ({
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
    const label = page.getByRole("heading", {
      level: 2,
      name: PROTO,
      exact: true,
    });
    await page
      .getByRole("heading", { level: 2, name: VOTED, exact: true })
      .scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    const before = await label.evaluate(
      (element) => element.getBoundingClientRect().top,
    );
    open = true;
    release();
    await expect(
      band(page, VOTED).locator("[data-ranking] article"),
    ).not.toHaveCount(0);
    await settle(page);
    const after = await label.evaluate(
      (element) => element.getBoundingClientRect().top,
    );
    expect(Math.abs(after - before)).toBeLessThan(PIXELS_TO_SIGNIFICANCE);
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
  });
});
