import { describe, expect, it } from "vitest";

import {
  GISCUS_ORIGIN,
  giscusTheme,
  pageOrigin,
  parseStoredSession,
  readMessage,
  sessionFromSearch,
  setConfigMessage,
  widgetUrl,
} from "../../src/lib/giscus";

// Comentários pelo Giscus (RF-19, T-28): a parte do client.js do
// giscus que o site usa, sem script de outra origem.

const config = {
  repo: "dono/repo",
  repoId: "R_1",
  category: "Comentários",
  categoryId: "DIC_1",
  lang: "pt",
} as const;

const page = {
  origin: "https://exemplo.com/blog/um-post/",
  term: "um-post",
  description: "Resumo do post.",
  backLink: "https://exemplo.com/blog/um-post/",
  theme: "noborder_light",
} as const;

describe("widgetUrl", () => {
  it("monta /pt/widget com todos os parâmetros", () => {
    const url = new URL(widgetUrl(config, page));
    expect(url.origin).toBe(GISCUS_ORIGIN);
    expect(url.pathname).toBe("/pt/widget");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      origin: page.origin,
      theme: "noborder_light",
      reactionsEnabled: "0",
      emitMetadata: "0",
      inputPosition: "top",
      repo: "dono/repo",
      repoId: "R_1",
      category: "Comentários",
      categoryId: "DIC_1",
      strict: "1",
      description: page.description,
      backLink: page.backLink,
      term: "um-post",
    });
  });

  it("só põe a sessão quando ela existe", () => {
    const url = new URL(widgetUrl(config, { ...page, session: "abc" }));
    expect(url.searchParams.get("session")).toBe("abc");
    expect(url.searchParams.has("session")).toBe(true);
    expect(new URL(widgetUrl(config, page)).searchParams.has("session")).toBe(
      false,
    );
  });
});

describe("giscusTheme", () => {
  it("segue o tema do site", () => {
    expect(giscusTheme("light")).toBe("noborder_light");
    expect(giscusTheme("dark")).toBe("noborder_dark");
  });
});

describe("sessão", () => {
  it("lê o parâmetro giscus da busca", () => {
    expect(sessionFromSearch("?giscus=abc&x=1")).toBe("abc");
    expect(sessionFromSearch("?x=1")).toBeNull();
    expect(sessionFromSearch("")).toBeNull();
  });

  it("lê a sessão gravada em JSON e recusa o inválido", () => {
    expect(parseStoredSession('"abc"')).toEqual({ session: "abc" });
    expect(parseStoredSession(null)).toEqual({ session: null });
    expect(parseStoredSession("{quebrado")).toEqual({
      session: null,
      invalid: true,
    });
    expect(parseStoredSession("42")).toEqual({ session: null, invalid: true });
  });

  it("tira o giscus e o hash da URL da página", () => {
    expect(pageOrigin("https://exemplo.com/blog/a/?giscus=abc&x=1#topo")).toBe(
      "https://exemplo.com/blog/a/?x=1",
    );
    expect(pageOrigin("https://exemplo.com/blog/a/?giscus=abc")).toBe(
      "https://exemplo.com/blog/a/",
    );
  });
});

describe("readMessage", () => {
  const from = (data: unknown, origin = GISCUS_ORIGIN) => ({ origin, data });

  it("ignora outra origem e mensagem sem giscus", () => {
    expect(
      readMessage(from({ giscus: { resizeHeight: 10 } }, "https://x.com")),
    ).toBeNull();
    expect(readMessage(from({ outra: 1 }))).toBeNull();
    expect(readMessage(from("texto"))).toBeNull();
  });

  it("reconhece o tamanho, a saída e os erros de credencial", () => {
    expect(readMessage(from({ giscus: { resizeHeight: 321 } }))).toEqual({
      kind: "resize",
      height: 321,
    });
    expect(readMessage(from({ giscus: { signOut: true } }))).toEqual({
      kind: "signOut",
    });
    for (const error of [
      "Bad credentials",
      "Invalid state value",
      "State has expired",
    ]) {
      expect(readMessage(from({ giscus: { error } }))).toEqual({
        kind: "signOut",
      });
    }
    expect(
      readMessage(from({ giscus: { error: "Discussion not found" } })),
    ).toBeNull();
  });
});

describe("setConfigMessage", () => {
  it("troca só o tema", () => {
    expect(setConfigMessage("noborder_dark")).toEqual({
      giscus: { setConfig: { theme: "noborder_dark" } },
    });
  });
});
