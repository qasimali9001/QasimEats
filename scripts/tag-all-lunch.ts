/**
 * One-off: set lunch=true for every restaurant row.
 * Usage: npx tsx scripts/tag-all-lunch.ts
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { sql } from "drizzle-orm";

if (existsSync(resolve(process.cwd(), ".env.local"))) {
  config({ path: resolve(process.cwd(), ".env.local") });
}

import { getDb } from "../src/db";
import { restaurants } from "../src/db/schema";

async function main() {
  const db = getDb();
  const now = new Date();
  const result = await db
    .update(restaurants)
    .set({ lunch: true, updatedAt: now })
    .where(sql`1 = 1`);

  console.log("Updated rows (lunch=true):", result.rowCount ?? result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
