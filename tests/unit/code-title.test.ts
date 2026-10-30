import { describe, expect, it } from "vitest";

import { codeTitle } from "../../src/lib/code-title";

describe("codeTitle", () => {
  it("sem aspas, o valor vai até o espaço", () => {
    expect(codeTitle("title=a.py")).toBe("a.py");
    expect(codeTitle("title=a.py extra")).toBe("a.py");
  });

  it("aspas duplas aceitam espaço", () => {
    expect(codeTitle('title="meu arquivo.ts"')).toBe("meu arquivo.ts");
  });

  it("aspas simples aceitam espaço", () => {
    expect(codeTitle("title='meu arquivo.ts'")).toBe("meu arquivo.ts");
  });

  it("ignora as outras metas", () => {
    expect(codeTitle("{1,3} title=a.py")).toBe("a.py");
  });

  it("vale a primeira ocorrência", () => {
    expect(codeTitle("title=a.py title=b.py")).toBe("a.py");
  });

  it("subtitle= não casa", () => {
    expect(codeTitle("subtitle=x")).toBeUndefined();
    expect(codeTitle("subtitle=x title=a.py")).toBe("a.py");
  });

  it("vazio e ausente dão undefined", () => {
    expect(codeTitle(undefined)).toBeUndefined();
    expect(codeTitle("")).toBeUndefined();
    expect(codeTitle("   ")).toBeUndefined();
    expect(codeTitle("title=")).toBeUndefined();
    expect(codeTitle('title=""')).toBeUndefined();
    expect(codeTitle("title=''")).toBeUndefined();
    expect(codeTitle('title="   "')).toBeUndefined();
  });
});
