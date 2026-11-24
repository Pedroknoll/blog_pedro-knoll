import fs from "node:fs";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  directiveValue,
  policyOf,
  readCspViolations,
  serveDocument,
  servePagefindWorker,
  watchCsp,
} from "./csp";
import { fixtureMd } from "./fixtures";
import { siteTitle } from "./site-literals";

const pages = [
  { path: "/", status: 200 },
  { path: fixtureMd.href, status: 200 },
  { path: "/blog/", status: 200 },
  { path: "/comece-aqui/", status: 200 },
  { path: "/caminho-que-nao-existe/", status: 404 },
] as const;

function searchButton(page: Page) {
  return page.getByRole("banner").getByRole("button", {
    name: /^Buscar (⌘K|Ctrl K)$/,
    exact: true,
  });
}

function signature(page: Page) {
  return page.getByRole("banner").getByRole("link", {
    name: siteTitle,
    exact: true,
  });
}

test.describe("busca [RF-15]", () => {
  test("o botão tem 44 px e, a 360 px, fica na linha da assinatura", async ({
    page,
  }) => {
    for (const width of [1280, 360]) {
      await page.setViewportSize({ width, height: 800 });
      for (const entry of pages) {
        const response = await page.goto(entry.path);
        expect(response?.status(), `${entry.path} ${width}`).toBe(entry.status);
        const button = searchButton(page);
        await expect(button, `${entry.path} ${width}`).toBeVisible();
        await expect(button).toHaveAttribute(
          "aria-keyshortcuts",
          "Meta+K Control+K",
        );
        const box = await button.boundingBox();
        expect(box, `${entry.path} ${width}`).not.toBeNull();
        if (!box) return;
        expect(box.height, `${entry.path} ${width}`).toBeCloseTo(44, 0);
        expect(box.width, `${entry.path} ${width}`).toBeGreaterThanOrEqual(44);
        if (width !== 360) continue;
        const mark = await signature(page).boundingBox();
        expect(mark, entry.path).not.toBeNull();
        if (!mark) return;
        const buttonCenter = box.y + box.height / 2;
        const markCenter = mark.y + mark.height / 2;
        expect(Math.abs(buttonCenter - markCenter), entry.path).toBeLessThan(1);
        expect(box.x, entry.path).toBeGreaterThan(mark.x + mark.width);
      }
    }
  });

  test("o script só carrega ao abrir, o Esc devolve o foco e o atalho abre", async ({
    page,
  }) => {
    const requested: string[] = [];
    page.on("request", (request) => {
      requested.push(new URL(request.url()).pathname);
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await page.waitForTimeout(1000);
    expect(
      requested.filter((pathname) => pathname.startsWith("/pagefind/")),
    ).toEqual([]);

    const button = searchButton(page);
    await button.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    const input = dialog.locator('input[type="search"]');
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("placeholder", "Buscar");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();

    await page.keyboard.press("ControlOrMeta+K");
    await expect(dialog).toBeVisible();
    await expect(input).toBeFocused();
  });

  test("o corpo da fixture entra no índice e o que está fora fica de fora", async ({
    page,
  }) => {
    test.setTimeout(30_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await searchButton(page).click();
    const dialog = page.getByRole("dialog");
    const input = dialog.locator('input[type="search"]');
    await expect(input).toBeFocused();

    await input.fill(fixtureMd.bodyTerm);
    const result = dialog.locator(`a[href="${fixtureMd.href}"]`);
    await expect(result).toHaveCount(1, { timeout: 15_000 });
    await expect(result).toContainText(fixtureMd.title);
    await expect(dialog.locator("mark").first()).toBeVisible();

    await input.fill(fixtureMd.descriptionTerm);
    await expect(dialog.locator("pagefind-summary")).toHaveText(
      `Nenhum resultado encontrado para ${fixtureMd.descriptionTerm}`,
      { timeout: 15_000 },
    );
    await expect(dialog.locator("a")).toHaveCount(0);
  });

  test("abrir e buscar não pede fonte nova", async ({ page }) => {
    test.setTimeout(30_000);
    const fonts = new Set<string>();
    page.on("request", (request) => {
      const pathname = new URL(request.url()).pathname;
      if (pathname.includes("/_astro/fonts/")) fonts.add(pathname);
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await page.waitForTimeout(1000);
    const before = new Set(fonts);
    const semibold = await page.evaluate(() => {
      const files = new Set<string>();
      for (const sheet of document.styleSheets) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        for (const rule of rules) {
          if (!(rule instanceof CSSFontFaceRule)) continue;
          const family = rule.style.fontFamily.replaceAll('"', "");
          if (!family.startsWith("IBM Plex Sans-")) continue;
          if (rule.style.fontWeight !== "600") continue;
          const source = /url\("([^"]+)"\)/.exec(
            rule.style.getPropertyValue("src"),
          );
          if (!source?.[1]) continue;
          files.add(new URL(source[1], location.href).pathname);
        }
      }
      return [...files];
    });
    expect(semibold.length).toBeGreaterThan(0);

    await searchButton(page).click();
    const dialog = page.getByRole("dialog");
    const input = dialog.locator('input[type="search"]');
    await input.fill(fixtureMd.bodyTerm);
    await expect(dialog.locator(`a[href="${fixtureMd.href}"]`)).toHaveCount(1, {
      timeout: 15_000,
    });
    await page.waitForTimeout(500);

    const extra = [...fonts].filter((pathname) => !before.has(pathname));
    expect(extra.every((pathname) => semibold.includes(pathname))).toBe(true);
  });

  test("axe sem violações serious nem critical com o modal aberto", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await searchButton(page).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );
    expect(blocking.map((violation) => violation.id)).toEqual([]);
  });

  test("a CSP do _headers vale na página e no worker da busca", async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const headersText = fs.readFileSync(path.resolve("dist/_headers"), "utf8");
    const pagePolicy = policyOf(headersText, "/");
    const workerPolicy = policyOf(headersText, "/pagefind/pagefind-worker.js");
    expect(directiveValue(pagePolicy, "script-src")).toContain(
      "'wasm-unsafe-eval'",
    );
    expect(directiveValue(workerPolicy, "script-src")).toContain(
      "'wasm-unsafe-eval'",
    );

    const cspMessages: string[] = [];
    page.on("console", (message) => {
      if (/content security policy/i.test(message.text())) {
        cspMessages.push(message.text());
      }
    });
    await serveDocument(page, "/", pagePolicy);
    await servePagefindWorker(page, workerPolicy);
    await watchCsp(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await searchButton(page).click();
    const input = page.getByRole("dialog").locator('input[type="search"]');
    await expect(input).toBeFocused();
    await input.fill(fixtureMd.bodyTerm);
    await expect(page.locator("pagefind-summary")).toHaveText(/resultado/, {
      timeout: 15_000,
    });
    expect(await readCspViolations(page)).toEqual([]);
    expect(cspMessages).toEqual([]);
  });
});
