import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir:"./tests",
  testMatch:"**/*.spec.mjs",
  timeout:60_000,
  expect:{timeout:10_000},
  use:{...devices["Desktop Chrome"],baseURL:"http://127.0.0.1:4173",headless:true},
  webServer:{command:"node scripts/serve.mjs",url:"http://127.0.0.1:4173/he/",reuseExistingServer:!process.env.CI,timeout:30_000},
  reporter:process.env.CI?"github":"list",
  workers:1,
  retries:process.env.CI?1:0
});
