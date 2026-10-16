import { describe, expect, it } from "vitest";
import { splitFeatured } from "../../src/lib/featured";

type Entry = { id: string; data: { featured: boolean } };

function entry(id: string, featured: boolean): Entry {
  return { id, data: { featured } };
}

describe("splitFeatured", () => {
  it("sem featured, não há destaque e a lista permanece", () => {
    const posts = [entry("a", false), entry("b", false)];
    const { featured, rest } = splitFeatured(posts);

    expect(featured).toBeNull();
    expect(rest.map((post) => post.id)).toEqual(["a", "b"]);
  });

  it("com um featured, ele sai da lista", () => {
    const posts = [entry("a", false), entry("b", true), entry("c", false)];
    const { featured, rest } = splitFeatured(posts);

    expect(featured?.id).toBe("b");
    expect(rest.map((post) => post.id)).toEqual(["a", "c"]);
    expect(rest).not.toContain(featured);
  });

  it("com vários featured, vence o primeiro e os outros ficam na ordem", () => {
    const posts = [
      entry("recente-sem", false),
      entry("recente-com", true),
      entry("antigo-com", true),
      entry("antigo-sem", false),
    ];
    const { featured, rest } = splitFeatured(posts);

    expect(featured?.id).toBe("recente-com");
    expect(rest.map((post) => post.id)).toEqual([
      "recente-sem",
      "antigo-com",
      "antigo-sem",
    ]);
    expect(rest).not.toContain(featured);
  });

  it("não altera o array recebido", () => {
    const posts = [entry("b", true), entry("a", false)];
    const idsBefore = posts.map((post) => post.id);

    splitFeatured(posts);

    expect(posts.map((post) => post.id)).toEqual(idsBefore);
  });
});
