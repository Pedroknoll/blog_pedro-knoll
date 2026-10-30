import { expect, test, type Request } from "@playwright/test";

import { publishedPosts } from "./published-posts";

// Igual a `copyResetMs` no script de src/components/ui/CodeCopy.astro.
const copyResetMs = 1500;
const clockStart = new Date("2024-02-02T08:00:00");
const twoHoursMs = 2 * 60 * 60 * 1000;

test.describe("código e fórmulas [RF-06, RF-07, RNF-01]", () => {
  test("blocos de código têm tokens dos dois temas [RF-06]", async ({
    page,
  }) => {
    const posts = await publishedPosts(page);
    let pres = 0;

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);

        const article = page.getByRole("article");
        const all = article.locator("pre");
        const highlighted = article.locator("pre.astro-code");
        const allCount = await all.count();
        expect(allCount).toBe(await highlighted.count());
        pres += allCount;

        for (let index = 0; index < allCount; index += 1) {
          const tokens = highlighted
            .nth(index)
            .locator("span[style*='--shiki-light'][style*='--shiki-dark']");
          await expect(tokens).not.toHaveCount(0);
        }
      });
    }

    expect(pres).toBeGreaterThan(0);
  });

  test("botão copiar grava o texto do code [RF-06]", async ({
    page,
    context,
    baseURL,
  }) => {
    expect(baseURL).toBeTruthy();
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: new URL(baseURL ?? "").origin,
    });
    await page.clock.install({ time: clockStart });

    const posts = await publishedPosts(page);
    let pauseAt = new Date(clockStart.getTime() + twoHoursMs);
    let clockPaused = false;
    let pres = 0;

    for (const post of posts) {
      await test.step(post.href, async () => {
        if (clockPaused) {
          await page.clock.resume();
          clockPaused = false;
        }

        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);

        const blocks = page.getByRole("article").locator("pre");
        const count = await blocks.count();
        pres += count;
        if (count === 0) return;

        await page.clock.pauseAt(pauseAt);
        clockPaused = true;

        for (let index = 0; index < count; index += 1) {
          const pre = blocks.nth(index);
          const codeText = await pre
            .locator("code")
            .evaluate((node) => node.textContent ?? "");
          const button = pre
            .locator("..")
            .locator(":scope > *")
            .first()
            .getByRole("button");
          await expect(button).toHaveCount(1);
          await expect(button).toHaveText("Copiar");
          await expect(button).toHaveAccessibleName(/^Copiar código$/);
          await button.click();
          await expect(button).toHaveText("Copiado");
          await expect(button).toHaveAccessibleName(/^Código copiado$/);
          await expect
            .poll(async () => {
              const text = await page.evaluate(() =>
                navigator.clipboard.readText(),
              );
              return { text, mentionsCopiar: text.includes("Copiar") };
            })
            .toEqual({ text: codeText, mentionsCopiar: false });
          await page.clock.fastForward(copyResetMs - 1);
          await expect(button).toHaveText("Copiado");
          await page.clock.fastForward(2);
          await expect(button).toHaveText("Copiar");
          await expect(button).toHaveAccessibleName(/^Copiar código$/);
        }

        pauseAt = new Date(pauseAt.getTime() + twoHoursMs);
      });
    }

    expect(pres).toBeGreaterThan(0);
  });

  test("barra do bloco [RF-06]", async ({ page }) => {
    const posts = await publishedPosts(page);
    let named = 0;
    let unnamed = 0;

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);

        const blocks = page.getByRole("article").locator("pre");
        const count = await blocks.count();

        for (let index = 0; index < count; index += 1) {
          const bar = await blocks.nth(index).evaluate((pre) => {
            const parent = pre.parentElement;
            const children = parent ? [...parent.children] : [];
            const first = children[0];
            const elementChildren = first ? [...first.children] : [];
            const span = elementChildren.find(
              (child) => child.tagName === "SPAN",
            );
            const spanStyle = span ? getComputedStyle(span) : null;

            return {
              childCount: children.length,
              lastIsPre: children.at(-1) === pre,
              buttonCount: elementChildren.filter(
                (child) => child.tagName === "BUTTON",
              ).length,
              spanCount: elementChildren.filter(
                (child) => child.tagName === "SPAN",
              ).length,
              text: span?.textContent ?? "",
              fontFamily: spanStyle?.fontFamily ?? "",
              preFontFamily: getComputedStyle(pre).fontFamily,
              fontSize: spanStyle?.fontSize ?? "",
              color: spanStyle?.color ?? "",
            };
          });

          expect(bar.childCount).toBe(2);
          expect(bar.lastIsPre).toBe(true);
          expect(bar.buttonCount).toBe(1);
          expect([0, 1]).toContain(bar.spanCount);

          if (bar.spanCount === 1) {
            expect(bar.text).not.toBe("");
            expect(bar.fontFamily).toBe(bar.preFontFamily);
            expect(bar.fontSize).toBe("12px");
            expect(bar.color).toBe("rgb(94, 83, 69)");
            named += 1;
          } else {
            unnamed += 1;
          }
        }
      });
    }

    expect(named).toBeGreaterThan(0);
    expect(unnamed).toBeGreaterThan(0);
  });

  test("fonte KaTeX_Main carrega da mesma origem [RF-07]", async ({ page }) => {
    const posts = await publishedPosts(page);
    const withKatex: string[] = [];

    for (const post of posts) {
      const response = await page.goto(post.href);
      expect(response?.status()).toBe(200);
      if ((await page.locator(".katex").count()) > 0) withKatex.push(post.href);
    }

    expect(withKatex.length).toBeGreaterThan(0);

    for (const href of withKatex) {
      await test.step(href, async () => {
        const requests: string[] = [];
        const onRequest = (request: Request) => {
          requests.push(request.url());
        };
        page.on("request", onRequest);

        const response = await page.goto(href);
        expect(response?.status()).toBe(200);
        await page.evaluate(() => document.fonts.ready);

        const loaded = await page.evaluate(() =>
          [...document.fonts].some(
            (face) =>
              face.family.replaceAll('"', "") === "KaTeX_Main" &&
              face.status === "loaded",
          ),
        );
        expect(loaded).toBe(true);

        const origin = new URL(page.url()).origin;
        for (const url of requests) {
          expect(new URL(url).origin).toBe(origin);
        }

        page.off("request", onRequest);
      });
    }
  });

  test("a home não declara @font-face de KaTeX [RNF-01]", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    const families = await page.evaluate(() => {
      const found: string[] = [];
      for (const sheet of document.styleSheets) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        for (const rule of rules) {
          if (
            rule instanceof CSSFontFaceRule &&
            rule.style.fontFamily.includes("KaTeX")
          ) {
            found.push(rule.style.fontFamily);
          }
        }
      }
      return found;
    });

    expect(families).toEqual([]);
  });
});

