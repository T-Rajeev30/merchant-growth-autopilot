import { test, expect, request } from "@playwright/test";

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3101";

test.describe("API security", () => {
  test("unauthenticated API returns 401", async () => {
    const ctx = await request.newContext();
    const response = await ctx.get(`${api}/api/dashboard/stats`);
    expect(response.status()).toBe(401);
    await ctx.dispose();
  });

  test("x-merchant-id spoof without a session returns 401 (auth comes before merchant check)", async () => {
    const ctx = await request.newContext();
    const response = await ctx.get(`${api}/api/customers?page=1`, { headers: { "x-merchant-id": "a".repeat(24) } });
    expect(response.status()).toBe(401);
    await ctx.dispose();
  });

  test("health endpoint is public", async () => {
    const ctx = await request.newContext();
    const response = await ctx.get(`${api}/api/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
    await ctx.dispose();
  });

  test("login with wrong password returns 401 and no cookie", async () => {
    const ctx = await request.newContext();
    const response = await ctx.post(`${api}/api/auth/login`, {
      data: { email: "nobody@example.invalid", password: "wrongPasswordXYZ1" },
      headers: { origin: "http://localhost:3100" },
    });
    expect(response.status()).toBe(401);
    const cookies = (await ctx.storageState()).cookies;
    expect(cookies.find((c) => c.name === "mga_session")).toBeUndefined();
    await ctx.dispose();
  });

  test("writes require CSRF header matching the cookie", async () => {
    const ctx = await request.newContext();
    const login = await ctx.post(`${api}/api/auth/login`, {
      data: { email: process.env.E2E_EMAIL, password: process.env.E2E_PASSWORD },
      headers: { origin: "http://localhost:3100" },
    });
    expect(login.ok()).toBeTruthy();
    // Fetching a protected merchant resource — need merchant id first.
    const merchantsResponse = await ctx.get(`${api}/api/merchants`);
    expect(merchantsResponse.ok()).toBeTruthy();
    const { merchants } = await merchantsResponse.json();
    const merchantId = merchants[0].id as string;
    // PATCH without the CSRF header should be rejected (expect 403).
    const noCsrf = await ctx.patch(`${api}/api/merchants/profile`, {
      data: { city: "Spoofed" },
      headers: { "x-merchant-id": merchantId, origin: "http://localhost:3100" },
    });
    expect(noCsrf.status()).toBe(403);
    await ctx.dispose();
  });
});
