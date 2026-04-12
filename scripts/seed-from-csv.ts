/**
 * Import reviews from the bundled CSV into Postgres (upsert by stable id).
 * Requires DATABASE_URL. Run after: npm run db:push
 *
 *   npm run db:seed
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";
import { getDb } from "../src/db";
import { restaurants } from "../src/db/schema";
import { parseReviewsCsv } from "../src/lib/parseCsv";

function loadEnvLocal() {
  const root = process.cwd();
  if (existsSync(resolve(root, ".env"))) config({ path: resolve(root, ".env") });
  if (existsSync(resolve(root, ".env.local")))
    config({ path: resolve(root, ".env.local") });
}

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
  loadEnvLocal();
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
      cuisineTag: "",
      dishTags: "[]",
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
      countryIso2: r.countryIso2 ?? "",
      lunch: r.lunch,
      dinner: r.dinner,
      entryDate: null,
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
          cuisineTag: row.cuisineTag,
          dishTags: row.dishTags,
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
          countryIso2: row.countryIso2,
          lunch: row.lunch,
          dinner: row.dinner,
          updatedAt: now,
        },
      });
    n += 1;
  }

  console.log(`Seeded ${n} restaurant row(s) into Postgres.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
