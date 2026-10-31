import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const TEST_EMAIL = "e2e-owner@example.test";
const TEST_PASSWORD = "e2eOwnerPassword!2026";
const TEST_DB = "merchant_autopilot_e2e";

export default async function globalSetup() {
  const backendCwd = join(__dirname, "..", "..", "backend");
  const env = {
    ...process.env,
    MONGODB_DB_NAME: TEST_DB,
    DEMO_OWNER_EMAIL: TEST_EMAIL,
    DEMO_OWNER_PASSWORD: TEST_PASSWORD,
  };

  console.log(`[e2e setup] Seeding Sharma Ji's Kitchen into ${TEST_DB}...`);
  execSync("npx tsx src/db/seed-sharma.ts", { cwd: backendCwd, env, stdio: "inherit" });

  console.log(`[e2e setup] Provisioning test owner ${TEST_EMAIL}...`);
  execSync("npx tsx src/db/create-demo-owner.ts", { cwd: backendCwd, env, stdio: "inherit" });

  // Make credentials visible to the specs via process.env (set here) and a file.
  process.env.E2E_EMAIL = TEST_EMAIL;
  process.env.E2E_PASSWORD = TEST_PASSWORD;
  const outDir = join(__dirname, ".state");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "credentials.json"), JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }));

  console.log("[e2e setup] Ready.");
}
