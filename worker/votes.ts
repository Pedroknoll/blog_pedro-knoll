const DAILY_VOTE_CAP = 20;
const COUNT_SLUG = "SELECT COUNT(*) AS n FROM votes WHERE slug = ?";
const COUNT_DAY =
  "SELECT COUNT(*) AS n FROM votes WHERE ip_hash = ? AND day = ?";
const INSERT_VOTE =
  "INSERT OR IGNORE INTO votes (ip_hash, slug, day) VALUES (?, ?, ?)";

const API_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "strict-transport-security": "max-age=63072000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "x-robots-tag": "noindex",
  "cache-control": "no-store",
};

type VoteBound = {
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
};

type VoteDb = {
  prepare(sql: string): {
    bind(...params: string[]): VoteBound;
  };
};

export type VoteEnv = {
  DB: VoteDb;
  ASSETS: { fetch(input: Request | string): Promise<Response> };
  VOTE_IP_SALT?: string;
  VOTES_WRITE?: string;
};

export function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: API_HEADERS,
  });
}

export function ipKey(ip: string): string {
  const text = ip.trim().toLowerCase();
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(text)) return canonicalIpv4(text);

  const dotted = /^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(text);
  const groups = dotted
    ? ipv4Mapped(dotted[1] ?? "", dotted[2] ?? "")
    : expandGroups(text, 8);
  if (isIpv4Mapped(groups)) return ipv4FromGroups(groups);
  return compress(groups.map((group, index) => (index < 4 ? group : 0)));
}

export async function hashIp(salt: string, key: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${salt}:${key}`),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function canWrite(input: {
  hostname: string;
  host: string;
  origin: string | null;
  votesWrite?: string;
}): boolean {
  const hostname = input.hostname.toLowerCase();
  if (input.votesWrite === "local") {
    const local = hostname === "localhost" || hostname === "127.0.0.1";
    if (local && input.origin === `http://${input.host}`) return true;
    // O `wrangler dev` com custom domain reescreve o pedido de 127.0.0.1
    // para pedroknoll.com e a Origin para http://pedroknoll.com.
    return (
      hostname === "pedroknoll.com" && input.origin === "http://pedroknoll.com"
    );
  }
  return (
    hostname === "pedroknoll.com" && input.origin === "https://pedroknoll.com"
  );
}

export function isJsonContentType(value: string | null): boolean {
  if (!value) return false;
  return value.split(";")[0]?.trim().toLowerCase() === "application/json";
}

export function isSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

export async function handleVotes(
  request: Request,
  env: VoteEnv,
  now: Date = new Date(),
): Promise<Response> {
  if (request.method === "GET") return listVotes(request, env);
  if (request.method !== "POST") return jsonResponse({ error: "method" }, 405);

  const url = new URL(request.url);
  if (
    !canWrite({
      hostname: url.hostname,
      host: url.host,
      origin: request.headers.get("origin"),
      votesWrite: env.VOTES_WRITE,
    })
  ) {
    return jsonResponse({ error: "forbidden" }, 403);
  }
  if (!isJsonContentType(request.headers.get("content-type"))) {
    return jsonResponse({ error: "unsupported_media" }, 415);
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > 1024) {
    return jsonResponse({ error: "bad_request" }, 400);
  }
  const slug = slugOf(parseJson(text));
  if (!slug) return jsonResponse({ error: "bad_request" }, 400);

  const catalog = await readCatalog(env, request);
  if (!catalog) return jsonResponse({ error: "unavailable" }, 500);
  if (!catalog.includes(slug))
    return jsonResponse({ error: "bad_request" }, 400);

  const ip = request.headers.get("cf-connecting-ip");
  if (!ip) return jsonResponse({ error: "bad_request" }, 400);
  let key: string;
  try {
    key = ipKey(ip);
  } catch {
    return jsonResponse({ error: "bad_request" }, 400);
  }
  const salt = env.VOTE_IP_SALT;
  if (!salt) return jsonResponse({ error: "unavailable" }, 500);

  const day = now.toISOString().slice(0, 10);
  const ipHash = await hashIp(salt, key);
  const used = await count(env.DB, COUNT_DAY, [ipHash, day]);
  if (used >= DAILY_VOTE_CAP) return jsonResponse({ error: "too_many" }, 429);

  await env.DB.prepare(INSERT_VOTE).bind(ipHash, slug, day).run();
  const votes = await count(env.DB, COUNT_SLUG, [slug]);
  return jsonResponse({ slug, votes }, 200);
}

