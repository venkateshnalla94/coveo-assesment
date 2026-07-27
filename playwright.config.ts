import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  testDir: "./tests/e2e",
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    // CI runs against a production build: `next dev`'s on-demand route compilation is too slow on
    // GitHub's shared runners and causes cascading timeouts across the suite. Locally, dev mode's
    // fast refresh is worth keeping.
    command: process.env.CI ? "npm run start -- -H localhost -p 3000" : "npm run dev -- -H localhost -p 3000",
    env: {
      NODE_ENV: process.env.CI ? "production" : "development",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://localhost:3000",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
