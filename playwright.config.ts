import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  globalTimeout: 10 * 60 * 1000,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  webServer: {
    command: process.env.CI
      ? "pnpm preview --host 127.0.0.1 --port 4321"
      : "pnpm build && pnpm preview --host 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321",
    timeout: 120_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "on-first-retry",
  },
});
