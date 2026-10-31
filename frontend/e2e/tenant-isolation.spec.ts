import { test, expect, request } from "@playwright/test";

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3101";
const origin = "http://localhost:3100";

test.describe("Cross-merchant isolation", () => {
  test("authenticated user cannot read another merchant's data via x-merchant-id", async () => {
    const ctx = await request.newContext();
    const login = await ctx.post(`${api}/api/auth/login`, {
      data: { email: process.env.E2E_EMAIL, password: process.env.E2E_PASSWORD },
      headers: { origin },
    });
    expect(login.ok()).toBeTruthy();

    const forged = "a".repeat(24);
    const response = await ctx.get(`${api}/api/customers?page=1`, { headers: { "x-merchant-id": forged } });
    expect([401, 403, 404]).toContain(response.status());
    await ctx.dispose();
  });

  test("voice tools endpoint requires an authorized merchant", async () => {
    const ctx = await request.newContext();
    const unauth = await ctx.post(`${api}/api/voice/tools`, { data: { tool: "today_sales" } });
    expect(unauth.status()).toBe(401);
    await ctx.dispose();
  });

  test("campaigns list is scoped to the authenticated merchant", async () => {
    const ctx = await request.newContext();
    const login = await ctx.post(`${api}/api/auth/login`, {
      data: { email: process.env.E2E_EMAIL, password: process.env.E2E_PASSWORD },
      headers: { origin },
    });
    expect(login.ok()).toBeTruthy();
    const merchants = await ctx.get(`${api}/api/merchants`);
    const list = (await merchants.json()).merchants;
    expect(list.length).toBeGreaterThan(0);
    const campaigns = await ctx.get(`${api}/api/campaigns`, { headers: { "x-merchant-id": list[0].id } });
    expect(campaigns.ok()).toBeTruthy();
    await ctx.dispose();
  });
});
