import { describe, expect, it } from "vitest";

import {
  absoluteUrl,
  blogPostingJsonLd,
  jsonLdScript,
  pageTitle,
  postToRssItem,
} from "../../src/lib/seo";
import { authorName, homeTitle, siteTitle, titled } from "../e2e/site-literals";

const site = { title: siteTitle, author: { name: authorName } };

describe("U1 pageTitle", () => {
  it("monta o title da home sem page", () => {
    expect(pageTitle({}, site)).toBe(homeTitle);
  });

  it("monta o title do post", () => {
    expect(pageTitle({ page: "Por que este blog existe" }, site)).toBe(
      titled("Por que este blog existe"),
    );
  });

  it("monta o title da paginação", () => {
    expect(pageTitle({ page: "Blog — página 2" }, site)).toBe(
      titled("Blog — página 2"),
    );
  });

  it("monta o title da tag", () => {
    expect(pageTitle({ page: "Tag: nlp" }, site)).toBe(titled("Tag: nlp"));
  });

  it("não reescreve um page que já contém o separador", () => {
    expect(pageTitle({ page: "Antes · depois" }, site)).toBe(
      titled("Antes · depois"),
    );
  });
});

describe("U2 absoluteUrl", () => {
  const path = "/blog/exemplo/";

  it("ignora a barra final do site", () => {
    expect(absoluteUrl(path, "https://blog.exemplo.com")).toBe(
      "https://blog.exemplo.com/blog/exemplo/",
    );
    expect(absoluteUrl(path, "https://blog.exemplo.com/")).toBe(
      absoluteUrl(path, "https://blog.exemplo.com"),
    );
  });

  it("rejeita caminho sem barra inicial", () => {
    expect(() =>
      absoluteUrl("blog/exemplo/", "https://blog.exemplo.com"),
    ).toThrow("path sem / inicial");
  });

  it("rejeita site indefinido", () => {
    expect(() => absoluteUrl(path, undefined)).toThrow("site indefinido");
  });
});

describe("U3 blogPostingJsonLd", () => {
  const pubDate = new Date("2026-10-16T00:00:00.000Z");
  const updatedDate = new Date("2026-10-18T00:00:00.000Z");
  const canonical = "https://blog.exemplo.com/blog/exemplo/";

  it("inclui image e dateModified quando há capa e updatedDate", () => {
    const description =
      "Descrição longa o bastante para o exemplo do teste unitário.";
    const obj = blogPostingJsonLd({
      title: "Com capa",
      description,
      pubDate,
      updatedDate,
      authorName,
      canonical,
      image: "https://blog.exemplo.com/capa.jpg",
    });

    expect(obj["@context"]).toBe("https://schema.org");
    expect(obj["@type"]).toBe("BlogPosting");
    expect(obj.description).toBe(description);
    expect(obj.image).toEqual(["https://blog.exemplo.com/capa.jpg"]);
    expect(obj.dateModified).toBe(updatedDate.toISOString());
    expect(obj.headline).toBe("Com capa");
    expect(obj.url).toBe(obj.mainEntityOfPage);
    expect(obj.url).toBe(canonical);
    expect(obj.author).toEqual({ "@type": "Person", name: authorName });
    expect(obj.inLanguage).toBe("pt-BR");
    expect(obj.datePublished).toBe(pubDate.toISOString());
  });

  it("omite image e dateModified quando os dois faltam", () => {
    const obj = blogPostingJsonLd({
      title: "Sem capa",
      description: "Outra descrição longa o bastante para o exemplo do teste.",
      pubDate,
      authorName,
      canonical,
    });

    expect("image" in obj).toBe(false);
    expect("dateModified" in obj).toBe(false);
    expect(obj.headline).toBe("Sem capa");
    expect(obj.url).toBe(obj.mainEntityOfPage);
    expect(obj.author).toEqual({ "@type": "Person", name: authorName });
    expect(obj.inLanguage).toBe("pt-BR");
  });
});

describe("U4 postToRssItem", () => {
  const pubDate = new Date("2026-10-16T00:00:00.000Z");

  it("monta link, pubDate e categories", () => {
    const item = postToRssItem({
      id: "2026-10-por-que-este-blog",
      data: {
        title: "Por que este blog existe",
        description: "Descrição do item.",
        pubDate,
        tags: ["meta", "astro"],
      },
    });

    expect(item.link).toBe("/blog/2026-10-por-que-este-blog/");
    expect(item.pubDate).toBe(pubDate);
    expect(item.categories).toEqual(["meta", "astro"]);
    expect(item.title).toBe("Por que este blog existe");
    expect(item.description).toBe("Descrição do item.");
  });

  it("devolve categories vazio quando o post não tem tags", () => {
    const item = postToRssItem({
      id: "sem-tags",
      data: {
        title: "Sem tags",
        description: "Descrição do item.",
        pubDate,
        tags: [],
      },
    });

    expect(item.categories).toEqual([]);
    expect(item.link).toBe("/blog/sem-tags/");
  });
});

describe("U5 jsonLdScript", () => {
  it("escapa < para o script não fechar", () => {
    const raw = jsonLdScript({ headline: "a</script><b>" });

    expect(raw).not.toContain("</script");
    expect(JSON.parse(raw)).toEqual({ headline: "a</script><b>" });
  });
});
