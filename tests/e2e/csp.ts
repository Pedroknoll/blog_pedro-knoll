import { expect, type Page } from "@playwright/test";

import { effectiveHeaders } from "../../src/integrations/headers.ts";

export type CspViolation = {
  directive: string;
  sample: string;
};

type CspWindow = Window & {
  __cspViolations?: CspViolation[];
};

export function policyOf(text: string, pathname: string): string {
  const values = effectiveHeaders(text, pathname).get(
    "content-security-policy",
  );
  expect(values, pathname).toHaveLength(1);
  return values?.[0] ?? "";
}

export function directiveValue(policy: string, name: string): string {
  const prefix = `${name} `;
  const part = policy.split("; ").find((item) => item.startsWith(prefix));
  return part?.slice(prefix.length) ?? "";
}

export async function serveDocument(
  page: Page,
  pathname: string,
  csp: string,
): Promise<void> {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.resourceType() !== "document" || url.pathname !== pathname) {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        "content-security-policy": csp,
      },
    });
  });
}

export async function servePagefindWorker(
  page: Page,
  csp: string,
): Promise<void> {
  await page.route("**/pagefind/pagefind-worker.js", async (route) => {
    const response = await route.fetch();
    const headers = { ...response.headers() };
    for (const name of Object.keys(headers)) {
      if (name.toLowerCase() === "content-security-policy") {
        delete headers[name];
      }
    }
    headers["content-security-policy"] = csp;
    await route.fulfill({ response, headers });
  });
}

export async function watchCsp(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const view = window as CspWindow;
    if (view.__cspViolations) return;
    const found: CspViolation[] = [];
    view.__cspViolations = found;
    document.addEventListener("securitypolicyviolation", (event) => {
      found.push({
        directive: event.effectiveDirective,
        sample: event.sample,
      });
    });
  });
}

export async function readCspViolations(page: Page): Promise<CspViolation[]> {
  return page.evaluate(() => {
    const view = window as CspWindow;
    return view.__cspViolations ?? [];
  });
}
