import { describe, expect, it } from "vitest";

import { isBinaryPath, utf8Problem } from "../../src/lib/utf8";

describe("utf8Problem", () => {
  it("ASCII passa", () => {
    expect(utf8Problem(new Uint8Array([0x61, 0x62, 0x63]))).toBeNull();
  });

  it("UTF-8 com nó não passa", () => {
    const bytes = new Uint8Array([
      0x6e, 0xc3, 0xb3, 0x20, 0x6e, 0xc3, 0xa3, 0x6f,
    ]);
    expect(utf8Problem(bytes)).toBeNull();
  });

  it("Latin-1 de nó não dá invalid", () => {
    const bytes = new Uint8Array([0x6e, 0xf3, 0x20, 0x6e, 0xe3, 0x6f]);
    expect(utf8Problem(bytes)).toBe("invalid");
  });

  it("sequência truncada dá invalid", () => {
    expect(utf8Problem(new Uint8Array([0x61, 0xc3]))).toBe("invalid");
  });

  it("BOM seguido de ASCII dá bom", () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x61]);
    expect(utf8Problem(bytes)).toBe("bom");
  });

  it("BOM seguido de byte inválido dá invalid", () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0xf3]);
    expect(utf8Problem(bytes)).toBe("invalid");
  });

  it("arquivo vazio passa", () => {
    expect(utf8Problem(new Uint8Array())).toBeNull();
  });
});

describe("isBinaryPath", () => {
  it(".png e .PNG são binários", () => {
    expect(isBinaryPath("a.png")).toBe(true);
    expect(isBinaryPath("a.PNG")).toBe(true);
  });

  it(".svg, .astro e .ts não são binários", () => {
    expect(isBinaryPath("a.svg")).toBe(false);
    expect(isBinaryPath("a.astro")).toBe(false);
    expect(isBinaryPath("a.ts")).toBe(false);
  });
});
