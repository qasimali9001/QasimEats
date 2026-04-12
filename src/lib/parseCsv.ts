import { parse } from "csv-parse/sync";
import { countryIso2ToStorage } from "./countryCodes";
import { parseDishTagsJson } from "./dishTagsJson";
import { cuisineToGroup, parsePriceToPounds } from "./foodMeta";
import { stableReviewId } from "./stableId";
import { parseGoogleMapsLatLng } from "./parseGoogleMaps";
import type { Review } from "./types";

type RawRow = Record<string, string | undefined>;

function toNumberOrNull(input: string | undefined) {
  if (!input) return null;
  const n = Number(String(input).trim());
  return Number.isFinite(n) ? n : null;
}

function normKey(k: string) {
  return k
    .replace(/^\uFEFF/, "") // strip UTF-8 BOM if present
    .trim()
    .toLowerCase()
    .replace(/[\s/_()]+/g, "");
}

function pick(row: RawRow, keys: string[]) {
  // Fast path: exact keys
  for (const k of keys) {
    const v = row[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }

  // Robust path: BOM/whitespace/formatting differences in headers
  const byNorm = new Map<string, string | undefined>();
  for (const [k, v] of Object.entries(row)) byNorm.set(normKey(k), v);

  for (const k of keys) {
    const v = byNorm.get(normKey(k));
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }

  return "";
}

export function parseReviewsCsv(csvText: string): Review[] {
  const records = parse(csvText, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  }) as RawRow[];

  return records.map((row) => {
    const idFromCsv = pick(row, ["Id", "ID", "id"]);
    const name = pick(row, ["Name", "name"]);
    const cuisine = pick(row, ["Cuisine/Type", "Cuisine", "Type", "cuisine"]);
    const price = pick(row, ["Price", "price"]);
    const whatIOrdered = pick(row, ["What I Ordered", "Order", "whatIOrdered"]);
    const distanceText = pick(row, ["Distance", "Distance ", "distance"]);
    const rating = toNumberOrNull(
      pick(row, ["Rating (out of 5)", "Rating", "rating"])
    );
    const review = pick(row, ["Review", "review"]);
    const googleMapsUrl = pick(row, [
      "Google Maps",
      "GoogleMaps",
      "Maps",
      "googleMapsUrl",
      "Google Maps URL",
      "Google Maps Link",
    ]);
    const websiteUrl = pick(row, [
      "Website",
      "website",
      "Website URL",
      "Restaurant website",
    ]);
    const menuUrl = pick(row, [
      "Menu",
      "Menu URL",
      "menu",
      "menuUrl",
      "Menu link",
    ]);

    const latRaw = pick(row, [
      "Latitude",
      "latitude",
      "Lat",
      "lat",
    ]);
    const lngRaw = pick(row, [
      "Longitude",
      "longitude",
      "Lng",
      "lng",
      "Lon",
      "lon",
    ]);
    const lat = toNumberOrNull(latRaw);
    const lng = toNumberOrNull(lngRaw);
    const locFromCsv =
      lat != null && lng != null ? { lat, lng } : null;

    const locFromUrl = googleMapsUrl
      ? parseGoogleMapsLatLng(googleMapsUrl)
      : null;

    const loc = locFromCsv ?? locFromUrl;

    const geocodeSourcePick = pick(row, [
      "Geocode source",
      "geocode_source",
      "Geocode Source",
    ]);
    const geocodeLabelPick = pick(row, ["Geocode label", "geocode_label", "Geocode Label"]);
    const countryIso2Raw = pick(row, [
      "Country ISO2",
      "country_iso2",
      "Country",
      "country",
    ]);
    const countryIso2 = countryIso2ToStorage(countryIso2Raw);

    const pricePounds = parsePriceToPounds(price);
    const cuisineGroup = cuisineToGroup(cuisine);
    const dishTagsRaw = pick(row, [
      "Dish tags (JSON)",
      "Dish tags",
      "dish_tags",
      "DishTags",
    ]);
    const dishTypes = dishTagsRaw
      ? parseDishTagsJson(dishTagsRaw)
      : [];

    const id =
      idFromCsv.trim().length > 0
        ? idFromCsv.trim()
        : stableReviewId({ name, cuisine, whatIOrdered });

    const validGeocodeSources = new Set([
      "googleMapsUrl",
      "nominatim",
      "google_places",
      "csv",
      "manual",
    ]);

    let geocode: Review["geocode"] | undefined;
    if (locFromCsv) {
      if (geocodeSourcePick && validGeocodeSources.has(geocodeSourcePick)) {
        geocode = {
          source: geocodeSourcePick as NonNullable<Review["geocode"]>["source"],
          label: geocodeLabelPick || undefined,
        };
      } else {
        geocode = {
          source: "csv",
          label:
            geocodeLabelPick ||
            (geocodeSourcePick ? geocodeSourcePick : "From CSV (Latitude/Longitude)"),
        };
      }
    } else if (locFromUrl) {
      geocode = { source: "googleMapsUrl", label: "From Google Maps URL" };
    }

    return {
      id,
      name,
      cuisine,
      cuisineGroup,
      dishTypes,
      price,
      pricePounds,
      whatIOrdered,
      distanceText,
      rating,
      review,
      googleMapsUrl: googleMapsUrl || undefined,
      websiteUrl: websiteUrl || undefined,
      menuUrl: menuUrl || undefined,
      location: loc,
      needsLocation: !loc,
      geocode,
      lunch: false,
      dinner: false,
      ...(countryIso2 ? { countryIso2 } : {}),
    };
  });
}