test.describe("código e fórmulas sem JavaScript [RF-06, RF-07]", () => {
  test.use({ javaScriptEnabled: false });

  test("sem JavaScript o bloco existe e não há botão [RF-06]", async ({
    page,
  }) => {
    const posts = await publishedPosts(page);
    let pres = 0;
    let names = 0;

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);

        const article = page.getByRole("article");
        pres += await article.locator("pre.astro-code").count();
        await expect(
          page.getByRole("button", { name: "Copiar código", exact: true }),
        ).toHaveCount(0);

        const blocks = article.locator("pre");
        const count = await blocks.count();
        for (let index = 0; index < count; index += 1) {
          const span = blocks
            .nth(index)
            .locator("..")
            .locator(":scope > *")
            .first()
            .locator(":scope > span");
          if ((await span.count()) === 0) continue;
          await expect(span).toHaveCount(1);
          await expect(span).toBeVisible();
          const text = await span.evaluate((node) => node.textContent ?? "");
          expect(text).not.toBe("");
          names += 1;
        }
      });
    }

    expect(pres).toBeGreaterThan(0);
    expect(names).toBeGreaterThan(0);
  });

  test("fórmulas inline e em bloco viram KaTeX [RF-07]", async ({ page }) => {
    const posts = await publishedPosts(page);
    let outside = 0;
    let display = 0;
    let postsWithKatex = 0;

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status()).toBe(200);

        const counts = await page.evaluate(() => {
          const nodes = [...document.querySelectorAll(".katex")];
          return {
            katex: nodes.length,
            outside: nodes.filter(
              (node) => node.closest(".katex-display") === null,
            ).length,
            display: document.querySelectorAll(".katex-display").length,
            withMathml: nodes.filter((node) =>
              node.querySelector(".katex-mathml math"),
            ).length,
          };
        });

        expect(counts.withMathml).toBe(counts.katex);
        if (counts.katex > 0) postsWithKatex += 1;
        outside += counts.outside;
        display += counts.display;
      });
    }

    expect(outside).toBeGreaterThan(0);
    expect(display).toBeGreaterThan(0);
    // A contagem é a única forma de o E2E garantir que o .md
    // (markdown.processor) passa pelo KaTeX.
    expect(postsWithKatex).toBeGreaterThanOrEqual(2);
  });
});
