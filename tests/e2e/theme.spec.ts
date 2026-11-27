import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { fixtureMd, fixtureMdx } from "./fixtures";
import { isPostPath, pagesForTheme } from "./published-posts";

const tokens = [
  "surface",
  "sheet",
  "ink",
  "muted",
  "pencil",
  "line",
  "accent",
  "highlight",
  "grid",
  "grid-strong",
] as const;

type Token = (typeof tokens)[number];
type Channels = { r: number; g: number; b: number; a: number };

const light: Record<Token, Channels> = {
  surface: { r: 250, g: 249, b: 245, a: 1 },
  sheet: { r: 240, g: 238, b: 230, a: 1 },
  ink: { r: 42, g: 33, b: 24, a: 1 },
  muted: { r: 94, g: 83, b: 69, a: 1 },
  pencil: { r: 123, g: 111, b: 90, a: 1 },
  line: { r: 60, g: 40, b: 20, a: 0.16 },
  accent: { r: 31, g: 75, b: 122, a: 1 },
  highlight: { r: 163, g: 57, b: 42, a: 1 },
  grid: { r: 42, g: 33, b: 24, a: 0.03 },
  "grid-strong": { r: 42, g: 33, b: 24, a: 0.065 },
};

const dark: Record<Token, Channels> = {
  surface: { r: 14, g: 34, b: 54, a: 1 },
  sheet: { r: 22, g: 50, b: 80, a: 1 },
  ink: { r: 232, g: 238, b: 243, a: 1 },
  muted: { r: 169, g: 186, b: 203, a: 1 },
  pencil: { r: 134, g: 158, b: 182, a: 1 },
  line: { r: 232, g: 238, b: 243, a: 0.18 },
  accent: { r: 141, g: 184, b: 232, a: 1 },
  highlight: { r: 238, g: 138, b: 116, a: 1 },
  grid: { r: 232, g: 238, b: 243, a: 0.025 },
  "grid-strong": { r: 232, g: 238, b: 243, a: 0.055 },
};

function channels(color: string): Channels {
  const match = color.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/,
  );
  if (!match) throw new Error(`cor não reconhecida: ${color}`);
  return {
    r: Math.round(Number(match[1])),
    g: Math.round(Number(match[2])),
    b: Math.round(Number(match[3])),
    a: match[4] === undefined ? 1 : Number(match[4]),
  };
}

function isMissing(color: string) {
  try {
    const got = channels(color);
    return got.r === 1 && got.g === 2 && got.b === 3 && got.a === 1;
  } catch {
    return false;
  }
}

function colorsMatch(actual: string, expected: string) {
  try {
    const got = channels(actual);
    const want = channels(expected);
    return (
      got.r === want.r &&
      got.g === want.g &&
      got.b === want.b &&
      Math.abs(got.a - want.a) <= 0.001
    );
  } catch {
    return false;
  }
}

async function open(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
}

async function applyTheme(page: Page, theme: "light" | "dark") {
  if (theme === "light") return;
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
}

async function probeColors(page: Page): Promise<Record<Token, string>> {
  await page.evaluate((names) => {
    const host = document.createElement("div");
    host.id = "color-probes";
    for (const name of names) {
      const el = document.createElement("span");
      el.dataset.probe = name;
      el.style.color = `var(--color-${name}, rgb(1, 2, 3))`;
      el.textContent = name;
      host.append(el);
    }
    document.body.append(host);
  }, tokens);

  await expect(page.locator("#color-probes")).toHaveCount(1);
  for (const token of tokens) {
    await expect(page.locator(`[data-probe="${token}"]`)).toHaveCount(1);
  }

  const read = await page.locator("#color-probes span").evaluateAll((nodes) =>
    nodes.map((node) => ({
      token: (node as HTMLElement).dataset.probe ?? "",
      color: getComputedStyle(node).color,
    })),
  );
  return Object.fromEntries(
    read.map((item) => [item.token, item.color]),
  ) as Record<Token, string>;
}