async function listVotes(request: Request, env: VoteEnv): Promise<Response> {
  const catalog = await readCatalog(env, request);
  if (!catalog) return jsonResponse({ error: "unavailable" }, 500);
  const votes: Record<string, number> = {};
  for (const slug of catalog) {
    votes[slug] = await count(env.DB, COUNT_SLUG, [slug]);
  }
  return jsonResponse({ votes }, 200);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function slugOf(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const slug = (body as { slug?: unknown }).slug;
  if (typeof slug !== "string" || !isSlug(slug)) return null;
  return slug;
}

async function readCatalog(
  env: VoteEnv,
  request: Request,
): Promise<string[] | null> {
  const response = await env.ASSETS.fetch(
    new Request(new URL("/api/catalogo.json", request.url)),
  );
  if (!response.ok) return null;
  let body: unknown;
  try {
    body = (await response.json()) as unknown;
  } catch {
    return null;
  }
  if (!body || typeof body !== "object" || !("slugs" in body)) return null;
  const slugs = (body as { slugs?: unknown }).slugs;
  if (!Array.isArray(slugs) || slugs.some((slug) => typeof slug !== "string")) {
    return null;
  }
  return slugs;
}

async function count(
  db: VoteDb,
  sql: string,
  params: string[],
): Promise<number> {
  const row = await db
    .prepare(sql)
    .bind(...params)
    .first<{ n: number }>();
  return Number(row?.n ?? 0);
}

function canonicalIpv4(input: string): string {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(input);
  if (!match) throw new Error("Endereço de IP inválido.");
  return [match[1], match[2], match[3], match[4]]
    .map((part) => {
      const value = Number(part);
      if (!Number.isInteger(value) || value < 0 || value > 255) {
        throw new Error("Endereço de IP inválido.");
      }
      return String(value);
    })
    .join(".");
}

function ipv4Mapped(prefix: string, ipv4: string): number[] {
  const groups = expandGroups(prefix.replace(/:$/, ""), 6);
  const octets = canonicalIpv4(ipv4).split(".").map(Number);
  return [
    ...groups,
    ((octets[0] ?? 0) << 8) | (octets[1] ?? 0),
    ((octets[2] ?? 0) << 8) | (octets[3] ?? 0),
  ];
}

function isIpv4Mapped(groups: number[]): boolean {
  return (
    groups.length === 8 &&
    groups.slice(0, 5).every((group) => group === 0) &&
    groups[5] === 0xffff
  );
}

function ipv4FromGroups(groups: number[]): string {
  const high = groups[6] ?? 0;
  const low = groups[7] ?? 0;
  return [(high >> 8) & 255, high & 255, (low >> 8) & 255, low & 255].join(".");
}

function expandGroups(address: string, expected: number): number[] {
  const halves = address.split("::");
  if (halves.length > 2) throw new Error("Endereço de IP inválido.");
  const left = parseSide(halves[0] ?? "");
  if (halves.length === 1) {
    if (left.length !== expected) throw new Error("Endereço de IP inválido.");
    return left;
  }
  const right = parseSide(halves[1] ?? "");
  const missing = expected - left.length - right.length;
  if (missing < 1) throw new Error("Endereço de IP inválido.");
  return [...left, ...Array.from({ length: missing }, () => 0), ...right];
}

function parseSide(side: string): number[] {
  if (side === "") return [];
  return side.split(":").map((part) => {
    if (!/^[0-9a-f]{1,4}$/.test(part)) {
      throw new Error("Endereço de IP inválido.");
    }
    return Number.parseInt(part, 16);
  });
}

function compress(groups: number[]): string {
  let bestStart = -1;
  let bestLength = 0;
  let start = -1;
  for (let index = 0; index <= groups.length; index += 1) {
    if (index < groups.length && groups[index] === 0) {
      if (start === -1) start = index;
      continue;
    }
    if (start === -1) continue;
    const length = index - start;
    if (length > bestLength) {
      bestLength = length;
      bestStart = start;
    }
    start = -1;
  }
  const hex = (group: number) => group.toString(16);
  if (bestLength < 2) return groups.map(hex).join(":");
  const head = groups.slice(0, bestStart).map(hex).join(":");
  const tail = groups
    .slice(bestStart + bestLength)
    .map(hex)
    .join(":");
  if (head === "" && tail === "") return "::";
  if (head === "") return `::${tail}`;
  if (tail === "") return `${head}::`;
  return `${head}::${tail}`;
}
