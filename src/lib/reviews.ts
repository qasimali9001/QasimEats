import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { restaurants } from "@/db/schema";
import { parseReviewsCsv } from "./parseCsv";
import { restaurantRowToReview } from "./reviewFromDb";
import type { Review } from "./types";

async function readCsvFromKnownPaths() {
  const candidates = [
    join(process.cwd(), "data", "Manchester Food Ratings.csv"),
    join(process.cwd(), "Manchester Food Ratings.csv"),
    join(process.cwd(), "data", "sample-reviews.csv"),
  ];

  let lastErr: unknown = null;
  for (const p of candidates) {
    try {
      return await readFile(p, "utf8");
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/**
 * Prefer Postgres when available and has at least one row; otherwise CSV fallback.
 */
export async function getInitialReviews(): Promise<Review[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(restaurants)
      .orderBy(asc(restaurants.name));
    if (rows.length > 0) {
      return rows.map(restaurantRowToReview);
    }
  } catch (e) {
    console.warn(
      "QasimEats: database empty or unavailable, using CSV fallback.",
      e
    );
  }

  const csvText = await readCsvFromKnownPaths();
  return parseReviewsCsv(csvText);
}
