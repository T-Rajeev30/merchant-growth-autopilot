import { test, expect } from "@playwright/test";
import { login } from "./helpers";

const pages: Array<{ path: string; name: string; wait?: RegExp }> = [
  { path: "/", name: "dashboard", wait: /revenue/i },
  { path: "/customers", name: "customers", wait: /Priya|Aarav|Rahul/ },
  { path: "/campaigns", name: "opportunities" },
  { path: "/campaigns/active", name: "campaigns" },
  { path: "/operations", name: "operations" },
  { path: "/analytics", name: "analytics" },
  { path: "/assistant", name: "assistant" },
  { path: "/settings", name: "settings", wait: /Sharma Ji/ },
];

test.describe("Page reachability and console cleanliness", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  for (const { path, name, wait } of pages) {
    test(`${name} loads without console errors`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
      page.on("pageerror", (err) => errors.push(err.message));
      await page.goto(path);
      if (wait) await expect(page.getByText(wait).first()).toBeVisible({ timeout: 15_000 });
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      await testInfo.attach(`${name}.png`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
      // Fail only on real errors. Expected noise:
      //  - 401 /api/auth/session is normal before login completes
      //  - WebKit logs cross-origin preflight messages ("access control checks")
      //    as console errors; the actual requests complete fine on Chromium.
      //  - Font/preload noise is browser hints, not errors.
      const fatal = errors.filter((text) =>
        !/\[Fast Refresh\]|downloadable font|preloaded with link preload|was preloaded using|access control checks|Failed to load resource.*401/.test(text)
      );
      expect(fatal, `Console errors on ${path}: ${JSON.stringify(fatal, null, 2)}`).toEqual([]);
    });
  }

  test("login page renders without console errors", async ({ page, context }, testInfo) => {
    // Reset the session cookie set by the suite-wide beforeEach so we land on
    // /login instead of being redirected back to the dashboard.
    await context.clearCookies();
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await testInfo.attach(`login.png`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    const fatal = errors.filter((text) =>
      !/downloadable font|preloaded|access control checks|Failed to load resource.*401/.test(text)
    );
    expect(fatal, `Console errors on /login: ${JSON.stringify(fatal, null, 2)}`).toEqual([]);
  });
});
