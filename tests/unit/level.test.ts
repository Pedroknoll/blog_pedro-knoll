import { describe, expect, it } from "vitest";

import { LEVEL_LABELS, levelHatch } from "../../src/lib/level";

describe("nível", () => {
  it("L1, rótulo e hachura", () => {
    expect(LEVEL_LABELS[1]).toBe("Iniciante");
    expect(LEVEL_LABELS[2]).toBe("Intermediário");
    expect(LEVEL_LABELS[3]).toBe("Avançado");
    expect(levelHatch(1)).toBe("\\");
    expect(levelHatch(2)).toBe("\\\\");
    expect(levelHatch(3)).toBe("\\\\\\");
  });
});
