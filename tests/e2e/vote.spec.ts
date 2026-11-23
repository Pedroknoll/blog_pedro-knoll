import { expect, test, type Page } from "@playwright/test";

import { fixtureMdx } from "./fixtures";

const SLUG = "fixture-mdx";
const STORAGE_KEY = `pk-vote:${SLUG}`;
const WIDTHS = [360, 1280] as const;

// Chrome conta o ponto se ele muda pelo menos 3 px (https://wicg.github.io/layout-instability).
const PIXELS_TO_SIGNIFICANCE = 3;

type VisibleBox = {
  index: number;
  tag: string;
  classes: string;
  top: number;
};

function visibleVote(page: Page) {
  return page.locator("[data-post-vote]:visible");
}

async function openFixture(page: Page, width: number) {
  await page.setViewportSize({ width, height: 800 });
  const response = await page.goto(fixtureMdx.href);
  expect(response?.status()).toBe(200);
  expect(fixtureMdx.href).toBe(`/blog/${SLUG}/`);
}

async function lineHeight(page: Page) {
  return visibleVote(page)
    .locator("[data-vote-line]")
    .evaluate((element) => element.getBoundingClientRect().height);
}

function fulfillVotes(
  body: unknown,
  status = 200,
): {
  status: number;
  contentType: string;
  body: string;
} {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

async function visibleBoxes(page: Page) {
  return page.evaluate(() => {
    const elements = [...document.querySelectorAll("body *")];
    const boxes: VisibleBox[] = [];
    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (!(rect.bottom > 0 && rect.top < innerHeight)) continue;
      boxes.push({
        index,
        tag: element.tagName,
        classes: element.getAttribute("class") ?? "",
        top: rect.top,
      });
    }
    return { total: elements.length, boxes };
  });
}

async function topsAt(page: Page, indexes: number[]) {
  return page.evaluate((indexes) => {
    const elements = [...document.querySelectorAll("body *")];
    return {
      total: elements.length,
      tops: indexes.map((index) => {
        const element = elements[index];
        return element ? element.getBoundingClientRect().top : null;
      }),
    };
  }, indexes);
}

