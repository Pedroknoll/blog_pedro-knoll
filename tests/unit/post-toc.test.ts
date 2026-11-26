import { describe, expect, it } from "vitest";

import { activeIndex, readingProgress } from "../../src/lib/post-toc";

describe("readingProgress", () => {
  it("é 0 com o topo do texto ainda na tela ou abaixo dela", () => {
    expect(readingProgress(0, 3000, 800)).toBe(0);
    expect(readingProgress(400, 3000, 800)).toBe(0);
  });

  it("cresce com a rolagem e chega a 1 com o fim do texto no fim da tela", () => {
    expect(readingProgress(-1100, 3000, 800)).toBeCloseTo(0.5);
    expect(readingProgress(-2200, 3000, 800)).toBe(1);
    expect(readingProgress(-5000, 3000, 800)).toBe(1);
  });

  it("texto mais curto que a tela: 1 quando o fim aparece", () => {
    expect(readingProgress(100, 500, 800)).toBe(1);
    expect(readingProgress(500, 500, 800)).toBe(0);
  });
});

describe("activeIndex", () => {
  it("é -1 antes de o primeiro h2 passar da linha", () => {
    expect(activeIndex([300, 900], 200)).toBe(-1);
    expect(activeIndex([], 200)).toBe(-1);
  });

  it("é o último h2 que passou da linha", () => {
    expect(activeIndex([200, 900, 1500], 200)).toBe(0);
    expect(activeIndex([-800, 100, 700], 200)).toBe(1);
    expect(activeIndex([-1800, -900, -10], 200)).toBe(2);
  });

  it("no fim do texto, é o último h2", () => {
    expect(activeIndex([-800, 100, 700], 200, true)).toBe(2);
    expect(activeIndex([], 200, true)).toBe(-1);
  });
});
