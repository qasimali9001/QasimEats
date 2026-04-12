import type { restaurants } from "@/db/schema";

export type RestaurantUpsert = {
  name: string;
  cuisine: string;
  price: string;
  whatIOrdered: string;
  distanceText: string;
  rating: number | null;
  review: string;
  googleMapsUrl: string | null;
  websiteUrl: string | null;
  menuUrl: string | null;
  lat: number | null;
  lng: number | null;
  geocodeSource: string | null;
  geocodeLabel: string | null;
  lunch?: boolean;
  dinner?: boolean;
};

function str(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v).trim();
}

function numOrNull(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseRestaurantBody(
  input: unknown,
  mode: "create" | "update"
): Partial<RestaurantUpsert> & { name?: string } {
  if (typeof input !== "object" || input === null) {
    throw new Error("Expected JSON object");
  }
  const o = input as Record<string, unknown>;
  const name = str(o.name);
  if (mode === "create" && !name) {
    throw new Error("Name is required");
  }

  const out: Partial<RestaurantUpsert> & { name?: string } = {};
  if (name) out.name = name;
  if ("cuisine" in o) out.cuisine = str(o.cuisine);
  if ("price" in o) out.price = str(o.price);
  if ("whatIOrdered" in o) out.whatIOrdered = str(o.whatIOrdered);
  if ("distanceText" in o) out.distanceText = str(o.distanceText);
  if ("rating" in o) {
    const r = numOrNull(o.rating);
    out.rating = r;
  }
  if ("review" in o) out.review = str(o.review);
  if ("googleMapsUrl" in o) {
    const g = str(o.googleMapsUrl);
    out.googleMapsUrl = g ? g : null;
  }
  if ("websiteUrl" in o) {
    const g = str(o.websiteUrl);
    out.websiteUrl = g ? g : null;
  }
  if ("menuUrl" in o) {
    const g = str(o.menuUrl);
    out.menuUrl = g ? g : null;
  }
  if ("lat" in o) out.lat = numOrNull(o.lat);
  if ("lng" in o) out.lng = numOrNull(o.lng);
  if ("geocodeSource" in o) {
    const s = str(o.geocodeSource);
    out.geocodeSource = s ? s : null;
  }
  if ("geocodeLabel" in o) {
    const s = str(o.geocodeLabel);
    out.geocodeLabel = s ? s : null;
  }
  if ("lunch" in o) out.lunch = Boolean(o.lunch);
  if ("dinner" in o) out.dinner = Boolean(o.dinner);
  return out;
}

export function snapshotRow(
  row: typeof restaurants.$inferSelect
): Record<string, unknown> {
  return {
    id: row.id,
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
    lunch: row.lunch,
    dinner: row.dinner,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
