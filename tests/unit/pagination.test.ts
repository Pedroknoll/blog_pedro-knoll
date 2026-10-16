import { describe, expect, it } from "vitest";
import { paginatePosts } from "../../src/lib/pagination";

type Page = {
  items: number[];
  href: string;
  prev: string | null;
  next: string | null;
};

function paginateCount(count: number): Page[] {
  const items = Array.from({ length: count }, (_, index) => index);
  return paginatePosts(items);
}

describe("paginatePosts", () => {
  it("com 0 itens, devolve uma página vazia em /", () => {
    expect(paginatePosts([])).toEqual([
      { items: [], href: "/", prev: null, next: null },
    ]);
  });

  it("com 1 item, devolve uma página em /", () => {
    expect(paginateCount(1)).toEqual([
      { items: [0], href: "/", prev: null, next: null },
    ]);
  });

  it("com 12 itens, devolve uma página em /", () => {
    const items = Array.from({ length: 12 }, (_, index) => index);
    expect(paginatePosts(items)).toEqual([
      { items, href: "/", prev: null, next: null },
    ]);
  });

  it("com 13 itens, a segunda página aponta a anterior para /", () => {
    const items = Array.from({ length: 13 }, (_, index) => index);
    expect(paginatePosts(items)).toEqual([
      {
        items: items.slice(0, 12),
        href: "/",
        prev: null,
        next: "/page/2/",
      },
      {
        items: items.slice(12),
        href: "/page/2/",
        prev: "/",
        next: null,
      },
    ]);
  });

  it("com 24 itens, devolve duas páginas de 12", () => {
    const items = Array.from({ length: 24 }, (_, index) => index);
    expect(paginatePosts(items)).toEqual([
      {
        items: items.slice(0, 12),
        href: "/",
        prev: null,
        next: "/page/2/",
      },
      {
        items: items.slice(12),
        href: "/page/2/",
        prev: "/",
        next: null,
      },
    ]);
  });

  it("com 25 itens, a página do meio tem anterior e próxima", () => {
    const items = Array.from({ length: 25 }, (_, index) => index);
    const pages = paginatePosts(items);
    expect(pages).toEqual([
      {
        items: items.slice(0, 12),
        href: "/",
        prev: null,
        next: "/page/2/",
      },
      {
        items: items.slice(12, 24),
        href: "/page/2/",
        prev: "/",
        next: "/page/3/",
      },
      {
        items: items.slice(24),
        href: "/page/3/",
        prev: "/page/2/",
        next: null,
      },
    ]);
    expect(pages.map((page) => page.href)).not.toContain("/page/1/");
  });
});
