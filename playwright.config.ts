import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  testDir: "./tests/e2e",
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- -H 127.0.0.1 -p 3100",
    env: {
      COVEO_DEVELOPMENT_QUERY_OVERRIDES: "true",
      COVEO_FEATURE_SAMPLE_SEARCH_RESPONSE: "true",
      NEXT_PUBLIC_DEMO_PROFILE: "industrial-product-discovery",
      NODE_ENV: "development",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://127.0.0.1:3100",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