for (const theme of ["light", "dark"] as const) {
  const label = theme === "light" ? "clara" : "escura";
  const table = theme === "light" ? light : dark;

  test(`T1 paleta ${label}`, async ({ page }) => {
    await open(page, "/");
    await applyTheme(page, theme);
    const colors = await probeColors(page);

    for (const token of tokens) {
      const missing = isMissing(colors[token]);
      expect.soft(missing, `token --color-${token} não existe`).toBe(false);
      if (missing) continue;
      const got = channels(colors[token]);
      const want = table[token];
      expect.soft(got.r, token).toBe(want.r);
      expect.soft(got.g, token).toBe(want.g);
      expect.soft(got.b, token).toBe(want.b);
      // Chrome guarda o alfa em 8 bits: 0.065 vira 17/255 e sai como 0.067.
      expect
        .soft(Math.round(got.a * 255), token)
        .toBe(Math.round(want.a * 255));
    }
  });

  test(`T2 papéis ${theme === "light" ? "claros" : "escuros"}`, async ({
    page,
  }) => {
    const pages = await pagesForTheme(page);
    const posts = pages.filter((path) => isPostPath(path));
    expect(posts).toContain(fixtureMd.href);

    const passed: string[] = [];
    let linkTotal = 0;

    function requireToken(color: string, token: Token, where: string) {
      if (!isMissing(color)) return true;
      expect
        .soft(false, `${where}: token --color-${token} não existe`)
        .toBe(true);
      return false;
    }

    function softRole(actual: string, expected: string, where: string) {
      expect
        .soft(
          colorsMatch(actual, expected),
          `${where}: ${actual} ≠ ${expected}`,
        )
        .toBe(true);
    }

    for (const path of pages) {
      await open(page, path);
      await applyTheme(page, theme);
      const colors = await probeColors(page);

      await expect(page.locator("body")).toHaveCount(1);
      const body = await page.locator("body").evaluate((node) => {
        const style = getComputedStyle(node);
        return { background: style.backgroundColor, color: style.color };
      });
      if (requireToken(colors.ink, "ink", `${path} body color`)) {
        softRole(body.color, colors.ink, `${path} body color`);
      }
      if (requireToken(colors.surface, "surface", `${path} fundo do body`)) {
        softRole(body.background, colors.surface, `${path} fundo do body`);
      }

      const footer = page.getByRole("contentinfo");
      await expect(footer).toHaveCount(1);
      const muted = await footer.evaluate(
        (node) => getComputedStyle(node).color,
      );
      if (requireToken(colors.muted, "muted", `${path} footer`)) {
        softRole(muted, colors.muted, `${path} footer`);
      }

      if (path === fixtureMd.href) {
        const pres = page.getByRole("article").locator("pre.astro-code");
        const region = page.getByRole("region", {
          name: "Apêndice",
          exact: true,
        });
        await expect(pres).not.toHaveCount(0);
        await expect(region, `${path} region Apêndice`).toHaveCount(1);

        const count = await pres.count();
        for (let index = 0; index < count; index += 1) {
          const paint = await pres.nth(index).evaluate((node) => {
            const style = getComputedStyle(node);
            return {
              background: style.backgroundColor,
              border: style.borderTopColor,
            };
          });
          const sheetWhere = `${path} fundo do pre`;
          const lineWhere = `${path} borda do pre`;
          if (requireToken(colors.sheet, "sheet", sheetWhere)) {
            softRole(paint.background, colors.sheet, sheetWhere);
          }
          if (requireToken(colors.line, "line", lineWhere)) {
            softRole(paint.border, colors.line, lineWhere);
          }
        }

        // T-117: sem faixa sheet; o rótulo de cada seção tem filete em
        // tinta e os itens das citações são separados por tracejado em line.
        const labels = region.locator("[data-appendix-label]");
        const labelCount = await labels.count();
        expect(labelCount, `${path} rótulos`).toBeGreaterThan(0);
        for (let index = 0; index < labelCount; index += 1) {
          const paint = await labels.nth(index).evaluate((node) => {
            const style = getComputedStyle(node);
            return { color: style.color, border: style.borderBottomColor };
          });
          const labelWhere = `${path} rótulo[${index}]`;
          if (requireToken(colors.muted, "muted", labelWhere)) {
            softRole(paint.color, colors.muted, labelWhere);
          }
          const ruleWhere = `${path} filete do rótulo[${index}]`;
          if (requireToken(colors.ink, "ink", ruleWhere)) {
            softRole(paint.border, colors.ink, ruleWhere);
          }
        }

        const groupLabels = region.locator("h3");
        const groupCount = await groupLabels.count();
        expect(groupCount, `${path} h3`).toBeGreaterThan(0);
        for (let index = 0; index < groupCount; index += 1) {
          const color = await groupLabels
            .nth(index)
            .evaluate((node) => getComputedStyle(node).color);
          const where = `${path} h3[${index}]`;
          if (requireToken(colors.muted, "muted", where)) {
            softRole(color, colors.muted, where);
          }
        }

        const metas = region.locator("ol > li > p");
        const metaCount = await metas.count();
        expect(metaCount, `${path} li > p`).toBeGreaterThan(0);
        for (let index = 0; index < metaCount; index += 1) {
          const color = await metas
            .nth(index)
            .evaluate((node) => getComputedStyle(node).color);
          const where = `${path} li > p[${index}]`;
          if (requireToken(colors.muted, "muted", where)) {
            softRole(color, colors.muted, where);
          }
        }

        const bandItems = region.locator("ol > li");
        const bandItemCount = await bandItems.count();
        expect(bandItemCount, `${path} li`).toBeGreaterThan(0);
        for (let index = 0; index < bandItemCount; index += 1) {
          const paint = await bandItems.nth(index).evaluate((node) => {
            const number = node.querySelector("[data-citation-n]");
            return {
              number: number ? getComputedStyle(number).color : "",
              dash: getComputedStyle(node).borderBottomColor,
            };
          });
          const where = `${path} [n][${index}]`;
          if (requireToken(colors.muted, "muted", where)) {
            softRole(paint.number, colors.muted, where);
          }
          const dashWhere = `${path} tracejado[${index}]`;
          if (requireToken(colors.line, "line", dashWhere)) {
            softRole(paint.dash, colors.line, dashWhere);
          }
        }

        const bandLinks = region.locator("a");
        const bandCount = await bandLinks.count();
        expect(bandCount, `${path} faixa`).toBeGreaterThan(0);
        linkTotal += bandCount;
        for (let index = 0; index < bandCount; index += 1) {
          await expect(bandLinks.nth(index)).toBeAttached();
          const color = await bandLinks
            .nth(index)
            .evaluate((node) => getComputedStyle(node).color);
          const where = `${path} faixa a[${index}]`;
          if (requireToken(colors.accent, "accent", where)) {
            if (colorsMatch(color, colors.accent)) passed.push(where);
            softRole(color, colors.accent, where);
          }
        }
      }

      if (!isPostPath(path)) continue;
      const links = page.locator("article .prose a:not(.not-prose a)");
      const count = await links.count();
      linkTotal += count;
      for (let index = 0; index < count; index += 1) {
        await expect(links.nth(index)).toBeAttached();
        const color = await links
          .nth(index)
          .evaluate((node) => getComputedStyle(node).color);
        const where = `${path} .prose a[${index}]`;
        // O mapa links → accent existe desde a T-09. O valor de accent é o
        // T1 que confere. Este assert passa antes da implementação de
        // propósito; a M10 troca --tw-prose-links para ink e derruba a guarda.
        if (requireToken(colors.accent, "accent", where)) {
          if (colorsMatch(color, colors.accent)) passed.push(where);
          softRole(color, colors.accent, where);
        }
      }

      if (path === fixtureMdx.href) {
        const wasm = await paintOf(page, "Abrir no marimo");
        const gpu = await paintOf(page, "Abrir com GPU");
        softRole(wasm.color, colors.surface, `${path} Abrir no marimo texto`);
        softRole(wasm.background, colors.ink, `${path} Abrir no marimo fundo`);
        softRole(gpu.color, colors.ink, `${path} Abrir com GPU texto`);
        softRole(gpu.border, colors.ink, `${path} Abrir com GPU borda`);
      }
    }

    console.log(`T2 ${label} passou:\n${passed.join("\n") || "(nada)"}`);
    expect(linkTotal, "nenhum link na prosa dos posts").toBeGreaterThan(0);
  });
}

