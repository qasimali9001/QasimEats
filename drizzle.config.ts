import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

const root = process.cwd();
if (existsSync(resolve(root, ".env"))) config({ path: resolve(root, ".env") });
if (existsSync(resolve(root, ".env.local")))
  config({ path: resolve(root, ".env.local") });

const url =
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  process.env.POSTGRES_PRISMA_URL?.trim();

if (!url) {
  throw new Error(
    "Set DATABASE_URL in .env.local (Neon connection string) before running drizzle-kit."
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
