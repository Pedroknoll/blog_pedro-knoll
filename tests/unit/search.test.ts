import { describe, expect, it } from "vitest";

import { isSearchShortcut, shortcutLabel } from "../../src/lib/search";

describe("shortcutLabel", () => {
  it("no Mac e no iOS mostra ⌘K", () => {
    expect(shortcutLabel("MacIntel")).toBe("⌘K");
    expect(shortcutLabel("iPhone")).toBe("⌘K");
    expect(shortcutLabel("iPad")).toBe("⌘K");
  });

  it("nos outros sistemas mostra Ctrl K", () => {
    expect(shortcutLabel("Win32")).toBe("Ctrl K");
    expect(shortcutLabel("Linux x86_64")).toBe("Ctrl K");
  });
});

describe("isSearchShortcut", () => {
  function event(partial: {
    key?: string;
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    target?: { tagName?: string; isContentEditable?: boolean } | null;
  }) {
    return {
      key: "k",
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      target: null,
      ...partial,
    };
  }

  it("aceita Meta+K e Ctrl+K", () => {
    expect(isSearchShortcut(event({ metaKey: true }))).toBe(true);
    expect(isSearchShortcut(event({ ctrlKey: true }))).toBe(true);
  });

  it("recusa K sozinho, Shift+K e alvo editável", () => {
    expect(isSearchShortcut(event({}))).toBe(false);
    expect(
      isSearchShortcut(event({ shiftKey: true, metaKey: true, key: "K" })),
    ).toBe(false);
    expect(
      isSearchShortcut(event({ metaKey: true, target: { tagName: "INPUT" } })),
    ).toBe(false);
    expect(
      isSearchShortcut(
        event({ ctrlKey: true, target: { tagName: "TEXTAREA" } }),
      ),
    ).toBe(false);
    expect(
      isSearchShortcut(
        event({
          metaKey: true,
          target: { tagName: "SELECT" },
        }),
      ),
    ).toBe(false);
    expect(
      isSearchShortcut(
        event({
          ctrlKey: true,
          target: { isContentEditable: true },
        }),
      ),
    ).toBe(false);
  });
});
