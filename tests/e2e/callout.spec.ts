import { expect, test, type Page } from "@playwright/test";

import { publishedPosts } from "./published-posts";

test.use({ deviceScaleFactor: 2 });

const words = ["Nota de bancada", "Cuidado", "Resultado"] as const;
type Word = (typeof words)[number];

const signFor: Record<Word, string> = {
  "Nota de bancada": "//",
  Cuidado: "!",
  Resultado: "=",
};

const ink = "rgb(42, 33, 24)";
const pencil = "rgb(123, 111, 90)";
const sheet = "rgb(240, 238, 230)";
const clear = "rgba(0, 0, 0, 0)";

const edges = ["top", "right", "bottom", "left"] as const;

function isWord(value: string): value is Word {
  return (words as readonly string[]).includes(value);
}

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

async function monoFamily(page: Page): Promise<string> {
  const value = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--font-plex-mono")
      .trim(),
  );
  const first = familyNames(value)[0] ?? "";
  expect(first, "--font-plex-mono").not.toBe("");
  return first;
}

test.describe("callout [RF-22]", () => {
  test("invariantes nos posts publicados", async ({ page }) => {
    const posts = await publishedPosts(page);
    const mono = await monoFamily(page);
    const seen = new Set<Word>();

    for (const post of posts) {
      await test.step(post.href, async () => {
        const response = await page.goto(post.href);
        expect(response?.status(), post.href).toBe(200);

        const notes = page.getByRole("article").getByRole("note");
        const count = await notes.count();
        for (let index = 0; index < count; index += 1) {
          const note = notes.nth(index);
          const where = `${post.href} note ${index}`;
          const label = note.locator("p").first();
          const hidden = label.locator("[aria-hidden='true']");
          const wordSpan = label.locator("span:not([aria-hidden])");

          await expect(hidden, where).toHaveCount(1);
          await expect(wordSpan, where).toHaveCount(1);

          const word = ((await wordSpan.textContent()) ?? "")
            .replace(/\s+/g, " ")
            .trim();
          expect(isWord(word), `${where} ${word}`).toBe(true);
          if (!isWord(word)) return;
          seen.add(word);
          await expect(hidden, where).toHaveText(signFor[word]);
          await expect(wordSpan, where).toHaveText(word);

          const box = await label.evaluate((el) => {
            const style = getComputedStyle(el);
            return { color: style.color };
          });
          expect(box.color, where).toBe(ink);

          const shape = await note.evaluate((el) => {
            const style = getComputedStyle(el);
            return {
              top: {
                style: style.borderTopStyle,
                width: style.borderTopWidth,
                color: style.borderTopColor,
              },
              right: {
                style: style.borderRightStyle,
                width: style.borderRightWidth,
                color: style.borderRightColor,
              },
              bottom: {
                style: style.borderBottomStyle,
                width: style.borderBottomWidth,
                color: style.borderBottomColor,
              },
              left: {
                style: style.borderLeftStyle,
                width: style.borderLeftWidth,
                color: style.borderLeftColor,
              },
              background: style.backgroundColor,
            };
          });

          if (word === "Nota de bancada") {
            for (const edge of edges) {
              expect(shape[edge].style, `${where} ${edge}`).toBe("dashed");
              expect(shape[edge].width, `${where} ${edge}`).toBe("1px");
              expect(shape[edge].color, `${where} ${edge}`).toBe(pencil);
            }
            expect(shape.background, where).toBe(clear);
          }

          if (word === "Cuidado") {
            for (const edge of edges) {
              expect(shape[edge].style, `${where} ${edge}`).toBe("solid");
              expect(shape[edge].width, `${where} ${edge}`).toBe("2px");
              expect(shape[edge].color, `${where} ${edge}`).toBe(ink);
            }
            expect(shape.background, where).toBe(sheet);
            const mark = await hidden.evaluate((el) => {
              const rect = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              return {
                width: rect.width,
                height: rect.height,
                top: style.borderTopWidth,
                right: style.borderRightWidth,
                bottom: style.borderBottomWidth,
                left: style.borderLeftWidth,
                style: style.borderTopStyle,
              };
            });
            expect(mark.width, where).toBe(17);
            expect(mark.height, where).toBe(17);
            expect(mark.style, where).toBe("solid");
            expect(mark.top, where).toBe("2px");
            expect(mark.right, where).toBe("2px");
            expect(mark.bottom, where).toBe("2px");
            expect(mark.left, where).toBe("2px");
          }

          if (word === "Resultado") {
            expect(shape.top.style, where).toBe("solid");
            expect(shape.bottom.style, where).toBe("solid");
            expect(shape.top.width, where).toBe("2px");
            expect(shape.bottom.width, where).toBe("2px");
            expect(shape.top.color, where).toBe(ink);
            expect(shape.bottom.color, where).toBe(ink);
            expect(shape.left.width, where).toBe("0px");
            expect(shape.right.width, where).toBe("0px");

            const value = await label.evaluate((el) => {
              const next = el.nextElementSibling;
              if (!next) return null;
              const style = getComputedStyle(next);
              return {
                text: (next.textContent ?? "").replace(/\s+/g, " ").trim(),
                fontSize: style.fontSize,
                fontFamily: style.fontFamily,
              };
            });
            expect(value, where).not.toBeNull();
            expect(value?.text, where).not.toBe("");
            expect(value?.fontSize, where).toBe("19px");
            expect(familyNames(value?.fontFamily ?? "")[0], where).toBe(mono);
          }
        }
      });
    }

    for (const word of words) {
      expect(seen.has(word), `${word} ausente`).toBe(true);
    }
  });
});
