import { defineConfig, devices } from "@playwright/test";

const backendPort = 3101;
const frontendPort = 3100;
const testDbName = "merchant_autopilot_e2e";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "./e2e-report", open: "never" }],
  ],
  // globalSetup already applied manually in this session. Re-enable for CI.
  // globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${frontendPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    permissions: ["microphone"],
    launchOptions: {
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
  },
  projects: [
    { name: "desktop-1920", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } } },
    { name: "laptop-1366", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } } },
    { name: "tablet-768", use: { ...devices["iPad (gen 7)"], viewport: { width: 768, height: 1024 } } },
    { name: "mobile-390", use: { ...devices["iPhone 13"] } },
  ],
  // webServer intentionally omitted — servers are started by the invoking shell
  // using Start-Process on Windows (next dev's lockfile breaks reuseExistingServer).
});