async function afterText(page: Page) {
  return visibleVote(page).evaluate((vote) => {
    const prose = document.querySelector("article > .prose");
    const appendix = document.querySelector("section[aria-label='Apêndice']");
    if (!prose) return false;
    const followsProse = Boolean(
      prose.compareDocumentPosition(vote) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    const beforeAppendix =
      appendix === null ||
      Boolean(
        vote.compareDocumentPosition(appendix) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    return followsProse && beforeAppendix;
  });
}

test.describe("voto sem JavaScript [RF-25]", () => {
  test.use({ javaScriptEnabled: false });

  test("um bloco visível, com o aviso e sem botão", async ({ page }) => {
    for (const width of WIDTHS) {
      await test.step(`${width}px`, async () => {
        await openFixture(page, width);
        const vote = visibleVote(page);
        await expect(page.locator("[data-post-vote]")).toHaveCount(2);
        await expect(vote).toHaveCount(1);
        await expect(vote).toContainText("O voto precisa de JavaScript.");
        await expect(vote.getByRole("button")).toHaveCount(0);
        expect(await lineHeight(page)).toBe(36);

        if (width === 1280) {
          await expect(
            page.locator("[data-post-rail] [data-post-vote]:visible"),
          ).toHaveCount(1);
        } else {
          await expect(
            page.locator("[data-post-rail] [data-post-vote]:visible"),
          ).toHaveCount(0);
          expect(await afterText(page)).toBe(true);
        }
      });
    }
  });
});

test.describe("voto com JavaScript [RF-25]", () => {
  test("a linha do botão tem a mesma altura do aviso", async ({ page }) => {
    await page.route("**/api/votes", (route) => route.abort());
    for (const width of WIDTHS) {
      await test.step(`${width}px`, async () => {
        await openFixture(page, width);
        await expect(
          visibleVote(page).getByRole("button", { name: "Curtir" }),
        ).toBeVisible();
        expect(await lineHeight(page)).toBe(36);
      });
    }
  });

  test("o GET com 7 mostra Curtir e a contagem", async ({ page }) => {
    await page.route("**/api/votes", async (route) => {
      await route.fulfill(fulfillVotes({ votes: { [SLUG]: 7 } }));
    });

    for (const width of WIDTHS) {
      await test.step(`${width}px`, async () => {
        await openFixture(page, width);
        const vote = visibleVote(page);
        await expect(
          vote.getByRole("button", { name: "Curtir" }),
        ).toBeVisible();
        await expect(vote.locator("[data-vote-count]")).toContainText("7");
        await expect(vote.locator("[data-vote-count] .sr-only")).toHaveText(
          "votos",
        );
      });
    }
  });

  test("o GET que falha deixa a contagem em –", async ({ page }) => {
    await page.route("**/api/votes", async (route) => {
      await route.fulfill(fulfillVotes({ error: "missing" }, 404));
    });

    for (const width of WIDTHS) {
      await test.step(`${width}px`, async () => {
        await openFixture(page, width);
        const vote = visibleVote(page);
        await expect(
          vote.getByRole("button", { name: "Curtir" }),
        ).toBeVisible();
        await expect(vote.locator("[data-vote-count]")).toContainText("–");
      });
    }
  });

  test("o POST 200 vira Curtido e o reload abre assim", async ({ page }) => {
    const posted: { contentType: string; body: unknown }[] = [];
    await page.route("**/api/votes", async (route) => {
      const request = route.request();
      if (request.method() === "GET") {
        await route.fulfill(fulfillVotes({ votes: { [SLUG]: 7 } }));
        return;
      }
      posted.push({
        contentType: request.headers()["content-type"] ?? "",
        body: request.postDataJSON(),
      });
      await route.fulfill(fulfillVotes({ slug: SLUG, votes: 8 }));
    });

    for (const [index, width] of WIDTHS.entries()) {
      await test.step(`${width}px`, async () => {
        if (index > 0) {
          await page.evaluate(
            (key) => localStorage.removeItem(key),
            STORAGE_KEY,
          );
        }
        await openFixture(page, width);
        const vote = visibleVote(page);
        const button = vote.getByRole("button", { name: "Curtir" });
        await expect(vote.locator("[data-vote-count]")).toContainText("7");
        await button.click();
        await expect(
          vote.getByRole("button", { name: "Curtido" }),
        ).toBeDisabled();
        await expect(vote.locator("[data-vote-count]")).toContainText("8");
      });
    }

    expect(posted).toHaveLength(WIDTHS.length);
    for (const request of posted) {
      expect(request.contentType).toContain("application/json");
      expect(request.body).toEqual({ slug: SLUG });
    }
    expect(
      await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
    ).toBe("1");

    await page.reload();
    await expect(
      visibleVote(page).getByRole("button", { name: "Curtido" }),
    ).toBeDisabled();
  });

  test("POST 403 e 429 voltam a Curtir sem gravar", async ({ page }) => {
    for (const status of [403, 429]) {
      await test.step(String(status), async () => {
        await page.unrouteAll({ behavior: "ignoreErrors" });
        await page.route("**/api/votes", async (route) => {
          if (route.request().method() === "GET") {
            await route.fulfill(fulfillVotes({ votes: { [SLUG]: 7 } }));
            return;
          }
          await route.fulfill(fulfillVotes({ error: "no" }, status));
        });
        await openFixture(page, 1280);
        const vote = visibleVote(page);
        const button = vote.getByRole("button", { name: "Curtir" });
        const count = vote.locator("[data-vote-count]");
        await expect(count).toContainText("7");
        await button.click();
        await expect(button).toBeEnabled();
        await expect(button.locator("[data-vote-label]")).toHaveText("Curtir");
        await expect(count).toContainText("7");
        expect(await page.evaluate(() => localStorage.length)).toBe(0);
      });
    }
  });

  test("a troca de – pelo número não move elemento visível", async ({
    page,
  }) => {
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
          await route.fulfill(fulfillVotes({ votes: { [SLUG]: 7 } }));
        });

        await openFixture(page, width);
        const vote = visibleVote(page);
        const button = vote.getByRole("button", { name: "Curtir" });
        await button.scrollIntoViewIfNeeded();
        await expect(button).toBeVisible();
        const count = vote.locator("[data-vote-count]");
        await expect(count).toBeVisible();
        await expect(count).toContainText("–");
        await page.evaluate(() => document.fonts.ready);

        const before = await visibleBoxes(page);
        open = true;
        release();
        await expect(count).toContainText("7");
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => resolve());
              });
            }),
        );

        const after = await topsAt(
          page,
          before.boxes.map((box) => box.index),
        );
        expect(after.total).toBe(before.total);
        const moved = [];
        for (let index = 0; index < before.boxes.length; index += 1) {
          const box = before.boxes[index];
          const topAfter = after.tops[index];
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
});
