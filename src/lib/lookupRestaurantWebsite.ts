/**
 * Optional: resolve an official site URL via Google Places (Text Search + Place Details).
 * Set GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY and enable Places API on the key.
 */

function getPlacesApiKey(): string | null {
  const k =
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim();
  return k || null;
}

export async function lookupRestaurantWebsite(opts: {
  name: string;
  city: string;
  lat: number;
  lng: number;
}): Promise<string | null> {
  const apiKey = getPlacesApiKey();
  if (!apiKey) return null;

  const name = opts.name.trim();
  const city = opts.city.trim();
  if (!name) return null;

  const query = city ? `${name} ${city}` : name;

  try {
    const textSearchUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/textsearch/json"
    );
    textSearchUrl.searchParams.set("query", query);
    textSearchUrl.searchParams.set("location", `${opts.lat},${opts.lng}`);
    textSearchUrl.searchParams.set("radius", "8000");
    textSearchUrl.searchParams.set("region", "uk");
    textSearchUrl.searchParams.set("key", apiKey);

    const tsRes = await fetch(textSearchUrl.toString(), { cache: "no-store" });
    if (!tsRes.ok) return null;

    const tsData = (await tsRes.json()) as {
      status: string;
      results?: Array<{ place_id?: string }>;
    };

    if (tsData.status !== "OK" || !tsData.results?.length) {
      return null;
    }

    const placeId = tsData.results[0]?.place_id;
    if (!placeId) return null;

    const detailsUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    detailsUrl.searchParams.set("place_id", placeId);
    detailsUrl.searchParams.set("fields", "website");
    detailsUrl.searchParams.set("key", apiKey);

    const dRes = await fetch(detailsUrl.toString(), { cache: "no-store" });
    if (!dRes.ok) return null;

    const dData = (await dRes.json()) as {
      status: string;
      result?: { website?: string };
    };

    if (dData.status !== "OK") return null;

    const raw = dData.result?.website?.trim();
    if (!raw) return null;
    if (!/^https?:\/\//i.test(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}
