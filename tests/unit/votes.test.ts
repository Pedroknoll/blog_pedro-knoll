import { describe, expect, it } from "vitest";

import { buildHeaders, effectiveHeaders } from "../../src/integrations/headers";
import {
  canWrite,
  handleVotes,
  hashIp,
  ipKey,
  isJsonContentType,
  isSlug,
} from "../../worker/votes";

const SALT = "sal";
const NOW = new Date("2026-11-23T23:00:00.000Z");
const DAY = "2026-11-23";
const IP = "203.0.113.9";
const SLUGS = ["artigo-dois", "artigo-um"] as const;

const COUNT_SLUG = "SELECT COUNT(*) AS n FROM votes WHERE slug = ?";
const COUNT_DAY =
  "SELECT COUNT(*) AS n FROM votes WHERE ip_hash = ? AND day = ?";
const INSERT_VOTE =
  "INSERT OR IGNORE INTO votes (ip_hash, slug, day) VALUES (?, ?, ?)";

type VoteRow = {
  ip_hash: string;
  slug: string;
  day: string;
};

describe("ipKey", () => {
  it("usa o IPv4 inteiro, numa grafia só", () => {
    expect(ipKey("198.51.100.24")).toBe("198.51.100.24");
    expect(ipKey("198.051.100.024")).toBe("198.51.100.24");
    expect(ipKey("198.51.100.25")).toBe("198.51.100.25");
  });

  it("usa o prefixo /64 do IPv6, comprimido ou expandido", () => {
    const key = "2001:db8:85a3:8d3::";
    expect(ipKey("2001:db8:85a3:8d3::8a2e:370:7334")).toBe(key);
    expect(ipKey("2001:0db8:85a3:08d3:0000:8a2e:0370:7334")).toBe(key);
    expect(ipKey("2001:DB8:85A3:8D3::aaaa")).toBe(key);
    expect(ipKey("2001:db8:85a3:8d3::aaaa")).not.toContain("aaaa");
    expect(ipKey("fe80::1")).toBe("fe80::");
    expect(ipKey("fe80:0000:0000:0000:0000:0000:0000:0001")).toBe("fe80::");
    expect(ipKey("::1")).toBe("::");
    expect(ipKey("0000:0000:0000:0000:0000:0000:0000:0001")).toBe("::");
    expect(ipKey("2001:db8:85a3:8d4::1")).toBe("2001:db8:85a3:8d4::");
  });

  it("trata ::ffff:a.b.c.d como IPv4", () => {
    expect(ipKey("::ffff:198.51.100.24")).toBe("198.51.100.24");
    expect(ipKey("::FFFF:198.051.100.024")).toBe("198.51.100.24");
    expect(ipKey("0:0:0:0:0:ffff:198.51.100.24")).toBe("198.51.100.24");
    expect(ipKey("0000:0000:0000:0000:0000:ffff:198.51.100.24")).toBe(
      "198.51.100.24",
    );
  });

  it("rejeita o que não é endereço", () => {
    expect(() => ipKey("")).toThrow();
    expect(() => ipKey("198.51.100.256")).toThrow();
    expect(() => ipKey("2001::db8::1")).toThrow();
    expect(() => ipKey("pedroknoll.com")).toThrow();
  });
});

describe("hashIp", () => {
  it("é o SHA-256, em hex, do sal, dois-pontos e a chave", async () => {
    const key = ipKey("198.51.100.24");
    const digest = await hashIp("sal-a", key);
    expect(digest).toBe(await sha256Hex(`sal-a:${key}`));
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).not.toBe(await sha256Hex(key));
    expect(digest).not.toContain("198.51.100.24");
  });

  it("muda com o sal", async () => {
    const key = ipKey("198.51.100.24");
    expect(await hashIp("sal-a", key)).not.toBe(await hashIp("sal-b", key));
  });
});

