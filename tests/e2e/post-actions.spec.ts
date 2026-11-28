import { expect, test, type Page } from "@playwright/test";

import { fixtureMdx, fixtureSemTitulos } from "./fixtures";
import { blockGiscus } from "./giscus";

// O widget de giscus.app não entra nestes testes (RF-19, T-28).
test.beforeEach(async ({ page }) => {
  await blockGiscus(page);
});

// Bloco de voto e compartilhar (RF-23, T-130, BRAND §9.14) na `fixture-mdx`
// (4 h2, com índice) e na `fixture-sem-titulos` (sem índice).

// Chrome conta o ponto se ele muda pelo menos 3 px (https://wicg.github.io/layout-instability).
const PIXELS_TO_SIGNIFICANCE = 3;
const GAP_TO_TOC = 40;

function rail(page: Page) {
  return page.locator('[data-post-actions="rail"]');
}

function end(page: Page) {
  return page.locator('[data-post-actions="end"]');
}

async function open(page: Page, href: string, width = 1280, height = 800) {
  await page.setViewportSize({ width, height });
  await page.route("**/api/votes", (route) => route.abort());
  const response = await page.goto(href);
  expect(response?.status()).toBe(200);
}

async function scrollPage(page: Page, top: number) {
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    top,
  );
  await nextFrames(page);
}

async function nextFrames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      }),
  );
}

/** Rola até o filete do cabeçalho sair da tela por 200 px. */
async function scrollPastHeader(page: Page) {
  const bottom = await page
    .locator("[data-post-header]")
    .evaluate((element) => element.getBoundingClientRect().bottom + scrollY);
  await scrollPage(page, bottom + 200);
}

async function resolveColor(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, token);
}

async function rect(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, height: box.height };
  });
}

async function postUrl(page: Page) {
  return page.evaluate(() => {
    const link = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    return new URL(location.pathname, link?.href ?? location.href).href;
  });
}

