import { test, expect } from "@playwright/test";
import { credentials, login } from "./helpers";

test.describe("Authentication", () => {
  test("unauthenticated visitor is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("invalid credentials show an error and keep user signed out", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@example.invalid");
    await page.getByLabel("Password").fill("badPasswordNope1234");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("valid credentials sign the user in and load the dashboard", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/$|\/\?/);
    // Dashboard key heading or stat tile.
    await expect(page.getByText(credentials().email).first()).toBeVisible();
  });

  test("session is restored after a hard refresh", async ({ page }) => {
    await login(page);
    await page.reload();
    await expect(page).toHaveURL(/\/$|\/\?/);
    await expect(page.getByText(credentials().email).first()).toBeVisible();
  });

  test("logout returns the user to /login and protects pages again", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: /sign out/i }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });
});
