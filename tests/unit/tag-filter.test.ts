import { describe, expect, it } from "vitest";

import {
  allLinkName,
  countLabel,
  searchWith,
  selectedTag,
  tagsOf,
} from "../../src/lib/tag-filter";

const artigos = { one: "artigo", many: "artigos" };
const prototipo = { one: "protótipo", many: "protótipos" };
const posts = { one: "post", many: "posts" };

describe("countLabel", () => {
  it("usa o plural quando a lista inteira tem mais de um", () => {
    expect(countLabel(5, 5, artigos)).toBe("5 artigos");
    expect(countLabel(2, 2, posts)).toBe("2 posts");
  });

  it("usa o singular quando a lista inteira tem um", () => {
    expect(countLabel(1, 1, prototipo)).toBe("1 protótipo");
    expect(countLabel(1, 1, posts)).toBe("1 post");
  });

  it("diz quantos de quantos, no plural do total", () => {
    expect(countLabel(2, 5, artigos)).toBe("2 de 5 artigos");
    expect(countLabel(1, 6, posts)).toBe("1 de 6 posts");
  });
});

describe("allLinkName", () => {
  it("inclui o número no plural", () => {
    expect(
      allLinkName(12, { one: "post recente", many: "posts recentes" }),
    ).toBe("Todos os 12 posts recentes");
    expect(allLinkName(12, prototipo)).toBe("Todos os 12 protótipos");
    expect(allLinkName(12, { one: "mais votado", many: "mais votados" })).toBe(
      "Todos os 12 mais votados",
    );
  });

  it("vai para o singular com 1", () => {
    expect(
      allLinkName(1, { one: "post recente", many: "posts recentes" }),
    ).toBe("O único post recente");
    expect(allLinkName(1, prototipo)).toBe("O único protótipo");
    expect(allLinkName(1, { one: "mais votado", many: "mais votados" })).toBe(
      "O único mais votado",
    );
  });

  it("mantém o plural com 0", () => {
    expect(allLinkName(0, { one: "mais votado", many: "mais votados" })).toBe(
      "Todos os 0 mais votados",
    );
  });
});

describe("selectedTag", () => {
  const allowed = ["fixture", "math", "fine-tuning"];

  it("aceita a tag que está nas opções", () => {
    expect(selectedTag("?tag=fixture", allowed)).toBe("fixture");
    expect(selectedTag("tag=math", allowed)).toBe("math");
  });

  it("ignora tag fora das opções", () => {
    expect(selectedTag("?tag=nao-existe", allowed)).toBeNull();
  });

  it("ignora tag vazia e busca sem o parâmetro", () => {
    expect(selectedTag("?tag=", allowed)).toBeNull();
    expect(selectedTag("", allowed)).toBeNull();
    expect(selectedTag("?outras=1", allowed)).toBeNull();
  });

  it("decodifica a tag da URL", () => {
    expect(selectedTag("?tag=fine%2Dtuning", allowed)).toBe("fine-tuning");
  });
});

describe("searchWith", () => {
  it("grava a tag e tira o parâmetro", () => {
    expect(searchWith("fixture")).toBe("?tag=fixture");
    expect(searchWith(null)).toBe("");
  });

  it("mantém a ordem e os outros parâmetros da URL [T-133]", () => {
    expect(searchWith("md", "?ordem=antigos")).toBe("?ordem=antigos&tag=md");
    expect(searchWith(null, "?tag=md&ordem=antigos")).toBe("?ordem=antigos");
    expect(searchWith(null, "?tag=md")).toBe("");
  });

  it("codifica a tag", () => {
    expect(searchWith("fine-tuning")).toBe("?tag=fine-tuning");
    expect(selectedTag(searchWith("fine-tuning"), ["fine-tuning"])).toBe(
      "fine-tuning",
    );
  });
});

describe("tagsOf", () => {
  it("junta as tags sem repetir, em ordem", () => {
    expect(
      tagsOf([
        { tags: ["mdx", "fixture"] },
        { tags: ["fixture", "math"] },
        { tags: [] },
      ]),
    ).toEqual(["fixture", "math", "mdx"]);
  });
});
