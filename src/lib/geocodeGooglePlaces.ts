/**
 * Optional: resolve lat/lng via Google Places Text Search when Nominatim misses a venue.
 * Uses GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY (same as website lookup).
 */

import { regionForGooglePlaces } from "@/lib/countryCodes";

function getPlacesApiKey(): string | null {
  const k =
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim();
  return k || null;
}

/**
 * Text Search geocode fallback. Same API key as Place Details / website lookup.
 * `countryIso2` null = worldwide (no `region` bias).
 */
export async function geocodeViaGooglePlacesTextSearch(
  name: string,
  city: string,
  countryIso2: string | null
): Promise<{ lat: number; lng: number; label: string } | null> {
  const apiKey = getPlacesApiKey();
  if (!apiKey) return null;

  const n = name.trim();
  const c = city.trim();
  if (!n || !c) return null;

  const query = `${n} ${c}`;
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/textsearch/json"
  );
  url.searchParams.set("query", query);
  const region = regionForGooglePlaces(countryIso2);
  if (region) {
    url.searchParams.set("region", region);
  }
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    status: string;
    results?: Array<{
      geometry?: { location?: { lat: number; lng: number } };
      formatted_address?: string;
      name?: string;
    }>;
  };

  if (data.status !== "OK" || !data.results?.length) return null;

  const r = data.results[0];
  const loc = r.geometry?.location;
  if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
    return null;
  }

  const label = r.formatted_address ?? r.name ?? query;

  return {
    lat: loc.lat,
    lng: loc.lng,
    label,
  };
}
