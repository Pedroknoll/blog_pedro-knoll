import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "pnpm build && pnpm preview --host 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321",
    timeout: 120_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4321",
  },
});
