/**
 * Merges hardcoded lat/lng into data/Manchester Food Ratings.csv
 * Run from repo root: node scripts/apply-hardcoded-coords.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const csvPath = join(root, "data", "Manchester Food Ratings.csv");

/** @type {Record<string, { lat: number; lng: number }>} */
const COORDS = {
  Hawksmoor: { lat: 53.4789712, lng: -2.2493758 },
  Pieminister: { lat: 53.4827941, lng: -2.2360245 },
  Gerrys: { lat: 53.48075, lng: -2.2376 }, // Piccadilly Gardens (food truck)
  "Bisous Bisous": { lat: 53.481783, lng: -2.2471755 },
  Bunsik: { lat: 53.4805972, lng: -2.2371852 },
  "Street Guys (Street Star)": { lat: 53.46445, lng: -2.2284 }, // Oxford Rd area
  "Listo's": { lat: 53.46055, lng: -2.227 },
  Panchos: { lat: 53.4834, lng: -2.2403 },
  Koreana: { lat: 53.4815059, lng: -2.2492617 },
  "Wong Wong": { lat: 53.47845, lng: -2.24015 },
  "Ban Mi Co Ba": { lat: 53.4699, lng: -2.2318 },
  Zaap: { lat: 53.4787, lng: -2.2389 },
  "Go Falafel": { lat: 53.4812, lng: -2.248 },
  "Greek Gyros & Bar": { lat: 53.4809, lng: -2.2467 },
  "Ram Yum": { lat: 53.4754, lng: -2.2544 },
  "Holy Grain Bakery": { lat: 53.4851, lng: -2.241 },
  Shirleys: { lat: 53.4799, lng: -2.244 },
  "Soup Co": { lat: 53.48055, lng: -2.238 },
  Topkapi: { lat: 53.4792, lng: -2.2455 },
  Rolawala: { lat: 53.4793, lng: -2.2486 },
  HOP: { lat: 53.4781, lng: -2.246 },
  "This n That": { lat: 53.4843, lng: -2.2328 },
  "Lets Sushi": { lat: 53.4806, lng: -2.2384 },
  Katsouris: { lat: 53.482, lng: -2.2452 },
  "Pizza Pilgrim": { lat: 53.483, lng: -2.244 },
  HoniPoke: { lat: 53.481, lng: -2.247 },
  "Middle Point (?)": { lat: 53.4835, lng: -2.2404 },
  "Ohannes Burger": { lat: 53.486, lng: -2.257 },
};

const text = readFileSync(csvPath, "utf8");
const records = parse(text, {
  columns: true,
  bom: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true,
  trim: true,
});

for (const row of records) {
  const name = row.Name ?? row.name;
  const c = COORDS[name];
  if (!c) {
    console.warn("Missing coord for:", name);
    continue;
  }
  row.Latitude = String(c.lat);
  row.Longitude = String(c.lng);
}

const header = Object.keys(records[0]);
const out = stringify(records, { header: true, columns: header });
writeFileSync(csvPath, out, "utf8");
console.log("Wrote", csvPath, "rows:", records.length);
