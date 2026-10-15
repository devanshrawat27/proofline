import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests. By default they start the API and web dev servers; if the
 * stack is already running (or E2E_BASE_URL is set) they reuse it.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: "pnpm --filter @proofline/api start:dev",
          url: "http://localhost:4000/ready",
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: "pnpm --filter @proofline/web dev",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
});
