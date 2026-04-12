import type { Review } from "@/lib/types";

/**
 * Google Maps URL: prefer stored place/link, else search by coordinates,
 * else search by name + Manchester.
 */
export function googleMapsLinkForReview(r: Review): string {
  const stored = r.googleMapsUrl?.trim();
  if (stored) return stored;

  if (r.location) {
    return googleMapsUrlFromLatLng(r.location.lat, r.location.lng);
  }

  const q = `${r.name}, Manchester, UK`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Search URL pinned to coordinates (same as public map fallback). */
export function googleMapsUrlFromLatLng(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

/** Ensure links open correctly when users omit `https://`. */
export function normalizeHttpUrl(raw: string | null | undefined): string | null {
  const s = raw?.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s.replace(/^\/+/, "")}`;
}
