import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { pagesForTheme } from "./published-posts";

const postB = "/blog/2026-10-como-o-blog-e-feito/";

const tokens = [
  "surface",
  "sheet",
  "ink",
  "muted",
  "pencil",
  "line",
  "accent",
  "kind-concept",
  "kind-tutorial",
  "kind-lab",
  "kind-playbook",
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
  "kind-concept": { r: 31, g: 75, b: 122, a: 1 },
  "kind-tutorial": { r: 132, g: 96, b: 26, a: 1 },
  "kind-lab": { r: 163, g: 57, b: 42, a: 1 },
  "kind-playbook": { r: 46, g: 107, b: 90, a: 1 },
};

const dark: Record<Token, Channels> = {
  surface: { r: 14, g: 34, b: 54, a: 1 },
  sheet: { r: 22, g: 50, b: 80, a: 1 },
  ink: { r: 232, g: 238, b: 243, a: 1 },
  muted: { r: 169, g: 186, b: 203, a: 1 },
  pencil: { r: 134, g: 158, b: 182, a: 1 },
  line: { r: 232, g: 238, b: 243, a: 0.18 },
  accent: { r: 141, g: 184, b: 232, a: 1 },
  "kind-concept": { r: 141, g: 184, b: 232, a: 1 },
  "kind-tutorial": { r: 217, g: 184, b: 92, a: 1 },
  "kind-lab": { r: 238, g: 138, b: 116, a: 1 },
  "kind-playbook": { r: 124, g: 199, b: 174, a: 1 },
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
      expect.soft(Math.abs(got.a - want.a), token).toBeLessThanOrEqual(0.001);
    }

    if (!isMissing(colors["kind-concept"]) && !isMissing(colors.accent)) {
      const alias = channels(colors["kind-concept"]);
      const accent = channels(colors.accent);
      expect.soft(alias.r, "kind-concept").toBe(accent.r);
      expect.soft(alias.g, "kind-concept").toBe(accent.g);
      expect.soft(alias.b, "kind-concept").toBe(accent.b);
      expect
        .soft(Math.abs(alias.a - accent.a), "kind-concept")
        .toBeLessThanOrEqual(0.001);
    }
  });

  test(`T2 papéis ${theme === "light" ? "claros" : "escuros"}`, async ({
    page,
  }) => {
    const pages = await pagesForTheme(page);
    const posts = pages.filter((path) => path.startsWith("/blog/"));
    expect(posts).toContain(postB);

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

      if (path === postB) {
        const pres = page.getByRole("article").locator("pre.astro-code");
        await expect(pres).not.toHaveCount(0);
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
      }

      if (!path.startsWith("/blog/")) continue;
      const links = page.locator("article .prose a");
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
    }

    console.log(`T2 ${label} passou:\n${passed.join("\n") || "(nada)"}`);
    expect(linkTotal, "nenhum link na prosa dos posts").toBeGreaterThan(0);
  });
}

test("T4 contraste na paleta escura", async ({ page }) => {
  test.setTimeout(60_000);
  const pages = await pagesForTheme(page);

  for (const path of pages) {
    await test.step(path, async () => {
      await open(page, path);
      await applyTheme(page, "dark");
      // O CSS só lê --shiki-light até a T-24. Com data-theme="dark",
      // a sintaxe clara fica sobre a folha escura e o contraste cairia
      // por um motivo que esta tarefa não corrige.
      const results = await new AxeBuilder({ page })
        .exclude("pre.astro-code")
        .analyze();
      const blocking = results.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical",
      );
      expect(blocking.map((violation) => violation.id)).toEqual([]);
    });
  }
});