test.describe("bloco de voto e compartilhar [RF-23]", () => {
  test("forma: fio, voto, Compartilhar e um link por linha", async ({
    page,
  }) => {
    await open(page, fixtureMdx.href);
    await scrollPastHeader(page);
    const block = rail(page);
    await expect(block).toHaveAttribute("data-shown", "");
    await expect(block).toBeVisible();

    const line = await resolveColor(page, "--color-line");
    await expect(block).toHaveCSS("border-top-width", "1px");
    await expect(block).toHaveCSS("border-top-color", line);
    const surface = await resolveColor(page, "--color-surface");
    await expect(block).toHaveCSS("background-color", surface);

    await expect(block.getByRole("button", { name: "Votar" })).toBeVisible();
    await expect(
      block.getByText("Compartilhar", { exact: true }),
    ).toBeVisible();

    const url = await postUrl(page);
    const title = fixtureMdx.title;
    const links = block.locator("[data-share-links] a");
    await expect(links).toHaveText(["X.com", "LinkedIn", "E-mail"]);
    await expect(links.nth(0)).toHaveAttribute(
      "href",
      `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    );
    await expect(links.nth(1)).toHaveAttribute(
      "href",
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    );
    await expect(links.nth(2)).toHaveAttribute(
      "href",
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
    );

    const copy = block.getByRole("button", { name: "Copiar link" });
    await expect(copy).toBeVisible();

    // Os quatro numa linha, nesta ordem, dentro da largura do bloco, em
    // caixa normal; Compartilhar em mono 12 px, grafite.
    const items = block.locator("[data-share-links] > *");
    await expect(items).toHaveText([
      "X.com",
      "LinkedIn",
      "E-mail",
      "Copiar link",
    ]);
    const boxes = await items.evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        return { top: box.top, right: box.right };
      }),
    );
    const blockRight = await block.evaluate(
      (element) => element.getBoundingClientRect().right,
    );
    for (const item of boxes) {
      expect(Math.abs(item.top - (boxes[0]?.top ?? 0))).toBeLessThanOrEqual(1);
      expect(item.right).toBeLessThanOrEqual(blockRight + 0.5);
    }
    await expect(items.first()).toHaveCSS("text-transform", "none");
    const label = block.locator("[data-share-label]");
    await expect(label).toHaveCSS("font-size", "12px");
    await expect(label).toHaveCSS(
      "color",
      await resolveColor(page, "--color-muted"),
    );
    await expect(block.locator("[data-vote-label]")).toHaveCSS(
      "font-weight",
      "600",
    );

    // A ordem no bloco: o voto, depois Compartilhar, depois os links.
    const order = await block.evaluate((element) => {
      const vote = element.querySelector("[data-post-vote]");
      const label = element.querySelector("[data-share-label]");
      const list = element.querySelector("[data-share-links]");
      if (!vote || !label || !list) return false;
      return (
        Boolean(
          vote.compareDocumentPosition(label) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ) &&
        Boolean(
          label.compareDocumentPosition(list) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        )
      );
    });
    expect(order).toBe(true);
  });

  test("aparece depois do filete, some no topo e escondido não recebe foco", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, fixtureMdx.href);
    const block = rail(page);
    await expect(block).not.toHaveAttribute("data-shown");
    await expect(block).toHaveCSS("visibility", "hidden");
    await expect(block).toBeHidden();

    // Tab pela página inteira nunca cai dentro do bloco escondido.
    const focusables = await page.evaluate(
      () =>
        document.querySelectorAll(
          "a[href], button:not([disabled]), input, select, textarea, [tabindex]",
        ).length,
    );
    for (let index = 0; index < focusables + 2; index += 1) {
      await page.keyboard.press("Tab");
      const inside = await block.evaluate((element) =>
        element.contains(document.activeElement),
      );
      expect(inside).toBe(false);
    }

    await scrollPage(page, 0);
    await scrollPastHeader(page);
    await expect(block).toHaveAttribute("data-shown", "");
    await expect(block).toHaveCSS("visibility", "visible");
    await expect(block).toHaveCSS("opacity", "1");

    await scrollPage(page, 0);
    await expect(block).not.toHaveAttribute("data-shown");
    await expect(block).toHaveCSS("visibility", "hidden");
  });

  test("movimento: fade e deslize de 8 px em 0,25 s; sem animação com reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await open(page, fixtureMdx.href);
    const block = rail(page);
    await expect(block).toHaveCSS("opacity", "0");
    await expect(block).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 8)");
    // O estado do carregamento entra sem animação; a transição volta depois.
    await expect(block).not.toHaveAttribute("data-instant");
    const durations = await block.evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    );
    expect(durations.split(",")[0]?.trim()).toBe("0.25s");
    const properties = await block.evaluate(
      (element) => getComputedStyle(element).transitionProperty,
    );
    expect(properties).toContain("opacity");
    expect(properties).toContain("transform");
    expect(properties).not.toMatch(/\b(top|bottom|height|margin)\b/);

    await scrollPastHeader(page);
    await expect(block).toHaveCSS("opacity", "1");
    await expect(block).toHaveCSS("transform", "none");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(block).toHaveCSS("transition-duration", "0s");
  });

  test("Copiar link grava a URL e vira Copiado por 1,5 s", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await open(page, fixtureMdx.href);
    await scrollPastHeader(page);
    const block = rail(page);
    const copy = block.locator("[data-share-copy]");
    await expect(copy).toHaveText("Copiar link");
    await expect(copy).toHaveAttribute("aria-label", "Copiar link");
    await copy.click();
    await expect(copy).toHaveText("Copiado");
    // Copiado não quebra a linha dos links.
    const tops = await block
      .locator("[data-share-links] > *")
      .evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().top),
      );
    expect(new Set(tops).size).toBe(1);
    await expect(copy).toHaveAttribute("aria-label", "Link copiado");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      await postUrl(page),
    );
    await expect(copy).toHaveText("Copiar link", { timeout: 3000 });
    await expect(copy).toHaveAttribute("aria-label", "Copiar link");
  });

  test("preso embaixo na leitura; no fim, para na coluna e o índice sobe 40 px acima", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, fixtureMdx.href);
    const viewport = 800;

    // No meio do texto, o bloco encosta na borda de baixo da tela.
    const prose = await page
      .locator("article [data-pagefind-body]")
      .evaluate((element) => {
        const box = element.getBoundingClientRect();
        return { top: box.top + scrollY, bottom: box.bottom + scrollY };
      });
    await scrollPage(page, prose.top + (prose.bottom - prose.top) / 2 - 400);
    const middle = await rect(page, '[data-post-actions="rail"]');
    expect(Math.abs(middle.bottom - viewport)).toBeLessThanOrEqual(1.5);
    // O último link fica a 48 px (3rem de respiro) da borda de baixo.
    const lastLink = await page
      .locator('[data-post-actions="rail"] [data-share-links] > *')
      .last()
      .evaluate((element) => element.getBoundingClientRect().bottom);
    expect(viewport - lastLink).toBeGreaterThanOrEqual(47);
    const tocMiddle = await rect(page, "[data-post-toc]");
    expect(tocMiddle.bottom).toBeLessThanOrEqual(middle.top);
    // O índice preso fica a mesma distância do topo que o último link do
    // bloco fica da borda de baixo.
    expect(Math.abs(tocMiddle.top - (viewport - lastLink))).toBeLessThanOrEqual(
      1.5,
    );

    // No fim, o bloco para no fim da prosa e o índice fica 40 px acima dele.
    // Com o índice preso a 3rem do topo, o bloco só o alcança mais adiante.
    await scrollPage(page, prose.bottom - viewport + 500);
    const block = await rect(page, '[data-post-actions="rail"]');
    const proseBottom = await page
      .locator("article [data-pagefind-body]")
      .evaluate((element) => element.getBoundingClientRect().bottom);
    expect(Math.abs(block.bottom - proseBottom)).toBeLessThanOrEqual(1.5);
    expect(block.bottom).toBeLessThan(viewport - 50);
    const toc = await rect(page, "[data-post-toc]");
    expect(Math.abs(block.top - toc.bottom - GAP_TO_TOC)).toBeLessThanOrEqual(
      1.5,
    );
  });

  test("post curto, sem índice: aparece com o fim do texto na tela e fica no fim da coluna", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, fixtureSemTitulos.href);
    await expect(page.locator("[data-post-toc]")).toHaveCount(0);
    // O filete continua na tela, mas o fim do texto também: o bloco aparece.
    const header = await rect(page, "[data-post-header]");
    expect(header.bottom).toBeGreaterThan(0);
    await expect(rail(page)).toHaveAttribute("data-shown", "");
    await expect(rail(page)).toBeVisible();
    await expect(rail(page)).toHaveCSS("position", "sticky");

    const block = await rect(page, '[data-post-actions="rail"]');
    const proseBottom = await page
      .locator("article [data-pagefind-body]")
      .evaluate((element) => element.getBoundingClientRect().bottom);
    expect(Math.abs(block.bottom - proseBottom)).toBeLessThanOrEqual(1.5);
  });

  test("o estado do carregamento entra sem animação", async ({ page }) => {
    // Post curto: o bloco já aparece no carregamento. Sem o fade, nenhuma
    // leitura (axe, leitor) o pega com opacidade parcial.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await open(page, fixtureSemTitulos.href);
    const opacity = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          const block = document.querySelector<HTMLElement>(
            '[data-post-actions="rail"]',
          );
          if (!block) throw new Error("sem bloco");
          const read = () => resolve(getComputedStyle(block).opacity);
          if (block.hasAttribute("data-shown")) {
            read();
            return;
          }
          new MutationObserver((_, observer) => {
            if (!block.hasAttribute("data-shown")) return;
            observer.disconnect();
            read();
          }).observe(block, { attributes: true });
        }),
    );
    expect(opacity).toBe("1");

    // Depois do carregamento, a rolagem volta a animar.
    await expect(rail(page)).not.toHaveAttribute("data-instant");
    await expect(rail(page)).toHaveCSS("transition-duration", /^0\.25s/);
  });

  test("aparecer e sumir não move nenhum elemento fora do bloco", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, fixtureMdx.href);
    await scrollPastHeader(page);
    const block = rail(page);
    await expect(block).toHaveAttribute("data-shown", "");

    // Na mesma rolagem, tira e devolve o data-shown e mede a posição na tela
    // de tudo que está fora do bloco.
    const snapshot = () =>
      page.evaluate(() => {
        const actions = document.querySelector('[data-post-actions="rail"]');
        return [...document.querySelectorAll("body *")]
          .filter((element) => !actions?.contains(element))
          .map((element) => element.getBoundingClientRect().top);
      });
    const shown = await snapshot();
    await block.evaluate((element) => element.removeAttribute("data-shown"));
    await expect(block).toHaveCSS("visibility", "hidden");
    await nextFrames(page);
    const hidden = await snapshot();
    expect(hidden.length).toBe(shown.length);
    const moved = hidden.filter(
      (top, index) =>
        Math.abs(top - (shown[index] ?? top)) >= PIXELS_TO_SIGNIFICANCE,
    );
    expect(moved).toEqual([]);
  });

  test("abaixo de lg: no fim do texto, parado, sem animação", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await open(page, fixtureMdx.href, 360);
    await expect(rail(page)).toBeHidden();
    const block = end(page);
    await expect(block).toBeVisible();
    await expect(block).toHaveCSS("position", "static");
    await expect(block).toHaveCSS("opacity", "1");
    await expect(block).toHaveCSS("transform", "none");
    await expect(block).toHaveCSS("transition-duration", "0s");
    await expect(block.getByRole("button", { name: "Votar" })).toBeVisible();
    await expect(block.locator("[data-share-links] a")).toHaveText([
      "X.com",
      "LinkedIn",
      "E-mail",
    ]);
    await expect(block.locator("[data-share-copy]")).toHaveCount(1);

    const placed = await block.evaluate((element) => {
      const prose = document.querySelector("article > .prose");
      const appendix = document.querySelector("section[aria-label='Apêndice']");
      if (!prose || !appendix) return null;
      return {
        afterProse: Boolean(
          prose.compareDocumentPosition(element) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
        beforeAppendix: Boolean(
          element.compareDocumentPosition(appendix) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
        gap:
          element.getBoundingClientRect().top -
          prose.getBoundingClientRect().bottom,
      };
    });
    expect(placed).toEqual({ afterProse: true, beforeAppendix: true, gap: 40 });
  });

  test.describe("sem JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("a 1280, parado abaixo do índice, com o aviso e os três links", async ({
      page,
    }) => {
      await open(page, fixtureMdx.href);
      const block = rail(page);
      await expect(block).toBeVisible();
      await expect(block).toHaveCSS("opacity", "1");
      await expect(block).toContainText("O voto precisa de JavaScript.");
      await expect(block.locator("[data-share-links] a")).toHaveText([
        "X.com",
        "LinkedIn",
        "E-mail",
      ]);
      await expect(block.getByText("Copiar link")).toHaveCount(0);

      const toc = await rect(page, "[data-post-toc]");
      const box = await rect(page, '[data-post-actions="rail"]');
      expect(box.top).toBeGreaterThan(toc.bottom);
      expect(box.top - toc.bottom).toBeLessThanOrEqual(GAP_TO_TOC);

      // Índice e bloco ficam presos juntos no topo ao rolar.
      await page.evaluate(() =>
        window.scrollTo({ top: 1500, behavior: "instant" }),
      );
      const tocAfter = await rect(page, "[data-post-toc]");
      const boxAfter = await rect(page, '[data-post-actions="rail"]');
      expect(boxAfter.top - tocAfter.bottom).toBeCloseTo(
        box.top - toc.bottom,
        0,
      );
      expect(tocAfter.top).toBeGreaterThan(0);
      expect(boxAfter.bottom).toBeLessThan(800);
    });

    test("a 360, no fim do texto", async ({ page }) => {
      await open(page, fixtureMdx.href, 360);
      const block = end(page);
      await expect(block).toBeVisible();
      await expect(block).toContainText("O voto precisa de JavaScript.");
      await expect(block.locator("[data-share-links] a")).toHaveCount(3);
      await expect(block.getByText("Copiar link")).toHaveCount(0);
    });
  });
});
