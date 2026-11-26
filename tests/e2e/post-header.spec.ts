import { expect, test, type Locator, type Page } from "@playwright/test";

import { fixtureMd } from "./fixtures";
import { publishedPosts } from "./published-posts";
import { authorName } from "./site-literals";

const KIND = /^(Artigo|Protótipo)$/;
const DATE =
  /^\d{2}\.(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\.\d{4}$/;

function familyNames(stack: string): string[] {
  const names: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (const char of stack) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === ",") {
      names.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) names.push(current.trim());
  return names;
}

function firstFamily(stack: string): string {
  return familyNames(stack)[0] ?? "";
}

async function variableFamily(page: Page, variable: string): Promise<string> {
  const value = await page.evaluate((name) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }, variable);
  expect(value, variable).not.toBe("");
  return firstFamily(value);
}

async function familyOf(locator: Locator): Promise<string> {
  return firstFamily(
    await locator.evaluate((element) => getComputedStyle(element).fontFamily),
  );
}

function channels(color: string): [number, number, number, number] {
  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})([\da-f]{2})?$/i.exec(
    color.trim(),
  );
  if (hex?.[1] && hex[2] && hex[3]) {
    return [
      Number.parseInt(hex[1], 16),
      Number.parseInt(hex[2], 16),
      Number.parseInt(hex[3], 16),
      Math.round((Number.parseInt(hex[4] ?? "ff", 16) / 255) * 100) / 100,
    ];
  }
  const match = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?/,
  );
  if (!match?.[1] || !match[2] || !match[3]) {
    throw new Error(color);
  }
  return [
    Math.round(Number(match[1])),
    Math.round(Number(match[2])),
    Math.round(Number(match[3])),
    Math.round(Number(match[4] ?? "1") * 100) / 100,
  ];
}

async function token(page: Page, name: string) {
  return channels(
    await page.evaluate(
      (variable) =>
        getComputedStyle(document.documentElement)
          .getPropertyValue(variable)
          .trim(),
      name,
    ),
  );
}

async function colorOf(locator: Locator, property = "color") {
  return channels(
    await locator.evaluate(
      (element, prop) =>
        getComputedStyle(element).getPropertyValue(prop as string),
      property,
    ),
  );
}

async function box(locator: Locator) {
  const value = await locator.boundingBox();
  expect(value).not.toBeNull();
  if (!value) throw new Error("sem caixa");
  return value;
}

function parts(page: Page) {
  const header = page.getByRole("article").locator("header");
  const meta = header.locator("[data-post-meta]");
  return {
    header,
    h1: header.locator("h1"),
    deck: header.locator("[data-post-deck]"),
    meta,
    avatar: meta.locator("img"),
    name: meta.getByText(authorName, { exact: true }),
    time: meta.locator("time"),
    reading: meta.locator("[data-reading]"),
    kind: meta.locator("[data-post-kind]"),
    tags: header.getByRole("list", { name: "Tags", exact: true }),
    rail: page.locator("[data-post-rail]"),
    first: page.locator("article > .prose > :first-child"),
  };
}

