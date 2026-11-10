import { expect, test, type Locator, type Page } from "@playwright/test";

import { publishedPosts } from "./published-posts";
import {
  vizCellIdle,
  vizCellNext,
  vizExplorableSummary,
  vizExplorableTitle,
  vizNext,
  vizPrevious,
  vizStaticSummary,
  vizStaticTitle,
} from "./site-literals";

async function open(page: Page, href: string) {
  const response = await page.goto(href);
  expect(response?.status(), href).toBe(200);
}

async function pageWithViz(page: Page): Promise<string> {
  const posts = await publishedPosts(page);
  const found: string[] = [];
  for (const post of posts) {
    await open(page, post.href);
    if ((await page.locator("svg[data-viz]").count()) > 0) {
      found.push(post.href);
    }
  }
  expect(found).toHaveLength(1);
  const href = found[0];
  if (!href) throw new Error("nenhuma figura");
  return href;
}

async function activeFlags(img: Locator): Promise<boolean[]> {
  return img
    .locator("rect")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.hasAttribute("data-active")),
    );
}

async function expectGrid(img: Locator, title: string) {
  await expect(img.locator("title")).toHaveText(title);
  await expect(img.locator("rect")).toHaveCount(25);
  await expect
    .poll(() => activeFlags(img))
    .toEqual([true, ...Array.from({ length: 24 }, () => false)]);
}

test.describe("figura sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("figura nos dois modos no HTML, sem JavaScript [RF-09, RNF-04]", async ({
    page,
  }) => {
    const href = await pageWithViz(page);
    await open(page, href);

    const still = page.getByRole("img", {
      name: vizStaticSummary,
      exact: true,
    });
    await expect(still).toHaveCount(1);
    expect(
      await still.evaluate(
        (element) => element.closest("astro-island") !== null,
      ),
    ).toBe(false);
    await expectGrid(still, vizStaticTitle);

    const island = page.locator("astro-island");
    await expect(island).toHaveCount(1);
    await expect(page.getByRole("button")).toHaveCount(2);
    await expect(island.getByRole("button")).toHaveCount(2);
    await expect(island).toHaveAttribute("client", "visible");
    const live = island.getByRole("img", {
      name: vizExplorableSummary,
      exact: true,
    });
    await expect(live).toHaveCount(1);
    await expectGrid(live, vizExplorableTitle);
    await expect(
      island.getByRole("button", { name: vizPrevious, exact: true }),
    ).toBeDisabled();
    await expect(
      island.getByRole("button", { name: vizNext, exact: true }),
    ).toBeDisabled();
    await expect(island.locator("[aria-live='polite']")).toHaveText(
      vizCellIdle,
    );
  });
});

test("teto de 1.000 nós por figura [RF-09]", async ({ page }) => {
  const posts = await publishedPosts(page);
  let found = 0;
  for (const post of posts) {
    await open(page, post.href);
    const figures = page.locator("svg[data-viz]");
    const count = await figures.count();
    for (let index = 0; index < count; index += 1) {
      found += 1;
      const nodes = await figures
        .nth(index)
        .evaluate((svg) => svg.querySelectorAll("*").length + 1);
      expect
        .soft(nodes, `${post.href} figura ${index}`)
        .toBeLessThanOrEqual(1000);
    }
  }
  expect(found).toBeGreaterThan(0);
});

test("explorável hidrata ao ficar visível [RF-09, RNF-02]", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const href = await pageWithViz(page);
  const requested: string[] = [];
  page.on("request", (request) => {
    requested.push(new URL(request.url()).pathname);
  });
  await open(page, href);

  const island = page.locator("astro-island");
  await expect(island).toHaveCount(1);
  const componentUrl = await island.getAttribute("component-url");
  expect(componentUrl).toBeTruthy();
  if (!componentUrl) return;
  const componentPath = new URL(componentUrl, page.url()).pathname;
  expect(requested.includes(componentPath)).toBe(false);
  const next = island.getByRole("button", { name: vizNext, exact: true });
  const previous = island.getByRole("button", {
    name: vizPrevious,
    exact: true,
  });
  await expect(next).toBeDisabled();

  const still = page.getByRole("img", {
    name: vizStaticSummary,
    exact: true,
  });
  const stillBefore = await still.evaluate((element) => element.outerHTML);
  const live = island.getByRole("img", {
    name: vizExplorableSummary,
    exact: true,
  });
  const pending = page.waitForRequest(
    (request) => new URL(request.url()).pathname === componentPath,
  );
  await live.scrollIntoViewIfNeeded();
  await pending;
  await expect(next).toBeEnabled();

  await next.click();
  await expect
    .poll(() => activeFlags(live))
    .toEqual([false, true, ...Array.from({ length: 23 }, () => false)]);
  await expect(island.locator("[aria-live='polite']")).toHaveText(vizCellNext);
  await previous.click();
  await expect
    .poll(() => activeFlags(live))
    .toEqual([true, ...Array.from({ length: 24 }, () => false)]);
  await expect(island.locator("[aria-live='polite']")).toHaveText(vizCellIdle);
  expect(await still.evaluate((element) => element.outerHTML)).toBe(
    stillBefore,
  );
});
