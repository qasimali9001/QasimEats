import type { Review } from "@/lib/types";

/**
 * Google Maps URL: prefer stored place/link, else search by coordinates,
 * else search by name + Manchester.
 */
export function googleMapsLinkForReview(r: Review): string {
  const stored = r.googleMapsUrl?.trim();
  if (stored) return stored;

  if (r.location) {
    const { lat, lng } = r.location;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }

  const q = `${r.name}, Manchester, UK`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Ensure links open correctly when users omit `https://`. */
export function normalizeHttpUrl(raw: string | null | undefined): string | null {
  const s = raw?.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s.replace(/^\/+/, "")}`;
}