describe("canWrite", () => {
  it("aceita pedroknoll.com com a Origin de produção", () => {
    expect(
      canWrite({
        hostname: "pedroknoll.com",
        host: "pedroknoll.com",
        origin: "https://pedroknoll.com",
      }),
    ).toBe(true);
  });

  it("recusa o workers.dev, o preview e Origin ausente ou diferente", () => {
    expect(
      canWrite({
        hostname: "blog.p-giacometo.workers.dev",
        host: "blog.p-giacometo.workers.dev",
        origin: "https://blog.p-giacometo.workers.dev",
      }),
    ).toBe(false);
    expect(
      canWrite({
        hostname: "pr-12-blog.p-giacometo.workers.dev",
        host: "pr-12-blog.p-giacometo.workers.dev",
        origin: "https://pr-12-blog.p-giacometo.workers.dev",
      }),
    ).toBe(false);
    expect(
      canWrite({
        hostname: "pedroknoll.com",
        host: "pedroknoll.com",
        origin: null,
      }),
    ).toBe(false);
    expect(
      canWrite({
        hostname: "pedroknoll.com",
        host: "pedroknoll.com",
        origin: "https://example.com",
      }),
    ).toBe(false);
  });

  it("com VOTES_WRITE=local, aceita o host local ou o http reescrito pelo wrangler dev", () => {
    expect(
      canWrite({
        hostname: "127.0.0.1",
        host: "127.0.0.1:8787",
        origin: "http://127.0.0.1:8787",
        votesWrite: "local",
      }),
    ).toBe(true);
    expect(
      canWrite({
        hostname: "localhost",
        host: "localhost:8787",
        origin: "http://localhost:8787",
        votesWrite: "local",
      }),
    ).toBe(true);
    expect(
      canWrite({
        hostname: "localhost",
        host: "localhost",
        origin: "http://localhost",
        votesWrite: "local",
      }),
    ).toBe(true);
    expect(
      canWrite({
        hostname: "pedroknoll.com",
        host: "pedroknoll.com",
        origin: "http://pedroknoll.com",
        votesWrite: "local",
      }),
    ).toBe(true);
    expect(
      canWrite({
        hostname: "pedroknoll.com",
        host: "pedroknoll.com",
        origin: "https://pedroknoll.com",
        votesWrite: "local",
      }),
    ).toBe(false);
    expect(
      canWrite({
        hostname: "127.0.0.1",
        host: "127.0.0.1:8787",
        origin: "http://127.0.0.1:8787",
      }),
    ).toBe(false);
    expect(
      canWrite({
        hostname: "127.0.0.1",
        host: "127.0.0.1:8787",
        origin: "https://pedroknoll.com",
        votesWrite: "local",
      }),
    ).toBe(false);
    expect(
      canWrite({
        hostname: "127.0.0.1",
        host: "127.0.0.1:8787",
        origin: "http://localhost:8787",
        votesWrite: "local",
      }),
    ).toBe(false);
    expect(
      canWrite({
        hostname: "127.0.0.1",
        host: "127.0.0.1:8787",
        origin: null,
        votesWrite: "local",
      }),
    ).toBe(false);
  });
});

describe("isJsonContentType", () => {
  it("aceita application/json com ou sem charset", () => {
    expect(isJsonContentType("application/json")).toBe(true);
    expect(isJsonContentType("application/json; charset=utf-8")).toBe(true);
    expect(isJsonContentType("application/json;charset=UTF-8")).toBe(true);
    expect(isJsonContentType("Application/JSON")).toBe(true);
  });

  it("recusa outro tipo e o header ausente", () => {
    expect(isJsonContentType("text/plain")).toBe(false);
    expect(isJsonContentType("application/jsonl")).toBe(false);
    expect(isJsonContentType(null)).toBe(false);
    expect(isJsonContentType("")).toBe(false);
  });
});

describe("isSlug", () => {
  it("segue o formato do id do post", () => {
    expect(isSlug("fixture-mdx")).toBe(true);
    expect(isSlug("2026-10-rascunho-de-teste")).toBe(true);
    expect(isSlug("Maiuscula")).toBe(false);
    expect(isSlug("a/b")).toBe(false);
    expect(isSlug("a_b")).toBe(false);
    expect(isSlug("")).toBe(false);
  });
});

