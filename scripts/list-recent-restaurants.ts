/**
 * One-off / dev helper: print newest restaurants by created_at.
 * Usage: npx tsx scripts/list-recent-restaurants.ts
 */
import { config } from "dotenv";
import { desc } from "drizzle-orm";

config({ path: ".env.local" });

import { getDb } from "../src/db";
import { restaurants } from "../src/db/schema";

async function main() {
  const db = getDb();
  const rows = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      cuisine: restaurants.cuisine,
      createdAt: restaurants.createdAt,
      updatedAt: restaurants.updatedAt,
      lat: restaurants.lat,
      lng: restaurants.lng,
      geocodeSource: restaurants.geocodeSource,
    })
    .from(restaurants)
    .orderBy(desc(restaurants.createdAt))
    .limit(12);

  if (rows.length === 0) {
    console.log("No rows in `restaurants` table.");
    return;
  }

  console.log("Newest pins in DB (by created_at):\n");
  for (const r of rows) {
    const loc =
      r.lat != null && r.lng != null
        ? `${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`
        : "(no coords)";
    console.log(
      `• ${r.name}\n  id: ${r.id}\n  created: ${r.createdAt?.toISOString()}\n  geo: ${loc}  source: ${r.geocodeSource ?? "—"}\n`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
