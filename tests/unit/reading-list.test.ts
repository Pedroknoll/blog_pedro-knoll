import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { resolveReadingList } from "../../src/lib/reading-list";

const root = fileURLToPath(new URL("../..", import.meta.url));

const posts = [
  {
    id: "2026-10-por-que-este-blog",
    data: {
      title: "Por que este blog existe",
      pubDate: new Date("2026-10-16"),
    },
  },
  {
    id: "2026-10-como-o-blog-e-feito",
    data: {
      title: "Como o blog é feito",
      pubDate: new Date("2026-10-16"),
    },
  },
];

describe("resolveReadingList", () => {
  it("mantém a ordem, mistura post e externo, tira o slug não publicado e usa o domínio sem www.", () => {
    expect(
      resolveReadingList(
        [
          { slug: "2026-10-por-que-este-blog" },
          { href: "https://www.exemplo.com/texto", title: "Título do texto" },
          { slug: "nao-publicado" },
          {
            href: "https://outro.exemplo.com/a",
            title: "Com fonte",
            source: "Outro",
          },
          { slug: "2026-10-como-o-blog-e-feito" },
        ],
        posts,
      ),
    ).toEqual([
      {
        kind: "post",
        slug: "2026-10-por-que-este-blog",
        title: "Por que este blog existe",
        date: new Date("2026-10-16"),
      },
      {
        kind: "external",
        href: "https://www.exemplo.com/texto",
        title: "Título do texto",
        source: "exemplo.com",
      },
      {
        kind: "external",
        href: "https://outro.exemplo.com/a",
        title: "Com fonte",
        source: "Outro",
      },
      {
        kind: "post",
        slug: "2026-10-como-o-blog-e-feito",
        title: "Como o blog é feito",
        date: new Date("2026-10-16"),
      },
    ]);
  });

  it("recusa http:", () => {
    expect(() =>
      resolveReadingList(
        [{ href: "http://exemplo.com/texto", title: "Texto" }],
        [],
      ),
    ).toThrow("Leitura externa precisa de https: http://exemplo.com/texto");
  });

  it("todo slug escrito no MDX tem pasta de post", () => {
    const source = readFileSync(
      join(root, "src/content/comece-aqui.mdx"),
      "utf8",
    );
    const slugs = [...source.matchAll(/slug:\s*["']([a-z0-9-]+)["']/g)].map(
      (match) => match[1],
    );
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      expect(
        existsSync(join(root, "src/content/posts", slug ?? "")),
        slug,
      ).toBe(true);
    }
  });
});
