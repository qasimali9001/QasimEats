/**
 * Fills Website column in data/Manchester Food Ratings.csv from
 * src/lib/suggestedWebsites.ts (single source of truth).
 * Run: npx tsx scripts/add-websites.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { MANCHESTER_SUGGESTED_WEBSITES } from "../src/lib/suggestedWebsites";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const csvPath = join(root, "data", "Manchester Food Ratings.csv");

const text = readFileSync(csvPath, "utf8");
const records = parse(text, {
  columns: true,
  bom: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true,
  trim: true,
});

for (const row of records as Record<string, string>[]) {
  const name = row.Name ?? row.name;
  const w = MANCHESTER_SUGGESTED_WEBSITES[name as string];
  if (w === undefined) {
    throw new Error(`Unknown restaurant name in suggested map: ${JSON.stringify(name)}`);
  }
  row.Website = w;
}

const header = Object.keys(records[0] as object);
const out = stringify(records, { header: true, columns: header });
writeFileSync(csvPath, out, "utf8");
console.log("Wrote", csvPath, "rows:", records.length);
