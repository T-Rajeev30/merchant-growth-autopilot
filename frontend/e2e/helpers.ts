import { Page, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export function credentials(): { email: string; password: string } {
  if (process.env.E2E_EMAIL && process.env.E2E_PASSWORD) {
    return { email: process.env.E2E_EMAIL, password: process.env.E2E_PASSWORD };
  }
  return JSON.parse(readFileSync(join(__dirname, ".state", "credentials.json"), "utf8"));
}

export async function login(page: Page): Promise<void> {
  const { email, password } = credentials();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/" || url.pathname.startsWith("/?")),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);
  await expect(page.getByRole("button", { name: /sign out/i }).first()).toBeVisible();
}
