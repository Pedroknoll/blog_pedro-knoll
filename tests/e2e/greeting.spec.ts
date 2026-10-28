import { expect, test, type Page } from "@playwright/test";

import { homeGreeting, homeIntro } from "./site-literals";

const h1Sizes = {
  1280: 56,
  1000: 44,
  360: 38.4,
} as const;

const introSizes = {
  1280: 22.4,
  1000: 21,
  360: 18.88,
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

  test("G2 aceno é o primeiro filho do h1", async ({ page }) => {
    await open(page, "/", 1280);
    await expect(page.locator("h1 svg")).toHaveCount(1);

    const observed = await page.evaluate(() => {
      const first = document.querySelector("h1")?.firstElementChild;
      return {
        firstTag: first?.tagName.toLowerCase() ?? "",
        ariaHidden: first?.getAttribute("aria-hidden") ?? "null",
        role: first?.getAttribute("role") ?? "null",
        ariaLabel: first?.getAttribute("aria-label") ?? "null",
        styleCount: first?.querySelectorAll("style").length ?? -1,
      };
    });

    expect.soft(observed.firstTag).toBe("svg");
    expect.soft(observed.ariaHidden).toBe("true");
    expect.soft(observed.role).toBe("null");
    expect.soft(observed.ariaLabel).toBe("null");
    expect.soft(observed.styleCount).toBe(0);
  });

  test("G3 família, peso e tamanho do h1", async ({ page }) => {
    await open(page, "/", 1280);
    await expect(page.locator("h1")).toHaveCount(1);

    for (const width of [1280, 1000, 360] as const) {
      await test.step(String(width), async () => {
        await page.setViewportSize({ width, height: 800 });
        const measured = await page.evaluate(() => {
          const h1 = document.querySelector("h1");
          const style = h1 ? getComputedStyle(h1) : null;
          const variable = getComputedStyle(document.documentElement)
            .getPropertyValue("--font-cormorant")
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
    await expect(page.locator("h1 svg")).toHaveCount(1);

    for (const width of [1280, 560, 559, 360] as const) {
      await test.step(String(width), async () => {
        await page.setViewportSize({ width, height: 800 });
        const measured = await page.evaluate(() => {
          const h1 = document.querySelector("h1");
          const svg = h1?.querySelector("svg");
          const h1Size = h1 ? getComputedStyle(h1).fontSize : "";
          const style = svg ? getComputedStyle(svg) : null;
          return {
            width: style?.width ?? "",
            height: style?.height ?? "",
            verticalAlign: style?.verticalAlign ?? "",
            marginRight: style?.marginRight ?? "",
            h1FontSize: h1Size,
          };
        });
        const where = String(width);
        const size = waveSizes[width];
        const fontSize = /^(-?\d+(?:\.\d+)?)px$/.exec(
          measured.h1FontSize.trim(),
        );
        const h1Number = fontSize?.[1] ? Number(fontSize[1]) : Number.NaN;
        expect.soft(closeTo(measured.width, size), where).toBe(size);
        expect.soft(closeTo(measured.height, size), where).toBe(size);
        expect
          .soft(closeTo(measured.verticalAlign, -0.02 * h1Number), where)
          .toBe(-0.02 * h1Number);
        expect
          .soft(closeTo(measured.marginRight, 0.2 * h1Number), where)
          .toBe(0.2 * h1Number);
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
      const svg = document.querySelector("h1 svg");
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
      const svg = document.querySelector("h1 svg");
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
          return {
            tag: next?.tagName.toLowerCase() ?? "",
            text: (next?.textContent ?? "").replace(/\s+/g, " ").trim(),
            family: style?.fontFamily ?? "",
            variable,
            weight: style?.fontWeight ?? "",
            fontSize: style?.fontSize ?? "",
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
        expect
          .soft(closeTo(measured.fontSize, introSizes[width]), where)
          .toBe(introSizes[width]);
        expect.soft(measured.color, where).toBe(measured.ink);
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
});
