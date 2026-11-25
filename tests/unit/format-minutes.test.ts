import { describe, expect, it } from "vitest";
import { formatMinutes } from "../../src/lib/format-minutes";

describe("formatMinutes", () => {
  it("usa o singular com 1", () => {
    expect(formatMinutes(1)).toBe("1 minuto");
  });

  it("usa o plural nos outros casos", () => {
    expect(formatMinutes(6)).toBe("6 minutos");
    expect(formatMinutes(11)).toBe("11 minutos");
  });
});
