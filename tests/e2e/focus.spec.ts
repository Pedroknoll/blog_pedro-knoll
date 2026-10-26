import { expect, test, type Page } from "@playwright/test";

import { pagesForTheme } from "./published-posts";

type Channels = { r: number; g: number; b: number; a: number };

type FocusHit = {
  key: string;
  label: string;
  outlineStyle: string;
  outlineWidth: string;
  outlineOffset: string;
  outlineColor: string;
  clipped: string[];
  inPre: boolean;
  card: boolean;
  copyButton: boolean;
  tagFilter: boolean;
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

async function accentProbe(page: Page) {
  await page.evaluate(() => {
    const el = document.createElement("span");
    el.dataset.probe = "accent";
    el.style.color = "var(--color-accent)";
    el.textContent = "accent";
    document.body.append(el);
  });
  const probe = page.locator('[data-probe="accent"]');
  await expect(probe).toHaveCount(1);
  return probe.evaluate((node) => getComputedStyle(node).color);
}

async function walk(
  page: Page,
): Promise<{ hits: FocusHit[]; closed: boolean }> {
  const hits: FocusHit[] = [];
  let firstKey: string | null = null;

  for (let step = 0; step < 200; step += 1) {
    await page.keyboard.press("Tab");
    const hit = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) {
        return { kind: "body" as const };
      }
      const node = el as HTMLElement;
      if (!node.dataset.focusWalk) {
        const seq =
          Number(document.documentElement.dataset.focusSeq ?? "0") + 1;
        document.documentElement.dataset.focusSeq = String(seq);
        node.dataset.focusWalk = String(seq);
      }
      const style = getComputedStyle(node);
      const width = Number.parseFloat(style.outlineWidth);
      const offset = Number.parseFloat(style.outlineOffset);
      const extra =
        (Number.isFinite(width) ? width : 0) +
        (Number.isFinite(offset) ? offset : 0);
      const rect = node.getBoundingClientRect();
      const box = {
        left: rect.left - extra,
        top: rect.top - extra,
        right: rect.right + extra,
        bottom: rect.bottom + extra,
      };
      const clipped = new Set<string>();
      let parent = node.parentElement;
      while (
        parent &&
        parent !== document.body &&
        parent !== document.documentElement
      ) {
        const parentStyle = getComputedStyle(parent);
        if (
          parentStyle.overflowX !== "visible" ||
          parentStyle.overflowY !== "visible"
        ) {
          const host = parent.getBoundingClientRect();
          const left = host.left + parent.clientLeft;
          const top = host.top + parent.clientTop;
          const right = left + parent.clientWidth;
          const bottom = top + parent.clientHeight;
          const tol = 0.5;
          if (box.left < left - tol) clipped.add("esquerda");
          if (box.right > right + tol) clipped.add("direita");
          if (box.top < top - tol) clipped.add("topo");
          if (box.bottom > bottom + tol) clipped.add("base");
        }
        parent = parent.parentElement;
      }
      const aria = node.getAttribute("aria-label");
      const text = (node.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 60);
      const tag = node.tagName.toLowerCase();
      const id = node.id ? `#${node.id}` : "";
      return {
        kind: "el" as const,
        key: node.dataset.focusWalk ?? "",
        label: `${tag}${id} "${aria || text}"`,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineOffset: style.outlineOffset,
        outlineColor: style.outlineColor,
        clipped: [...clipped],
        inPre:
          node.matches("pre.astro-code") ||
          node.closest("pre.astro-code") !== null,
        card:
          node.matches("a") &&
          node.closest("h2") !== null &&
          node.closest("article") !== null,
        copyButton: node.matches("button.code-copy-button"),
        tagFilter: node.closest('nav[aria-label="Filtrar por tag"]') !== null,
      };
    });

    if (hit.kind === "body") return { hits, closed: true };
    if (firstKey === null) firstKey = hit.key;
    else if (hit.key === firstKey) return { hits, closed: true };
    hits.push(hit);
  }

  return { hits, closed: false };
}

for (const viewport of [1280, 360]) {
  for (const theme of ["light", "dark"] as const) {
    const label = theme === "light" ? "claro" : "escuro";

    test(`T3 foco ${viewport} ${label}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width: viewport, height: 800 });
      const pages = await pagesForTheme(page);
      const errors: string[] = [];
      let sawCard = false;
      let sawCopy = false;
      let sawFilter = false;

      for (const path of pages) {
        await open(page, path);
        await applyTheme(page, theme);
        const accent = await accentProbe(page);
        const { hits, closed } = await walk(page);
        const preInTab = hits.some((hit) => hit.inPre);
        console.log(
          `T3 ${viewport}px ${label} ${path}: pre.astro-code na ordem de Tab: ${preInTab ? "sim" : "não"}`,
        );

        if (!closed) {
          errors.push(`${path} @ ${viewport}px não fechou o ciclo de Tab`);
        }
        if (hits.length === 0) {
          errors.push(`${path} @ ${viewport}px sem focável`);
        }

        for (const hit of hits) {
          if (hit.card) sawCard = true;
          if (hit.copyButton) sawCopy = true;
          if (hit.tagFilter) sawFilter = true;
          const where = `${path} @ ${viewport}px ${hit.label}`;
          if (hit.outlineStyle !== "solid") {
            errors.push(`${where} outline-style ${hit.outlineStyle}`);
          }
          if (hit.outlineWidth !== "2px") {
            errors.push(`${where} outline-width ${hit.outlineWidth}`);
          }
          if (hit.outlineOffset !== "3px") {
            errors.push(`${where} outline-offset ${hit.outlineOffset}`);
          }
          if (!colorsMatch(hit.outlineColor, accent)) {
            errors.push(
              `${where} outline-color ${hit.outlineColor} ≠ accent ${accent}`,
            );
          }
          for (const side of hit.clipped) {
            errors.push(`${where} recortou ${side}`);
          }
        }
      }

      if (!sawCard) errors.push("nenhum card no conjunto");
      if (!sawCopy)
        errors.push("botão de copiar do post B ausente no conjunto");
      if (!sawFilter) errors.push("link da TagFilter ausente no conjunto");
      expect(errors).toEqual([]);
    });
  }
}
