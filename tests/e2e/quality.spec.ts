import { createRequire } from "node:module";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { pagesForTheme, publishedPosts } from "./published-posts";

const loadConfig = createRequire(import.meta.url);

function pathnameOf(url: string) {
  return new URL(url).pathname;
}

async function open(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
}

test.describe("qualidade por post [RNF-01, RNF-04, RNF-14]", () => {
  test("a lista do Lighthouse é a home e cada post publicado", async ({
    page,
  }) => {
    const config = loadConfig("../../lighthouserc.cjs") as {
      ci: {
        collect: {
          url: string[];
          numberOfRuns: number;
          staticDistDir: string;
        };
      };
    };
    const posts = await publishedPosts(page);
    const fromConfig = config.ci.collect.url.map(pathnameOf);
    const fromSite = ["/", ...posts.map((post) => post.href)];

    expect([...fromConfig].sort()).toEqual([...fromSite].sort());
    expect(fromConfig[0]).toBe("/");
    expect(fromConfig.slice(1)).toEqual([...fromConfig.slice(1)].sort());
    expect(config.ci.collect.numberOfRuns).toBe(5);
    expect(config.ci.collect.staticDistDir).toBe("./dist");
  });

  test("axe sem violações serious nem critical em cada página publicada", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const paths = await pagesForTheme(page);
    test.setTimeout(60_000 + paths.length * 30_000);

    for (const path of paths) {
      await test.step(path, async () => {
        await open(page, path);
        const results = await new AxeBuilder({ page }).analyze();
        const blocking = results.violations.filter(
          (violation) =>
            violation.impact === "serious" || violation.impact === "critical",
        );
        expect(blocking.map((violation) => violation.id)).toEqual([]);
      });
    }
  });
});