describe("handleVotes", () => {
  it("em pedroknoll.com, grava uma vez e lista o catálogo com zero", async () => {
    const db = fakeDb();
    const env = voteEnv(db, SALT);
    const listed = await handleVotes(getRequest(), env, NOW);
    expect(listed.status).toBe(200);
    expect(await listed.json()).toEqual({
      votes: { "artigo-dois": 0, "artigo-um": 0 },
    });
    expectApiHeaders(listed);

    const voted = await handleVotes(postRequest(), env, NOW);
    expect(voted.status).toBe(200);
    expect(await voted.json()).toEqual({ slug: "artigo-um", votes: 1 });
    expectApiHeaders(voted);
    expect(voted.headers.get("cache-control")).toBe("no-store");
    expect(db.rows).toEqual([
      {
        ip_hash: await hashIp(SALT, ipKey(IP)),
        slug: "artigo-um",
        day: DAY,
      },
    ]);
    expect(db.rows[0]?.ip_hash).not.toContain(IP);

    const again = await handleVotes(postRequest(), env, NOW);
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual({ slug: "artigo-um", votes: 1 });
    expect(db.rows).toHaveLength(1);

    const after = await handleVotes(getRequest(), env, NOW);
    expect(await after.json()).toEqual({
      votes: { "artigo-dois": 0, "artigo-um": 1 },
    });
  });

  it("no workers.dev a API lê e o POST não grava", async () => {
    const db = fakeDb();
    const env = voteEnv(db, SALT);
    const listed = await handleVotes(
      new Request("https://blog.p-giacometo.workers.dev/api/votes"),
      env,
      NOW,
    );
    expect(listed.status).toBe(200);
    expect(await listed.json()).toEqual({
      votes: { "artigo-dois": 0, "artigo-um": 0 },
    });

    const response = await handleVotes(
      postRequest("https://blog.p-giacometo.workers.dev/api/votes"),
      env,
      NOW,
    );
    expect(response.status).toBe(403);
    expect(db.inserts).toBe(0);
    expect(db.rows).toHaveLength(0);
    expectApiHeaders(response);
  });

  it("responde 403 e 415 sem gravar", async () => {
    for (const request of [
      postRequest("https://pedroknoll.com/api/votes", { origin: null }),
      postRequest("https://pedroknoll.com/api/votes", {
        origin: "https://example.com",
      }),
    ]) {
      const db = fakeDb();
      const response = await handleVotes(request, voteEnv(db, SALT), NOW);
      expect(response.status).toBe(403);
      expect(db.inserts).toBe(0);
    }

    const db = fakeDb();
    const response = await handleVotes(
      postRequest("https://pedroknoll.com/api/votes", {
        contentType: "text/plain",
        body: JSON.stringify({ slug: "artigo-um" }),
      }),
      voteEnv(db, SALT),
      NOW,
    );
    expect(response.status).toBe(415);
    expect(db.inserts).toBe(0);
    expect(db.rows).toHaveLength(0);
  });

  it("responde 400 sem gravar quando o slug está fora do formato, do catálogo ou do corpo", async () => {
    const cases = [
      JSON.stringify({ slug: "nao-publicado" }),
      JSON.stringify({ slug: "Maiuscula" }),
      "{",
      "{}",
      JSON.stringify({ slug: 1 }),
    ];
    for (const body of cases) {
      const db = fakeDb();
      const response = await handleVotes(
        postRequest("https://pedroknoll.com/api/votes", { body }),
        voteEnv(db, SALT),
        NOW,
      );
      expect(response.status).toBe(400);
      expect(db.inserts).toBe(0);
      expect(db.rows).toHaveLength(0);
    }
  });

  it("responde 400 sem gravar quando o corpo passa de 1 KB", async () => {
    const db = fakeDb();
    const body = JSON.stringify({
      slug: "artigo-um",
      pad: "a".repeat(1024),
    });
    expect(body.length).toBeGreaterThan(1024);
    const response = await handleVotes(
      postRequest("https://pedroknoll.com/api/votes", { body }),
      voteEnv(db, SALT),
      NOW,
    );
    expect(response.status).toBe(400);
    expect(db.inserts).toBe(0);
  });

  it("não soma o mesmo par no dia seguinte", async () => {
    const ipHash = await hashIp(SALT, ipKey(IP));
    const db = fakeDb([
      { ip_hash: ipHash, slug: "artigo-um", day: "2026-11-22" },
    ]);
    const response = await handleVotes(postRequest(), voteEnv(db, SALT), NOW);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ slug: "artigo-um", votes: 1 });
    expect(db.rows).toHaveLength(1);
  });

  it("aceita o vigésimo voto novo do dia e recusa o seguinte", async () => {
    const ipHash = await hashIp(SALT, ipKey(IP));
    const slugs = Array.from({ length: 21 }, (_, index) => `cap-${index}`);
    const nineteenth = fakeDb(
      slugs.slice(0, 19).map((slug) => ({ ip_hash: ipHash, slug, day: DAY })),
    );
    const allowed = await handleVotes(
      postRequest("https://pedroknoll.com/api/votes", {
        body: JSON.stringify({ slug: "cap-19" }),
      }),
      voteEnv(nineteenth, SALT, slugs),
      NOW,
    );
    expect(allowed.status).toBe(200);
    expect(nineteenth.rows).toHaveLength(20);

    const capped = fakeDb(
      slugs.slice(0, 20).map((slug) => ({ ip_hash: ipHash, slug, day: DAY })),
    );
    const refused = await handleVotes(
      postRequest("https://pedroknoll.com/api/votes", {
        body: JSON.stringify({ slug: "cap-20" }),
      }),
      voteEnv(capped, SALT, slugs),
      NOW,
    );
    expect(refused.status).toBe(429);
    expect(capped.inserts).toBe(0);
    expect(capped.rows).toHaveLength(20);
  });

  it("não conta o histórico de outro dia no teto", async () => {
    const ipHash = await hashIp(SALT, ipKey(IP));
    const old = Array.from({ length: 20 }, (_, index) => ({
      ip_hash: ipHash,
      slug: `old-${index}`,
      day: "2026-11-22",
    }));
    const db = fakeDb(old);
    const response = await handleVotes(
      postRequest(),
      voteEnv(db, SALT, ["artigo-um", ...old.map((row) => row.slug)]),
      NOW,
    );
    expect(response.status).toBe(200);
    expect(db.rows).toHaveLength(21);
  });

  it("sem VOTE_IP_SALT, responde 500 sem gravar", async () => {
    const db = fakeDb();
    const response = await handleVotes(
      postRequest(),
      { DB: db, ASSETS: fakeAssets(SLUGS) },
      NOW,
    );
    expect(response.status).toBe(500);
    expect(db.inserts).toBe(0);
    expect(db.rows).toHaveLength(0);
  });

  it("sem CF-Connecting-IP, responde 400 sem gravar", async () => {
    const db = fakeDb();
    const response = await handleVotes(
      postRequest("https://pedroknoll.com/api/votes", { ip: null }),
      voteEnv(db, SALT),
      NOW,
    );
    expect(response.status).toBe(400);
    expect(db.inserts).toBe(0);
  });
});

