import { defineConfig } from "@playwright/test";

const persist = ".wrangler/state-api";

export default defineConfig({
  testDir: "tests/api",
  forbidOnly: !!process.env.CI,
  // O D1 local é compartilhado: uma retentativa veria o voto já gravado.
  retries: 0,
  workers: 1,
  reporter: "list",
  webServer: {
    command: [
      `rm -rf ${persist}`,
      `pnpm exec wrangler d1 migrations apply blog-votes --local --persist-to ${persist}`,
      `pnpm exec wrangler dev --ip 127.0.0.1 --port 8787 --persist-to ${persist} --var VOTES_WRITE:local --var VOTE_IP_SALT:teste`,
    ].join(" && "),
    url: "http://127.0.0.1:8787",
    timeout: 120_000,
    reuseExistingServer: false,
  },
  use: {
    baseURL: "http://127.0.0.1:8787",
  },
});