async function paintOf(page: Page, name: string) {
  const link = page
    .getByRole("article")
    .getByRole("link", { name, exact: true });
  await expect(link, name).toHaveCount(1);
  return link.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      color: style.color,
      background: style.backgroundColor,
      border: style.borderTopColor,
    };
  });
}

test("T4 contraste na paleta escura", async ({ page }) => {
  test.setTimeout(60_000);
  const pages = await pagesForTheme(page);

  for (const path of pages) {
    await test.step(path, async () => {
      await open(page, path);
      await applyTheme(page, "dark");
      // Desde a T-24, o código lê --shiki-dark no tema escuro e entra no axe.
      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical",
      );
      expect(blocking.map((violation) => violation.id)).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// RF-17, T-24: o controle de tema, a escolha gravada, o sistema e o flash.

const themeKey = "pk-theme";

function themeGroup(page: Page) {
  return page.getByRole("banner").getByRole("group", {
    name: "Tema",
    exact: true,
  });
}

function themeButton(page: Page, name: "Claro" | "Escuro") {
  return themeGroup(page).getByRole("button", { name, exact: true });
}

async function rootTheme(page: Page) {
  return page.evaluate(() => document.documentElement.dataset.theme);
}

async function storedTheme(page: Page) {
  return page.evaluate((key) => localStorage.getItem(key), themeKey);
}

async function bodyBackground(page: Page) {
  return page
    .locator("body")
    .evaluate((node) => getComputedStyle(node).backgroundColor);
}

function rgbOf(value: Channels) {
  return `rgb(${value.r}, ${value.g}, ${value.b})`;
}

async function expectPressed(page: Page, theme: "light" | "dark") {
  await expect(themeButton(page, "Claro")).toHaveAttribute(
    "aria-pressed",
    theme === "light" ? "true" : "false",
  );
  await expect(themeButton(page, "Escuro")).toHaveAttribute(
    "aria-pressed",
    theme === "dark" ? "true" : "false",
  );
}

test.describe("tema [RF-17]", () => {
  test("T5 controle segmentado no header [BRAND §9.9]", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await open(page, "/");
    const group = themeGroup(page);
    await expect(group).toBeVisible();
    await expect(group.getByRole("button")).toHaveCount(2);
    await expectPressed(page, "light");

    for (const name of ["Claro", "Escuro"] as const) {
      const box = await themeButton(page, name).boundingBox();
      expect(box, name).not.toBeNull();
      if (!box) return;
      expect(Math.round(box.width), name).toBe(36);
      expect(Math.round(box.height), name).toBe(32);
      await expect(themeButton(page, name).locator("svg")).toHaveCount(1);
    }

    const colors = await probeColors(page);
    const active = await themeButton(page, "Claro").evaluate((node) => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, color: style.color };
    });
    expect(colorsMatch(active.background, colors.ink)).toBe(true);
    expect(colorsMatch(active.color, colors.surface)).toBe(true);
    const idle = await themeButton(page, "Escuro").evaluate(
      (node) => getComputedStyle(node).color,
    );
    expect(colorsMatch(idle, colors.muted)).toBe(true);
    await expect(group).toHaveCSS("border-top-left-radius", "6px");
  });

  test("T6 a escolha grava e aplica data-theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await open(page, fixtureMd.href);
    await themeButton(page, "Escuro").click();
    expect(await rootTheme(page)).toBe("dark");
    expect(await storedTheme(page)).toBe("dark");
    await expectPressed(page, "dark");
    expect(colorsMatch(await bodyBackground(page), rgbOf(dark.surface))).toBe(
      true,
    );

    await page.reload();
    expect(await rootTheme(page)).toBe("dark");
    await expectPressed(page, "dark");

    await page.emulateMedia({ colorScheme: "dark" });
    await themeButton(page, "Claro").click();
    expect(await storedTheme(page)).toBe("light");
    await page.reload();
    expect(await rootTheme(page)).toBe("light");
    await expectPressed(page, "light");
    expect(colorsMatch(await bodyBackground(page), rgbOf(light.surface))).toBe(
      true,
    );
  });

  test("T7 sem escolha, segue o sistema", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await open(page, "/");
    expect(await rootTheme(page)).toBe("dark");
    await expectPressed(page, "dark");
    expect(await storedTheme(page)).toBeNull();

    await page.emulateMedia({ colorScheme: "light" });
    await expect.poll(() => rootTheme(page)).toBe("light");
    await expectPressed(page, "light");

    await page.reload();
    expect(await rootTheme(page)).toBe("light");

    // Com escolha gravada, a troca do sistema não muda a página.
    await themeButton(page, "Claro").click();
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(100);
    expect(await rootTheme(page)).toBe("light");
  });

  for (const source of ["escolha", "sistema"] as const) {
    test(`T8 sem flash (${source})`, async ({ page }) => {
      await page.emulateMedia({
        colorScheme: source === "sistema" ? "dark" : "light",
      });
      await page.addInitScript(
        ({ key, store }) => {
          if (store) localStorage.setItem(key, "dark");
          const record = window as unknown as { __themeAtBody?: string };
          new MutationObserver((records, observer) => {
            for (const item of records) {
              for (const node of item.addedNodes) {
                if (node.nodeName !== "BODY") continue;
                record.__themeAtBody =
                  document.documentElement.dataset.theme ?? "(nenhum)";
                observer.disconnect();
                return;
              }
            }
          }).observe(document, { childList: true, subtree: true });
        },
        { key: themeKey, store: source === "escolha" },
      );
      await open(page, fixtureMd.href);
      const atBody = await page.evaluate(
        () => (window as unknown as { __themeAtBody?: string }).__themeAtBody,
      );
      expect(atBody).toBe("dark");

      const head = await page.evaluate(() =>
        [...document.head.querySelectorAll("script")]
          .filter((script) => (script.textContent ?? "").includes("pk-theme"))
          .map((script) => ({
            type: script.getAttribute("type"),
            src: script.hasAttribute("src"),
            async: script.hasAttribute("async"),
            defer: script.hasAttribute("defer"),
          })),
      );
      expect(head).toEqual([
        { type: null, src: false, async: false, defer: false },
      ]);
    });
  }

  test("T10 figuras no escuro [RF-09, BRAND §9.8]", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await open(page, fixtureMdx.href);
    expect(await rootTheme(page)).toBe("dark");
    const figures = page.locator("svg[data-viz]");
    const count = await figures.count();
    expect(count).toBeGreaterThan(0);
    const darkRgb = new Set(Object.values(dark).map(rgbOf));
    const lightOnly = new Set(
      Object.values(light)
        .map(rgbOf)
        .filter((color) => !darkRgb.has(color)),
    );

    let painted = 0;
    for (let index = 0; index < count; index += 1) {
      const paints = await figures.nth(index).evaluate((svg) => {
        // Só os elementos que pintam: svg, g, title e pattern herdam o fill
        // preto padrão do SVG sem desenhar nada.
        const out: string[] = [];
        const shapes =
          "rect, circle, ellipse, line, path, polygon, polyline, text, tspan";
        for (const node of svg.querySelectorAll(shapes)) {
          const style = getComputedStyle(node);
          for (const value of [style.fill, style.stroke]) {
            if (!value || value === "none" || value.startsWith("url(")) {
              continue;
            }
            out.push(value);
          }
        }
        return out;
      });
      for (const value of paints) {
        let parsed: Channels;
        try {
          parsed = channels(value);
        } catch {
          expect.soft(false, `figura ${index}: cor ${value}`).toBe(true);
          continue;
        }
        if (parsed.a === 0) continue;
        painted += 1;
        const rgb = rgbOf(parsed);
        expect
          .soft(lightOnly.has(rgb), `figura ${index}: ${rgb} é clara`)
          .toBe(false);
        expect
          .soft(darkRgb.has(rgb), `figura ${index}: ${rgb} fora da paleta`)
          .toBe(true);
      }
    }
    expect(painted).toBeGreaterThan(0);
  });
});

test.describe("tema sem JavaScript [RF-17]", () => {
  test.use({ javaScriptEnabled: false });

  for (const scheme of ["light", "dark"] as const) {
    test(`T9 segue o sistema ${scheme === "light" ? "claro" : "escuro"}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await open(page, fixtureMd.href);
      await expect(themeGroup(page)).toBeHidden();
      const colors = await probeColors(page);
      const table = scheme === "light" ? light : dark;
      for (const token of tokens) {
        const got = channels(colors[token]);
        const want = table[token];
        expect
          .soft(
            rgbOf(got) === rgbOf(want) &&
              Math.round(got.a * 255) === Math.round(want.a * 255),
            `${scheme} ${token}: ${colors[token]}`,
          )
          .toBe(true);
      }
    });
  }
});
