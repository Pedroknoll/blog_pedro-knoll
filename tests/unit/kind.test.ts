import { describe, expect, it } from "vitest";

import {
  KINDS,
  KIND_SLUGS,
  kindCountText,
  kindCountWord,
  kindCounts,
  kindFromSlug,
  kindPath,
  postsWithKind,
  type Kind,
} from "../../src/lib/kind";

const slugPattern = /^[a-z0-9-]+$/;

describe("kind", () => {
  it("slugs exatos, únicos e no padrão", () => {
    expect(KIND_SLUGS).toEqual({
      concept: "conceito",
      tutorial: "tutorial",
      lab: "lab",
      playbook: "playbook",
    });
    const slugs = KINDS.map((kind) => KIND_SLUGS[kind]);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(slugPattern);
  });

  it("kindPath termina com barra", () => {
    for (const kind of KINDS) {
      expect(kindPath(kind)).toBe(`/tipos/${KIND_SLUGS[kind]}/`);
    }
  });

  it("kindFromSlug ida e volta e slug desconhecido", () => {
    for (const kind of KINDS) {
      expect(kindFromSlug(KIND_SLUGS[kind])).toBe(kind);
    }
    expect(kindFromSlug("ausente")).toBeUndefined();
  });

  it("contagem na ordem de KINDS e sem o tipo vazio", () => {
    const posts = [
      { data: { kind: "playbook" as Kind } },
      { data: { kind: "concept" as Kind } },
      { data: { kind: "tutorial" as Kind } },
      { data: { kind: "concept" as Kind } },
    ];
    expect(kindCounts(posts)).toEqual([
      { kind: "concept", count: 2 },
      { kind: "tutorial", count: 1 },
      { kind: "playbook", count: 1 },
    ]);
  });

  it("filtra o tipo e preserva a ordem", () => {
    const posts = [
      { id: "c", data: { kind: "concept" as Kind } },
      { id: "t", data: { kind: "tutorial" as Kind } },
      { id: "c2", data: { kind: "concept" as Kind } },
    ];
    expect(postsWithKind(posts, "concept").map((post) => post.id)).toEqual([
      "c",
      "c2",
    ]);
  });

  it("texto da contagem", () => {
    expect(kindCountWord(1)).toBe("post");
    expect(kindCountWord(2)).toBe("posts");
    expect(kindCountText(1)).toBe("1 post");
    expect(kindCountText(2)).toBe("2 posts");
  });
});
