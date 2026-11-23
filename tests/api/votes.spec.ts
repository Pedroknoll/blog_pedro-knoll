import { readFileSync } from "node:fs";

import { type APIRequestContext, expect, test } from "@playwright/test";

import { buildHeaders, effectiveHeaders } from "../../src/integrations/headers";
import { fixtureMdx } from "../e2e/fixtures";

const FIXTURE_SLUG = "fixture-mdx";
const DRAFT_SLUG = "2026-10-rascunho-de-teste";
const IP = "203.0.113.10";
const ORIGIN = "http://127.0.0.1:8787";

test.describe.configure({ mode: "serial" });

test.describe("votos na API [RF-25]", () => {
  test("o literal da fixture é o slug do POST", () => {
    expect(fixtureMdx.href).toBe(`/blog/${FIXTURE_SLUG}/`);
  });

  test("GET devolve o JSON, a fixture em 0 e os headers", async ({
    request,
  }) => {
    const response = await request.get("/api/votes");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(response.headers()["content-security-policy"]).toBe(
      "default-src 'none'; frame-ancestors 'none'",
    );
    expect(response.headers()["x-robots-tag"]).toBe("noindex");
    for (const name of [
      "strict-transport-security",
      "x-content-type-options",
      "referrer-policy",
      "permissions-policy",
    ]) {
      expect(response.headers()[name]).toBe(sharedHeader(name));
    }

    const body = (await response.json()) as {
      votes: Record<string, number>;
    };
    expect(body.votes[FIXTURE_SLUG]).toBe(0);
    expect(body.votes[DRAFT_SLUG]).toBeUndefined();
  });

  test("o POST certo leva a 1 e o repetido continua em 1", async ({
    request,
  }) => {
    const first = await postVote(request, { slug: FIXTURE_SLUG });
    expect(first.status()).toBe(200);
    expect(await first.json()).toEqual({ slug: FIXTURE_SLUG, votes: 1 });

    const again = await postVote(request, { slug: FIXTURE_SLUG });
    expect(again.status()).toBe(200);
    expect(await again.json()).toEqual({ slug: FIXTURE_SLUG, votes: 1 });

    const listed = await request.get("/api/votes");
    const body = (await listed.json()) as { votes: Record<string, number> };
    expect(body.votes[FIXTURE_SLUG]).toBe(1);
  });

  test("sem Origin, com outra Origin ou com text/plain, a contagem não muda", async ({
    request,
  }) => {
    const before = await request.get("/api/votes");
    const snapshot = await before.json();

    const missing = await postVote(request, {
      slug: FIXTURE_SLUG,
      origin: null,
    });
    expect(missing.status()).toBe(403);

    const other = await postVote(request, {
      slug: FIXTURE_SLUG,
      origin: "https://example.com",
    });
    expect(other.status()).toBe(403);

    const plain = await postVote(request, {
      slug: FIXTURE_SLUG,
      contentType: "text/plain",
      data: JSON.stringify({ slug: FIXTURE_SLUG }),
    });
    expect(plain.status()).toBe(415);

    const after = await request.get("/api/votes");
    expect(await after.json()).toEqual(snapshot);
  });

  test("slug desconhecido e o slug do rascunho dão 400", async ({
    request,
  }) => {
    const before = await request.get("/api/votes");
    const snapshot = await before.json();

    for (const slug of ["slug-que-nao-existe", DRAFT_SLUG]) {
      const response = await postVote(request, { slug });
      expect(response.status()).toBe(400);
    }

    const after = await request.get("/api/votes");
    expect(await after.json()).toEqual(snapshot);
  });

  test("o catálogo e um caminho /api desconhecido dão 404 em JSON", async ({
    request,
  }) => {
    for (const path of ["/api/catalogo.json", "/api/x"]) {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
      expect(response.headers()["content-type"]).toContain("application/json");
      expect(await response.text()).not.toContain("<html");
    }
  });

  test("a home continua o HTML do dist, com a CSP do _headers", async ({
    request,
  }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/html");
    expect(await response.text()).toContain("<html");

    const file = readFileSync("dist/_headers", "utf8");
    const csp = effectiveHeaders(file, "/").get("content-security-policy");
    expect(csp).toBeTruthy();
    expect(response.headers()["content-security-policy"]).toBe(csp?.join(", "));
  });

  test("o botão da fixture grava pelo Worker", async ({ page }) => {
    await page.route("**/api/votes", async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          "cf-connecting-ip": "203.0.113.77",
        },
      });
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto(fixtureMdx.href);
    expect(response?.status()).toBe(200);

    const vote = page.locator("[data-post-vote]:visible");
    const posted = page.waitForResponse(
      (answer) =>
        answer.url().includes("/api/votes") &&
        answer.request().method() === "POST",
    );
    await vote.getByRole("button", { name: "Curtir" }).click();
    const body = (await (await posted).json()) as { votes: number };
    await expect(vote.getByRole("button", { name: "Curtido" })).toBeDisabled();
    await expect(vote.locator("[data-vote-count]")).toContainText(
      String(body.votes),
    );
  });
});

function sharedHeader(name: string): string {
  const applied = effectiveHeaders(
    buildHeaders({ scripts: [], styles: [] }),
    "/api/votes",
  );
  const value = applied.get(name)?.[0];
  if (!value) throw new Error(`Header ausente no buildHeaders: ${name}`);
  return value;
}

function postVote(
  request: APIRequestContext,
  options: {
    slug: string;
    origin?: string | null;
    contentType?: string;
    data?: string;
  },
) {
  const headers: Record<string, string> = {
    "content-type": options.contentType ?? "application/json",
    "cf-connecting-ip": IP,
  };
  const origin = options.origin === undefined ? ORIGIN : options.origin;
  if (origin) headers.origin = origin;
  return request.post("/api/votes", {
    headers,
    data: options.data ?? JSON.stringify({ slug: options.slug }),
  });
}