async function expectHeaderContent(page: Page) {
  const p = parts(page);
  await expect(p.header).toHaveCount(1);
  await expect(p.h1).toHaveCount(1);
  await expect(p.deck).toHaveCount(1);
  await expect(p.meta).toHaveCount(1);
  await expect(p.avatar).toHaveCount(1);
  await expect(p.avatar).toHaveAttribute("alt", "");
  await expect(p.avatar).toHaveAttribute("width", "28");
  await expect(p.avatar).toHaveAttribute("height", "28");
  // T-134: a variante de 56 px (2× de 28), gerada pelo astro:assets.
  await expect(p.avatar).toHaveAttribute("src", /^\/_astro\/avatar\..+\.webp$/);
  await expect
    .poll(() =>
      p.avatar.evaluate((element) => {
        const image = element as HTMLImageElement;
        return [image.naturalWidth, image.naturalHeight];
      }),
    )
    .toEqual([56, 56]);
  await expect(p.name).toHaveCount(1);
  await expect(p.time).toHaveCount(1);
  await expect(p.time).toHaveText(DATE);
  await expect(p.time).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
  await expect(p.reading).toHaveCount(1);
  await expect(p.reading).toHaveText(
    /^\s*(1 minuto|\d+ minutos) de leitura\s*$/,
  );
  await expect(p.reading).toHaveAttribute(
    "title",
    /^(1 minuto|\d+ minutos) de leitura$/,
  );
  await expect(p.reading.locator("svg")).toHaveAttribute("aria-hidden", "true");
  await expect(p.kind).toHaveCount(1);
  await expect(p.kind).toHaveText(KIND);

  // Saem a tabela, o rótulo do tipo, a linha Tipo e o título ao rolar.
  await expect(page.locator("[data-prose-mark]")).toHaveCount(0);
  await expect(page.locator("[data-tipo-row]")).toHaveCount(0);
  await expect(page.getByText("Tipo", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Leitura", { exact: true })).toHaveCount(0);
  await expect(p.rail.getByText(KIND)).toHaveCount(0);
  await expect(p.rail.locator("p[aria-hidden='true']")).toHaveCount(0);
  await expect(p.rail.locator("table, dl, ul")).toHaveCount(0);
  return p;
}

test.describe("cabeçalho do post [RF-04]", () => {
  test("H1 cabeçalho na coluna do texto a 1280", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const posts = await publishedPosts(page);
    const mono = await variableFamily(page, "--font-plex-mono");
    const sans = await variableFamily(page, "--font-plex-sans");
    const ink = await token(page, "--color-ink");
    const muted = await token(page, "--color-muted");
    const line = await token(page, "--color-line");

    for (const href of [...posts.map((post) => post.href), fixtureMd.href]) {
      await test.step(href, async () => {
        const response = await page.goto(href);
        expect(response?.status()).toBe(200);
        const p = await expectHeaderContent(page);

        const articleBox = await box(page.getByRole("article"));
        const railBox = await box(p.rail);
        const proseBox = await box(page.locator("article > .prose"));
        expect(railBox.width).toBeCloseTo(240, 0);
        expect(proseBox.x - (railBox.x + railBox.width)).toBeCloseTo(64, 0);

        const h1Box = await box(p.h1);
        const headerBox = await box(p.header);
        expect(h1Box.y - articleBox.y).toBeCloseTo(56, 0);
        expect(h1Box.x).toBeCloseTo(proseBox.x, 0);
        expect(headerBox.x).toBeCloseTo(proseBox.x, 0);
        expect(headerBox.width).toBeCloseTo(proseBox.width, 0);
        await expect(p.h1).toHaveCSS("font-size", "56px");
        await expect(p.deck).toHaveCSS("font-size", "20px");
        expect(await colorOf(p.deck)).toEqual(muted);

        // A lateral fica vazia na altura do cabeçalho.
        expect(railBox.y).toBeGreaterThanOrEqual(
          headerBox.y + headerBox.height - 1,
        );

        // Ordem: título, linha fina, metadados, tags.
        const deckBox = await box(p.deck);
        const metaBox = await box(p.meta);
        expect(h1Box.y + h1Box.height).toBeLessThanOrEqual(deckBox.y + 1);
        expect(deckBox.y + deckBox.height).toBeLessThanOrEqual(metaBox.y + 1);

        // Foto, nome, data, minutos e tipo numa linha, nessa ordem.
        const row = [p.avatar, p.name, p.time, p.reading, p.kind];
        let previousRight = Number.NEGATIVE_INFINITY;
        const middles: number[] = [];
        for (const item of row) {
          const itemBox = await box(item);
          expect(itemBox.x).toBeGreaterThanOrEqual(previousRight - 0.5);
          previousRight = itemBox.x + itemBox.width;
          middles.push(itemBox.y + itemBox.height / 2);
        }
        for (const middle of middles) {
          expect(Math.abs(middle - (middles[0] ?? 0))).toBeLessThanOrEqual(2);
        }

        const avatarBox = await box(p.avatar);
        expect(avatarBox.width).toBeCloseTo(28, 0);
        expect(avatarBox.height).toBeCloseTo(28, 0);
        // `rounded-full` do Tailwind 4 é calc(infinity * 1px): basta passar da metade.
        const radius = await p.avatar.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
        );
        expect(radius).toBeGreaterThanOrEqual(14);
        await expect(p.avatar).toHaveCSS("border-top-width", "1px");
        expect(await colorOf(p.avatar, "border-top-color")).toEqual(line);

        expect(await familyOf(p.name)).toBe(sans);
        expect(await colorOf(p.name)).toEqual(ink);
        for (const item of [p.time, p.reading, p.kind]) {
          expect(await familyOf(item)).toBe(mono);
          await expect(item).toHaveCSS("font-size", "14px");
          expect(await colorOf(item)).toEqual(muted);
        }
        await expect(p.reading.locator("svg")).toHaveCSS("width", "12px");

        // Filete de 1 px em tinta fecha o cabeçalho.
        await expect(p.header).toHaveCSS("border-bottom-width", "1px");
        await expect(p.header).toHaveCSS("border-bottom-style", "solid");
        expect(await colorOf(p.header, "border-bottom-color")).toEqual(ink);
        await expect(p.header).toHaveCSS("border-top-width", "0px");

        const firstBox = await box(p.first);
        expect(firstBox.y - (headerBox.y + headerBox.height)).toBeCloseTo(
          40,
          0,
        );
      });
    }
  });

  test("H2 etiquetas das tags", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto(fixtureMd.href);
    expect(response?.status()).toBe(200);
    const p = parts(page);
    const mono = await variableFamily(page, "--font-plex-mono");
    const ink = await token(page, "--color-ink");
    const line = await token(page, "--color-line");

    await expect(p.tags).toHaveCount(1);
    const metaBox = await box(p.meta);
    const tagsBox = await box(p.tags);
    expect(tagsBox.y).toBeGreaterThanOrEqual(metaBox.y + metaBox.height - 1);

    const links = p.tags.getByRole("link");
    await expect(links).toHaveText(["fixture", "md"]);
    for (const [index, tag] of ["fixture", "md"].entries()) {
      const link = links.nth(index);
      await expect(link).toHaveAttribute("href", `/tags/${tag}/`);
      await expect(link).toHaveCSS("border-top-width", "1px");
      await expect(link).toHaveCSS("border-top-style", "solid");
      await expect(link).toHaveCSS("border-top-left-radius", "4px");
      await expect(link).toHaveCSS("font-size", "12px");
      expect(await familyOf(link)).toBe(mono);
      expect(await colorOf(link)).toEqual(ink);
      expect(await colorOf(link, "border-top-color")).toEqual(line);
    }
  });

  test("H3 cabeçalho empilhado a 360", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const posts = await publishedPosts(page);

    for (const href of [...posts.map((post) => post.href), fixtureMd.href]) {
      await test.step(href, async () => {
        const response = await page.goto(href);
        expect(response?.status()).toBe(200);
        const p = await expectHeaderContent(page);
        await expect(p.rail).toBeHidden();

        const articleBox = await box(page.getByRole("article"));
        const h1Box = await box(p.h1);
        expect(h1Box.y - articleBox.y).toBeCloseTo(56, 0);
        await expect(p.h1).toHaveCSS("font-size", "36px");
        await expect(p.deck).toHaveCSS("font-size", "18px");

        const deckBox = await box(p.deck);
        const metaBox = await box(p.meta);
        expect(h1Box.y).toBeLessThan(deckBox.y);
        expect(deckBox.y + deckBox.height).toBeLessThanOrEqual(metaBox.y + 1);
        await expect(p.meta).toBeInViewport({ ratio: 1 });
        expect(metaBox.x + metaBox.width).toBeLessThanOrEqual(360 - 16 + 0.5);

        const headerBox = await box(p.header);
        const firstBox = await box(p.first);
        expect(firstBox.y - (headerBox.y + headerBox.height)).toBeCloseTo(
          40,
          0,
        );
      });
    }
  });

  for (const width of [360, 1280]) {
    test(`H4 a foto não desloca o cabeçalho a ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      let release: () => void = () => {};
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route("**/_astro/avatar.*", async (route) => {
        await held;
        try {
          await route.continue();
        } catch {
          // A navegação cancelou o pedido.
        }
      });

      const response = await page.goto(fixtureMd.href, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);

      const selectors = [
        "article header h1",
        "article header [data-post-deck]",
        "article header [data-post-meta]",
        "article header [data-post-meta] time",
        "article header ul",
        "article > .prose > :first-child",
      ];
      const tops = () =>
        page.evaluate(
          (list) =>
            list.map((selector) => {
              const element = document.querySelector(selector);
              if (!element) return Number.NaN;
              const rect = element.getBoundingClientRect();
              return rect.top + window.scrollY;
            }),
          selectors,
        );

      const loaded = () =>
        page.evaluate(() => {
          const img = document.querySelector<HTMLImageElement>(
            "article header [data-post-meta] img",
          );
          return Boolean(img?.complete && img.naturalWidth > 0);
        });
      expect(await loaded()).toBe(false);
      const before = await tops();

      release();
      await page.waitForFunction(() => {
        const img = document.querySelector<HTMLImageElement>(
          "article header [data-post-meta] img",
        );
        return Boolean(img?.complete && img.naturalWidth > 0);
      });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => resolve());
            });
          }),
      );
      const after = await tops();

      for (const [index, top] of before.entries()) {
        expect(Number.isFinite(top), selectors[index]).toBe(true);
        expect(
          Math.abs((after[index] ?? Number.NaN) - top),
          selectors[index],
        ).toBeLessThan(1);
      }
    });
  }
});

test.describe("cabeçalho do post sem JavaScript [RF-04]", () => {
  test.use({ javaScriptEnabled: false });

  test("H5 sem JavaScript o cabeçalho é o mesmo", async ({ page }) => {
    for (const width of [360, 1280]) {
      await test.step(`${width}px`, async () => {
        await page.setViewportSize({ width, height: 800 });
        const posts = await publishedPosts(page);
        for (const href of [
          ...posts.map((post) => post.href),
          fixtureMd.href,
        ]) {
          const response = await page.goto(href);
          expect(response?.status()).toBe(200);
          const p = await expectHeaderContent(page);
          await expect(p.meta).toBeVisible();
          await expect(p.kind).toBeVisible();
          await expect(p.time).toBeVisible();
          await expect(p.reading).toBeVisible();
        }
      });
    }
  });
});