function expectApiHeaders(response: Response) {
  const applied = effectiveHeaders(
    buildHeaders({ scripts: [], styles: [] }),
    "/api/votes",
  );
  for (const name of [
    "strict-transport-security",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
  ]) {
    expect(response.headers.get(name)).toBe(applied.get(name)?.[0]);
  }
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  expect(response.headers.get("content-security-policy")).toBe(
    "default-src 'none'; frame-ancestors 'none'",
  );
  expect(response.headers.get("x-robots-tag")).toBe("noindex");
  expect(response.headers.get("cache-control")).toBe("no-store");
}

function voteEnv(
  db: ReturnType<typeof fakeDb>,
  salt: string,
  slugs: readonly string[] = SLUGS,
) {
  return {
    DB: db,
    ASSETS: fakeAssets(slugs),
    VOTE_IP_SALT: salt,
  };
}

function getRequest(): Request {
  return new Request("https://pedroknoll.com/api/votes");
}

function postRequest(
  url = "https://pedroknoll.com/api/votes",
  options: {
    origin?: string | null;
    contentType?: string | null;
    body?: string;
    ip?: string | null;
  } = {},
): Request {
  const headers = new Headers();
  const origin =
    options.origin === undefined ? "https://pedroknoll.com" : options.origin;
  if (origin) headers.set("origin", origin);
  const contentType =
    options.contentType === undefined
      ? "application/json; charset=utf-8"
      : options.contentType;
  if (contentType) headers.set("content-type", contentType);
  const ip = options.ip === undefined ? IP : options.ip;
  if (ip) headers.set("cf-connecting-ip", ip);
  return new Request(url, {
    method: "POST",
    headers,
    body: options.body ?? JSON.stringify({ slug: "artigo-um" }),
  });
}

function fakeAssets(slugs: readonly string[]) {
  return {
    fetch(input: Request | string): Promise<Response> {
      const url = new URL(typeof input === "string" ? input : input.url);
      if (url.pathname !== "/api/catalogo.json") {
        return Promise.resolve(new Response(null, { status: 404 }));
      }
      return Promise.resolve(Response.json({ slugs: [...slugs] }));
    },
  };
}

function fakeDb(initial: readonly VoteRow[] = []) {
  const state = {
    rows: initial.map((row) => ({ ...row })),
    inserts: 0,
    prepare(sql: string) {
      const text = sql.replace(/\s+/g, " ").trim();
      return {
        bind(...params: readonly string[]) {
          return {
            first<T>(): Promise<T | null> {
              if (text === COUNT_SLUG) {
                const slug = params[0];
                return Promise.resolve({
                  n: state.rows.filter((row) => row.slug === slug).length,
                } as T);
              }
              if (text === COUNT_DAY) {
                const [ipHash, day] = params;
                return Promise.resolve({
                  n: state.rows.filter(
                    (row) => row.ip_hash === ipHash && row.day === day,
                  ).length,
                } as T);
              }
              return Promise.reject(
                new Error(`SQL sem leitura prevista: ${text}`),
              );
            },
            run(): Promise<void> {
              if (text !== INSERT_VOTE) {
                return Promise.reject(
                  new Error(`SQL sem escrita prevista: ${text}`),
                );
              }
              const [ipHash, slug, day] = params;
              if (!ipHash || !slug || !day) {
                return Promise.reject(new Error("INSERT incompleto"));
              }
              state.inserts += 1;
              const exists = state.rows.some(
                (row) => row.ip_hash === ipHash && row.slug === slug,
              );
              if (!exists) state.rows.push({ ip_hash: ipHash, slug, day });
              return Promise.resolve();
            },
          };
        },
      };
    },
  };
  return state;
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
