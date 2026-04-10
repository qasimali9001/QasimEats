/**
 * Import reviews from the bundled CSV into SQLite (upsert by stable id).
 * Run after: npm run db:push
 *
 *   npm run db:seed
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDb } from "../src/db";
import { restaurants } from "../src/db/schema";
import { parseReviewsCsv } from "../src/lib/parseCsv";

async function readCsv() {
  const candidates = [
    join(process.cwd(), "data", "Manchester Food Ratings.csv"),
    join(process.cwd(), "Manchester Food Ratings.csv"),
    join(process.cwd(), "data", "sample-reviews.csv"),
  ];
  for (const p of candidates) {
    try {
      return await readFile(p, "utf8");
    } catch {
      /* try next */
    }
  }
  throw new Error("No CSV found under data/ or project root.");
}

async function main() {
  const csvText = await readCsv();
  const reviews = parseReviewsCsv(csvText);
  const db = getDb();
  const now = new Date();

  let n = 0;
  for (const r of reviews) {
    const row = {
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      price: r.price,
      whatIOrdered: r.whatIOrdered,
      distanceText: r.distanceText,
      rating: r.rating,
      review: r.review,
      googleMapsUrl: r.googleMapsUrl ?? null,
      websiteUrl: r.websiteUrl ?? null,
      menuUrl: r.menuUrl ?? null,
      lat: r.location?.lat ?? null,
      lng: r.location?.lng ?? null,
      geocodeSource: r.geocode?.source ?? null,
      geocodeLabel: r.geocode?.label ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await db
      .insert(restaurants)
      .values(row)
      .onConflictDoUpdate({
        target: restaurants.id,
        set: {
          name: row.name,
          cuisine: row.cuisine,
          price: row.price,
          whatIOrdered: row.whatIOrdered,
          distanceText: row.distanceText,
          rating: row.rating,
          review: row.review,
          googleMapsUrl: row.googleMapsUrl,
          websiteUrl: row.websiteUrl,
          menuUrl: row.menuUrl,
          lat: row.lat,
          lng: row.lng,
          geocodeSource: row.geocodeSource,
          geocodeLabel: row.geocodeLabel,
          updatedAt: now,
        },
      });
    n += 1;
  }

  console.log(`Seeded ${n} restaurant row(s) into SQLite.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
