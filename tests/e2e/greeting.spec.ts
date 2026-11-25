import { expect, test, type Page } from "@playwright/test";

import { fixtureTag } from "./fixtures";
import { homeGreeting, homeIntro } from "./site-literals";

const h1Sizes = {
  1280: 36,
  1024: 36,
  1023: 45.012,
  1000: 44,
  360: 38.4,
} as const;

const waveSize = 32;
const avatarAlt = "Foto de Pedro Knoll";

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
      const names = [...(h1?.querySelectorAll("[data-greeting-name]") ?? [])];
      return {
        text: normalize(h1?.textContent ?? ""),
        nameCount: names.length,
        nameText: normalize(names[0]?.textContent ?? ""),
        wordmarks: h1?.querySelectorAll(".nome").length ?? -1,
      };
    });

    expect.soft(observed.text).toBe(homeGreeting);
    expect.soft(observed.nameCount).toBe(1);
    expect.soft(observed.nameText).toBe("Pedro");
    expect.soft(observed.wordmarks).toBe(0);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: homeGreeting,
        exact: true,
      }),
    ).toHaveCount(1);
  });

  test("G2 aceno no fim do h1", async ({ page }) => {
    await open(page, "/", 1280);
    await expect(page.locator("h1 svg:has(.pka-a)")).toHaveCount(1);
    await expect(page.locator("svg:has(.pka-a)")).toHaveCount(1);

    const observed = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const hand = document.querySelector("svg:has(.pka-a)");
      const handBox = hand?.getBoundingClientRect();
      let after = "";
      let textRight = Number.NEGATIVE_INFINITY;
      if (h1 && hand) {
        const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (hand.contains(node)) continue;
          const position = hand.compareDocumentPosition(node);
          if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
            after += node.textContent ?? "";
            continue;
          }
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            const line = hand.closest("[data-greeting-line]");
            if (handBox && line?.contains(node)) {
              textRight = Math.max(textRight, rect.right);
            }
          }
        }
      }
      return {
        after: after.trim(),
        handLeft: handBox?.left ?? Number.NaN,
        textRight,
        ariaHidden: hand?.getAttribute("aria-hidden") ?? "null",
        role: hand?.getAttribute("role") ?? "null",
        ariaLabel: hand?.getAttribute("aria-label") ?? "null",
        styleCount: hand?.querySelectorAll("style").length ?? -1,
        previousImage: h1?.previousElementSibling?.tagName.toLowerCase() ?? "",
      };
    });

    expect.soft(observed.after).toBe("");
    expect.soft(observed.handLeft).toBeGreaterThanOrEqual(observed.textRight);
    expect.soft(observed.ariaHidden).toBe("true");
    expect.soft(observed.role).toBe("null");
    expect.soft(observed.ariaLabel).toBe("null");
    expect.soft(observed.styleCount).toBe(0);
    expect.soft(observed.previousImage).toBe("img");
  });

  test("G3 família, peso e tamanho do h1", async ({ page }) => {
    await open(page, "/", 1280);
    await expect(page.locator("h1")).toHaveCount(1);

    for (const width of [1280, 1024, 1023, 1000, 360] as const) {
      await test.step(String(width), async () => {
        await page.setViewportSize({ width, height: 800 });
        const measured = await page.evaluate(() => {
          const h1 = document.querySelector("h1");
          const name = h1?.querySelector("[data-greeting-name]");
          const style = h1 ? getComputedStyle(h1) : null;
          const nameStyle = name ? getComputedStyle(name) : null;
          const root = getComputedStyle(document.documentElement);
          return {
            family: style?.fontFamily ?? "",
            sans: root.getPropertyValue("--font-plex-sans").trim(),
            weight: style?.fontWeight ?? "",
            fontStyle: style?.fontStyle ?? "",
            fontSize: style?.fontSize ?? "",
            nameFamily: nameStyle?.fontFamily ?? "",
            condensed: root.getPropertyValue("--font-plex-condensed").trim(),
            nameWeight: nameStyle?.fontWeight ?? "",
            nameStyle: nameStyle?.fontStyle ?? "",
            nameSize: nameStyle?.fontSize ?? "",
          };
        });
        const where = String(width);
        expect
          .soft(familyPrefix(measured.family, measured.sans), where)
          .toBe(normalizeFamily(measured.sans));
        expect.soft(measured.weight, where).toBe("400");
        expect.soft(measured.fontStyle, where).toBe("normal");
        expect
          .soft(closeTo(measured.fontSize, h1Sizes[width]), where)
          .toBe(h1Sizes[width]);
        expect
          .soft(familyPrefix(measured.nameFamily, measured.condensed), where)
          .toBe(normalizeFamily(measured.condensed));
        expect.soft(measured.nameWeight, where).toBe("600");
        expect.soft(measured.nameStyle, where).toBe("normal");
        expect.soft(measured.nameSize, where).toBe(measured.fontSize);
      });
    }
  });

  test("G4 tamanho do aceno", async ({ page }) => {
    await open(page, "/", 1280);
    await expect(page.locator("svg:has(.pka-a)")).toHaveCount(1);

    for (const width of [1280, 1024, 1023, 560, 559, 360] as const) {
      await test.step(String(width), async () => {
        await page.setViewportSize({ width, height: 800 });
        const measured = await page.evaluate(() => {
          const svg = document.querySelector("svg:has(.pka-a)");
          const style = svg ? getComputedStyle(svg) : null;
          return {
            width: style?.width ?? "",
            height: style?.height ?? "",
          };
        });
        const where = String(width);
        expect.soft(closeTo(measured.width, waveSize), where).toBe(waveSize);
        expect.soft(closeTo(measured.height, waveSize), where).toBe(waveSize);
      });
    }
  });

  test("G10 foto do autor acima do h1", async ({ page }) => {
    await open(page, "/", 1280);
    const photo = page.getByRole("img", { name: avatarAlt, exact: true });
    await expect(photo).toHaveCount(1);
    await expect(photo).toHaveAttribute("src", "/avatar.jpg");
    await expect(photo).toHaveAttribute("width", /^\d+$/);
    await expect(photo).toHaveAttribute("height", /^\d+$/);

    for (const width of [1280, 1024, 1023, 360] as const) {
      await test.step(String(width), async () => {
        await page.setViewportSize({ width, height: 800 });
        const measured = await photo.evaluate((element) => {
          const style = getComputedStyle(element);
          const probe = document.createElement("span");
          probe.style.borderColor = "var(--color-line)";
          probe.style.borderStyle = "solid";
          document.body.append(probe);
          const line = getComputedStyle(probe).borderTopColor;
          probe.remove();
          const h1 = document.querySelector("h1");
          return {
            width: element.getBoundingClientRect().width,
            height: element.getBoundingClientRect().height,
            radius: style.borderTopLeftRadius,
            borderWidth: style.borderTopWidth,
            borderColor: style.borderTopColor,
            line,
            bottom: element.getBoundingClientRect().bottom,
            h1Top: h1?.getBoundingClientRect().top ?? Number.NaN,
          };
        });
        const where = String(width);
        const size = width >= 1024 ? 88 : 72;
        expect.soft(Math.abs(measured.width - size), where).toBeLessThan(0.5);
        expect.soft(Math.abs(measured.height - size), where).toBeLessThan(0.5);
        expect
          .soft(Number.parseFloat(measured.radius), where)
          .toBeGreaterThanOrEqual(size / 2);
        expect.soft(measured.borderWidth, where).toBe("1px");
        expect.soft(measured.borderColor, where).toBe(measured.line);
        expect.soft(measured.bottom, where).toBeLessThanOrEqual(measured.h1Top);
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
    await open(page, `/tags/${fixtureTag}/`, 1280);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Tag: fixture", exact: true }),
    ).toHaveCount(1);

    const greetingHeadings = await page.evaluate((name) => {
      const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
      return [...document.querySelectorAll("h1")].filter(
        (heading) => normalize(heading.textContent ?? "") === name,
      ).length;
    }, homeGreeting);

    expect.soft(greetingHeadings).toBe(0);
  });

  test("G9 h1 sempre em duas linhas fixas", async ({ page }) => {
    await open(page, "/", 1280);

    for (const width of [1280, 1024, 1023, 560, 559, 412, 360] as const) {
      await test.step(String(width), async () => {
        await page.setViewportSize({ width, height: 800 });
        const measured = await page.evaluate(() => {
          const normalize = (value: string) =>
            value.replace(/\s+/g, " ").trim();
          const h1 = document.querySelector("h1");
          const lines = [
            ...(h1?.querySelectorAll(":scope > [data-greeting-line]") ?? []),
          ];
          const lineHeight = h1
            ? Number.parseFloat(getComputedStyle(h1).lineHeight)
            : Number.NaN;
          return {
            texts: lines.map((line) => normalize(line.textContent ?? "")),
            heights: lines.map((line) => line.getBoundingClientRect().height),
            tops: lines.map((line) => line.getBoundingClientRect().top),
            displays: lines.map((line) => getComputedStyle(line).display),
            lineHeight,
            h1Height: h1?.getBoundingClientRect().height ?? Number.NaN,
          };
        });
        const where = String(width);
        expect.soft(measured.texts, where).toEqual(["Olá, eu sou", "o Pedro."]);
        expect.soft(measured.displays, where).toEqual(["block", "block"]);
        for (const height of measured.heights) {
          expect.soft(height, where).toBeLessThan(measured.lineHeight * 1.5);
        }
        expect
          .soft(measured.h1Height, where)
          .toBeLessThan(measured.lineHeight * 2.5);
      });
    }
  });
});
