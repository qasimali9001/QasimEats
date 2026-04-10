/**
 * Smoke-test Neon using DATABASE_URL from .env.local (never prints URL/password).
 * Run: node scripts/test-neon-connection.mjs
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

const root = process.cwd();
if (existsSync(resolve(root, ".env"))) config({ path: resolve(root, ".env") });
if (existsSync(resolve(root, ".env.local")))
  config({ path: resolve(root, ".env.local") });

const url =
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_URL?.trim();
if (!url) {
  console.error("FAIL: DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(url);
const rows = await sql`SELECT 1 AS ok`;
console.log("Neon query OK (connection string not logged).");
console.log("Result:", JSON.stringify(rows));
