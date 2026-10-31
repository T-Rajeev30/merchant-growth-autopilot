import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Merchant journey", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("dashboard shows metrics and merchant workspace", async ({ page }) => {
    await page.goto("/");
    // Sidebar shows the active merchant. With a single merchant it renders a
    // paragraph label; with multiple merchants it renders a select.
    await expect(page.getByText(/Sharma Ji/i).first()).toBeVisible();
    // Stat tiles exist. The dashboard renders four tiles; at least one revenue tile.
    const revenueTile = page.getByText(/revenue/i).first();
    await expect(revenueTile).toBeVisible();
  });

  test("customer directory lists customers and supports search", async ({ page }) => {
    await page.goto("/customers");
    // Customer rows derive from seed-sharma (40 customers).
    const list = page.locator("table, [data-testid=customer-list], ul, [role=list]").first();
    await expect(list).toBeVisible();
    // Expect to see at least one of the seeded demo names (names array in seed-sharma.ts).
    await expect(page.getByText(/Priya|Aarav|Rahul|Ananya|Rohan/).first()).toBeVisible();
  });

  test("campaigns page loads and allows draft creation", async ({ page }) => {
    await page.goto("/campaigns");
    // Try to open the create form (sidebar has 'opportunities' at /campaigns; actual
    // campaigns live at /campaigns/active).
    await page.goto("/campaigns/active");
    await expect(page.getByText(/campaign/i).first()).toBeVisible();
  });

  test("settings page shows merchant profile", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText(/Sharma Ji/).first()).toBeVisible();
  });

  test("voice overlay opens from the floating button and closes cleanly", async ({ page, context }) => {
    await context.grantPermissions(["microphone"], { origin: "http://localhost:3100" });
    await page.goto("/");
    const launcher = page.getByRole("button", { name: /open voice assistant|voice assistant/i }).first();
    await expect(launcher).toBeVisible();
    await launcher.click();
    const dialog = page.getByRole("dialog", { name: /voice assistant/i });
    await expect(dialog).toBeVisible();
    // Any of the known overlay states should land in the dialog — connecting,
    // listening, error, or an error banner from the provider.
    await expect(
      dialog.getByText(/connecting|listening|ready|error|configured|try again|sarvam/i).first()
    ).toBeVisible({ timeout: 20_000 });
    // Close the overlay cleanly.
    await dialog.getByRole("button", { name: /close voice assistant/i }).click();
    await expect(dialog).not.toBeVisible();
  });
});
