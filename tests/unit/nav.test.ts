import { describe, expect, it } from "vitest";

import { headerLinks, isCurrentPath } from "../../src/lib/nav";
import { selectPublished } from "../../src/lib/published";
import type { Kind } from "../../src/lib/kind";

describe("headerLinks", () => {
  it("só artigos dá Artigos", () => {
    expect(headerLinks([{ data: { kind: "article" } }])).toEqual([
      { href: "/artigos/", label: "Artigos" },
    ]);
  });

  it("artigos e protótipos, na ordem de KINDS", () => {
    expect(
      headerLinks([
        { data: { kind: "prototype" } },
        { data: { kind: "article" } },
      ]),
    ).toEqual([
      { href: "/artigos/", label: "Artigos" },
      { href: "/prototipos/", label: "Protótipos" },
    ]);
  });

  it("protótipo só em rascunho não entra", () => {
    const entries = [
      {
        id: "artigo",
        data: {
          kind: "article" as Kind,
          draft: false,
          pubDate: new Date("2026-01-02"),
        },
      },
      {
        id: "rascunho",
        data: {
          kind: "prototype" as Kind,
          draft: true,
          pubDate: new Date("2026-01-03"),
        },
      },
    ];
    expect(headerLinks(selectPublished(entries, false))).toEqual([
      { href: "/artigos/", label: "Artigos" },
    ]);
    expect(headerLinks(selectPublished(entries, true))).toEqual([
      { href: "/artigos/", label: "Artigos" },
      { href: "/prototipos/", label: "Protótipos" },
    ]);
  });
});

describe("isCurrentPath", () => {
  it("compara os caminhos com a barra final normalizada", () => {
    expect(isCurrentPath("/artigos/", "/artigos/")).toBe(true);
    expect(isCurrentPath("/artigos", "/artigos/")).toBe(true);
    expect(isCurrentPath("/artigos/", "/artigos")).toBe(true);
    expect(isCurrentPath("/", "/")).toBe(true);
    expect(isCurrentPath("/prototipos/", "/artigos/")).toBe(false);
    expect(isCurrentPath("/blog/fixture-md/", "/artigos/")).toBe(false);
    expect(isCurrentPath("/artigos/extra/", "/artigos/")).toBe(false);
  });
});
