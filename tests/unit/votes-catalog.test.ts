import { describe, expect, it } from "vitest";

import { catalogFromPosts } from "../../src/lib/votes-catalog";

describe("catalogFromPosts", () => {
  it("lista os ids recebidos, em ordem e sem repetir", () => {
    expect(
      catalogFromPosts([{ id: "zeta" }, { id: "alfa" }, { id: "zeta" }]),
    ).toEqual({ slugs: ["alfa", "zeta"] });
  });

  it("devolve uma lista vazia quando não há entrada", () => {
    expect(catalogFromPosts([])).toEqual({ slugs: [] });
  });
});
