import { expect, test, type Page } from "@playwright/test";

import { homeGreeting, homeIntro } from "./site-literals";

const h1Sizes = {
  1280: 36,
  1024: 36,
  1023: 45.012,
  1000: 44,
  360: 38.4,
} as const;

const waveSizes = {
  1280: 48,
  560: 48,
  559: 32,
  360: 32,
} as const;

function normalizeFamily(value: string): string {
  return value.replace(/\s*,\s*/g, ",").trim();
}

function familyPrefix(family: string, variable: string): string {
  const normalizedFamily = normalizeFamily(family);
  const normalizedVariable = normalizeFamily(variable);
  if (
    normalizedVariable.length > 0 &&
    normalizedFamily.startsWith(normalizedVariable)
  ) {
    return normalizedVariable;
  }
  return normalizedFamily;
}

function closeTo(actual: string, expected: number): number {
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(actual.trim());
  const value = match?.[1] ? Number(match[1]) : Number.NaN;
  if (!Number.isFinite(value) || !Number.isFinite(expected)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.abs(value - expected) <= 0.1 ? expected : value;
}

async function open(page: Page, path: string, width: number) {
  await page.setViewportSize({ width, height: 800 });
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
}

test.describe("saudação [RF-01, RNF-04]", () => {
  test("G1 saudação no h1 da home", async ({ page }) => {
    await open(page, "/", 1280);

    const observed = await page.evaluate(() => {
      const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
      const h1 = document.querySelector("h1");
      const nomes = [...(h1?.querySelectorAll(".nome") ?? [])];
      const blog =
        [...document.querySelectorAll("h1")]
          .map((heading) => normalize(heading.textContent ?? ""))
          .find((value) => value === "Blog") ?? "";
      return {
        text: normalize(h1?.textContent ?? ""),
        nomeCount: nomes.length,
        nomeText: normalize(nomes[0]?.textContent ?? ""),
        blog,
      };
    });

    expect.soft(observed.text).toBe(homeGreeting);
    expect.soft(observed.nomeCount).toBe(1);
    expect.soft(observed.nomeText).toBe("pk.log");
    expect.soft(observed.blog).toBe("");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: homeGreeting,
        exact: true,
      }),
    ).toHaveCount(1);
  });

  test("G2 aceno fora do h1", async ({ page }) => {
    await open(page, "/", 1280);
    await expect(page.locator("h1 svg")).toHaveCount(0);

    const observed = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const sibling = h1?.previousElementSibling;
      const hand = document.querySelector("svg:has(.pka-a)");
      return {
        siblingTag: sibling?.tagName.toLowerCase() ?? "",
        ariaHidden: hand?.getAttribute("aria-hidden") ?? "null",
        role: hand?.getAttribute("role") ?? "null",
        ariaLabel: hand?.getAttribute("aria-label") ?? "null",
        styleCount: hand?.querySelectorAll("style").length ?? -1,
      };
    });

    expect.soft(observed.siblingTag).toBe("svg");
    expect.soft(observed.ariaHidden).toBe("true");
    expect.soft(observed.role).toBe("null");
    expect.soft(observed.ariaLabel).toBe("null");
    expect.soft(observed.styleCount).toBe(0);
  });

  test("G3 família, peso e tamanho do h1", async ({ page }) => {
    await open(page, "/", 1280);
    await expect(page.locator("h1")).toHaveCount(1);

    for (const width of [1280, 1024, 1023, 1000, 360] as const) {
      await test.step(String(width), async () => {
        await page.setViewportSize({ width, height: 800 });
        const measured = await page.evaluate(() => {
          const h1 = document.querySelector("h1");
          const style = h1 ? getComputedStyle(h1) : null;
          const variable = getComputedStyle(document.documentElement)
            .getPropertyValue("--font-plex-condensed")
            .trim();
          return {
            family: style?.fontFamily ?? "",
            variable,
            weight: style?.fontWeight ?? "",
            fontStyle: style?.fontStyle ?? "",
            fontSize: style?.fontSize ?? "",
          };
        });
        const where = String(width);
        expect
          .soft(familyPrefix(measured.family, measured.variable), where)
          .toBe(normalizeFamily(measured.variable));
        expect.soft(measured.weight, where).toBe("600");
        expect.soft(measured.fontStyle, where).toBe("normal");
        expect
          .soft(closeTo(measured.fontSize, h1Sizes[width]), where)
          .toBe(h1Sizes[width]);
      });
    }
  });

  test("G4 tamanho e alinhamento do aceno", async ({ page }) => {
    await open(page, "/", 1280);
    await expect(page.locator("svg:has(.pka-a)")).toHaveCount(1);

    for (const width of [1280, 560, 559, 360] as const) {
      await test.step(String(width), async () => {
        await page.setViewportSize({ width, height: 800 });
        const measured = await page.evaluate(() => {
          const svg = document.querySelector("svg:has(.pka-a)");
          const style = svg ? getComputedStyle(svg) : null;
          return {
            width: style?.width ?? "",
            height: style?.height ?? "",
            display: style?.display ?? "",
            marginBottom: style?.marginBottom ?? "",
          };
        });
        const where = String(width);
        const size = waveSizes[width];
        expect.soft(closeTo(measured.width, size), where).toBe(size);
        expect.soft(closeTo(measured.height, size), where).toBe(size);
        if (width === 1280) {
          expect.soft(measured.display, where).toBe("block");
          expect.soft(closeTo(measured.marginBottom, 16), where).toBe(16);
        }
      });
    }
  });

  test("G5 animação do aceno", async ({ page }) => {
    await open(page, "/", 1280);
    await expect(page.locator(".pka-a")).toHaveCount(1);
    await expect(page.locator(".pka-b")).toHaveCount(1);

    const observed = await page.evaluate(() => {
      const raised = document.querySelector(".pka-a");
      const lowered = document.querySelector(".pka-b");
      const raisedStyle = raised ? getComputedStyle(raised) : null;
      const loweredStyle = lowered ? getComputedStyle(lowered) : null;
      const svg = document.querySelector("svg:has(.pka-a)");
      return {
        nameA: raisedStyle?.animationName ?? "",
        nameB: loweredStyle?.animationName ?? "",
        durationA: raisedStyle?.animationDuration ?? "",
        durationB: loweredStyle?.animationDuration ?? "",
        iterationA: raisedStyle?.animationIterationCount ?? "",
        iterationB: loweredStyle?.animationIterationCount ?? "",
        animations: svg?.getAnimations({ subtree: true }).length ?? 0,
      };
    });

    expect.soft(observed.nameA).toBe("pka-fa");
    expect.soft(observed.nameB).toBe("pka-fb");
    expect.soft(observed.durationA).toBe("3.2s");
    expect.soft(observed.durationB).toBe("3.2s");
    expect.soft(observed.iterationA).toBe("infinite");
    expect.soft(observed.iterationB).toBe("infinite");
    expect.soft(observed.animations).toBeGreaterThan(0);
  });

  test("G6 aceno parado com movimento reduzido", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator(".pka-a")).toHaveCount(1);
    await expect(page.locator(".pka-b")).toHaveCount(1);

    const observed = await page.evaluate(() => {
      const raised = document.querySelector(".pka-a");
      const lowered = document.querySelector(".pka-b");
      const raisedStyle = raised ? getComputedStyle(raised) : null;
      const loweredStyle = lowered ? getComputedStyle(lowered) : null;
      const svg = document.querySelector("svg:has(.pka-a)");
      return {
        nameA: raisedStyle?.animationName ?? "",
        nameB: loweredStyle?.animationName ?? "",
        opacityA: raisedStyle?.opacity ?? "",
        opacityB: loweredStyle?.opacity ?? "",
        animations: svg?.getAnimations({ subtree: true }).length ?? 0,
      };
    });

    expect.soft(observed.nameA).toBe("none");
    expect.soft(observed.nameB).toBe("none");
    expect.soft(observed.animations).toBe(0);
    expect.soft(observed.opacityA).toBe("1");
    expect.soft(observed.opacityB).toBe("0");
  });

  test("G7 texto de apresentação", async ({ page }) => {
    await open(page, "/", 1280);
    await expect(page.getByText(homeIntro, { exact: true })).toHaveCount(1);

    for (const width of [1280, 1000, 360] as const) {
      await test.step(String(width), async () => {
        await page.setViewportSize({ width, height: 800 });
        const measured = await page.evaluate(() => {
          const h1 = document.querySelector("h1");
          const next = h1?.nextElementSibling ?? null;
          const style = next ? getComputedStyle(next) : null;
          const variable = getComputedStyle(document.documentElement)
            .getPropertyValue("--font-plex-sans")
            .trim();
          const inkProbe = document.createElement("span");
          const mutedProbe = document.createElement("span");
          inkProbe.style.color = "var(--color-ink)";
          mutedProbe.style.color = "var(--color-muted)";
          document.body.append(inkProbe, mutedProbe);
          const ink = getComputedStyle(inkProbe).color;
          const muted = getComputedStyle(mutedProbe).color;
          inkProbe.remove();
          mutedProbe.remove();
          let expectedMaxWidth = Number.NaN;
          if (style) {
            const probe = document.createElement("div");
            probe.style.position = "absolute";
            probe.style.visibility = "hidden";
            probe.style.width = "46ch";
            probe.style.fontFamily = style.fontFamily;
            probe.style.fontSize = style.fontSize;
            probe.style.fontWeight = style.fontWeight;
            probe.style.fontStyle = style.fontStyle;
            probe.style.fontStretch = style.fontStretch;
            document.body.append(probe);
            expectedMaxWidth = probe.getBoundingClientRect().width;
            probe.remove();
          }
          return {
            tag: next?.tagName.toLowerCase() ?? "",
            text: (next?.textContent ?? "").replace(/\s+/g, " ").trim(),
            family: style?.fontFamily ?? "",
            variable,
            weight: style?.fontWeight ?? "",
            fontSize: style?.fontSize ?? "",
            lineHeight: style
              ? Number.parseFloat(style.lineHeight)
              : Number.NaN,
            maxWidth: style ? Number.parseFloat(style.maxWidth) : Number.NaN,
            expectedMaxWidth,
            color: style?.color ?? "",
            ink,
            muted,
          };
        });
        const where = String(width);
        expect.soft(measured.tag, where).toBe("p");
        expect.soft(measured.text, where).toBe(homeIntro);
        expect
          .soft(familyPrefix(measured.family, measured.variable), where)
          .toBe(normalizeFamily(measured.variable));
        expect.soft(measured.weight, where).toBe("400");
        expect.soft(closeTo(measured.fontSize, 18), where).toBe(18);
        expect
          .soft(Math.abs(measured.lineHeight - 27.9), where)
          .toBeLessThanOrEqual(0.5);
        expect.soft(measured.color, where).toBe(measured.muted);
        expect
          .soft(Math.abs(measured.maxWidth - measured.expectedMaxWidth), where)
          .toBeLessThanOrEqual(1);
        expect
          .soft(
            measured.ink === measured.muted ? measured.ink : "diferentes",
            where,
          )
          .toBe("diferentes");
      });
    }
  });

  test("G8 h1 da tag permanece", async ({ page }) => {
    await open(page, "/tags/astro/", 1280);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Tag: astro", exact: true }),
    ).toHaveCount(1);

    const greetingHeadings = await page.evaluate((name) => {
      const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
      return [...document.querySelectorAll("h1")].filter(
        (heading) => normalize(heading.textContent ?? "") === name,
      ).length;
    }, homeGreeting);

    expect.soft(greetingHeadings).toBe(0);
  });

  test("G9 quebra de lg em diante", async ({ page }) => {
    await open(page, "/", 1280);
    let linesAt1280 = "";

    for (const width of [1280, 1024, 1023, 560, 559, 412, 360] as const) {
      await test.step(String(width), async () => {
        await page.setViewportSize({ width, height: 800 });
        await expect(
          page.getByRole("heading", {
            level: 1,
            name: homeGreeting,
            exact: true,
          }),
        ).toHaveCount(1);

        const measured = await page.evaluate(() => {
          const h1 = document.querySelector("h1");
          const nome = h1?.querySelector(".nome");
          return {
            nomeTop: nome?.getBoundingClientRect().top ?? Number.NaN,
            h1Top: h1?.getBoundingClientRect().top ?? Number.NaN,
            fontSize: h1 ? getComputedStyle(h1).fontSize : "",
          };
        });

        const fontSize = /^(-?\d+(?:\.\d+)?)px$/.exec(measured.fontSize.trim());
        const h1Number = fontSize?.[1] ? Number(fontSize[1]) : Number.NaN;
        const lines =
          measured.nomeTop - measured.h1Top >= 0.5 * h1Number ? "duas" : "uma";
        const where = String(width);
        if (width === 1280) linesAt1280 = lines;
        const expected =
          width === 1280
            ? "duas"
            : width === 1024
              ? linesAt1280
              : width === 1023 || width === 560
                ? "uma"
                : "duas";
        expect.soft(lines, where).toBe(expected);

        if (width === 1280) {
          const bemVindo = page.locator("h1 span", {
            hasText: /^Bem-vindo ao$/,
          });
          await expect.soft(bemVindo, where).toHaveCount(1);
          if ((await bemVindo.count()) === 1) {
            await expect
              .soft(bemVindo, where)
              .toHaveCSS("white-space", "nowrap");
          }
        }
      });
    }
  });
});
