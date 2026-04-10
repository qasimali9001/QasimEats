import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseReviewsCsv } from "./parseCsv";
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

export async function getInitialReviews(): Promise<Review[]> {
  const csvText = await readCsvFromKnownPaths();
  return parseReviewsCsv(csvText);
}

