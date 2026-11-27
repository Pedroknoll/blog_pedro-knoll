import { describe, expect, it } from "vitest";

import { resolveTheme, THEME_KEY } from "../../src/lib/theme";

describe("resolveTheme [RF-17]", () => {
  it("a escolha gravada vence o sistema", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("sem escolha, segue o sistema", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
  });

  it("valor inválido conta como sem escolha", () => {
    expect(resolveTheme("sepia", true)).toBe("dark");
    expect(resolveTheme("", false)).toBe("light");
  });

  it("a chave segue o prefixo do voto", () => {
    expect(THEME_KEY).toBe("pk-theme");
  });
});
