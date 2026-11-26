import { describe, expect, it } from "vitest";

import { isPastHeader, shareLinks } from "../../src/lib/share";

const URL_POST = "https://pedroknoll.com/blog/um-post/";

describe("shareLinks", () => {
  it("monta X, LinkedIn e e-mail, nessa ordem", () => {
    const links = shareLinks("Título", URL_POST);
    expect(links.map((link) => link.label)).toEqual([
      "X.com",
      "LinkedIn",
      "E-mail",
    ]);
  });

  it("codifica título com acento, & e ? e a URL", () => {
    const title = "Ação & reação? 100%";
    const [x, linkedin, email] = shareLinks(title, URL_POST);
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(URL_POST);

    expect(x?.href).toBe(
      `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    );
    expect(linkedin?.href).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    );
    expect(email?.href).toBe(
      `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    );

    const parsed = new URL(x?.href ?? "");
    expect(parsed.searchParams.get("text")).toBe(title);
    expect(parsed.searchParams.get("url")).toBe(URL_POST);
  });
});

describe("isPastHeader", () => {
  it("só é verdade com o cabeçalho fora da tela, acima dela", () => {
    expect(isPastHeader({ isIntersecting: false, top: -400 })).toBe(true);
    expect(isPastHeader({ isIntersecting: true, top: -100 })).toBe(false);
    expect(isPastHeader({ isIntersecting: true, top: 50 })).toBe(false);
    // Abaixo da tela (não acontece no post, mas não conta como passado).
    expect(isPastHeader({ isIntersecting: false, top: 2000 })).toBe(false);
  });
});
