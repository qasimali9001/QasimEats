import {
  countryLabelForNominatim,
  DEFAULT_COUNTRY_CODE,
  parseCountryCodeParam,
  regionForGooglePlaces,
} from "@/lib/countryCodes";
import { geocodeViaGooglePlacesTextSearch } from "@/lib/geocodeGooglePlaces";
import {
  buildNominatimQueryVariants,
  normalizeGeocodePhrase,
  shouldUseManchesterViewbox,
  MANCHESTER_VIEWBOX,
} from "@/lib/geocodeQuery";
import { lookupRestaurantWebsite } from "@/lib/lookupRestaurantWebsite";

export const runtime = "nodejs";

type GeocodeResult = {
  lat: number;
  lng: number;
  label: string;
  importance?: number;
  query?: string;
  websiteUrl?: string | null;
  source?: "nominatim" | "google_places";
};

function clampQuery(q: string) {
  const s = q.trim();
  return s.length > 180 ? s.slice(0, 180) : s;
}

let lastCallAt = 0;

async function enforceNominatimThrottle(): Promise<void> {
  const now = Date.now();
  const delta = now - lastCallAt;
  if (delta < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - delta));
  }
  lastCallAt = Date.now();
}

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
  class?: string;
  type?: string;
};

function pickBestNominatimHit(data: NominatimHit[]): NominatimHit | null {
  if (!data?.length) return null;
  const preferred = data.find(
    (r) =>
      r.class === "amenity" &&
      ["restaurant", "cafe", "bar", "fast_food", "pub", "food_court"].includes(
        r.type ?? ""
      )
  );
  return preferred ?? data[0];
}

async function nominatimSearch(
  q: string,
  options: {
    boundedManchester: boolean;
    countryIso2: string | null;
  }
): Promise<NominatimHit | null> {
  await enforceNominatimThrottle();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", q);
  url.searchParams.set("addressdetails", "1");
  if (options.countryIso2) {
    url.searchParams.set("countrycodes", options.countryIso2.toLowerCase());
  }

  if (options.boundedManchester) {
    url.searchParams.set("viewbox", MANCHESTER_VIEWBOX);
    url.searchParams.set("bounded", "1");
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "QasimEats/1.0 (https://github.com/qasimali9001/QasimEats; Nominatim geocoding)",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as NominatimHit[];
  return pickBestNominatimHit(data);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const nameRaw = clampQuery(searchParams.get("name") ?? "");
  const cityRaw = clampQuery(searchParams.get("city") ?? "Manchester");
  const countryIso2 = parseCountryCodeParam(
    searchParams.get("country") ?? DEFAULT_COUNTRY_CODE
  );

  const name = normalizeGeocodePhrase(nameRaw) || nameRaw.trim();
  const city = normalizeGeocodePhrase(cityRaw) || cityRaw.trim();

  if (!name) {
    return Response.json({ error: "Missing `name`" }, { status: 400 });
  }

  const countryLabel = countryIso2 ? countryLabelForNominatim(countryIso2) : null;
  const variants = buildNominatimQueryVariants(name, city, countryLabel);
  const boundedManchester = shouldUseManchesterViewbox(city, countryIso2);

  let top: NominatimHit | null = null;
  let usedQuery: string | null = null;

  for (const q of variants) {
    try {
      const hit = await nominatimSearch(q, {
        boundedManchester,
        countryIso2,
      });
      if (hit) {
        top = hit;
        usedQuery = q;
        break;
      }
    } catch {
      return Response.json(
        { error: "Geocode service error. Try again shortly." },
        { status: 502 }
      );
    }
  }

  let lat: number;
  let lng: number;
  let label: string;
  let importance: number | undefined;
  let source: GeocodeResult["source"] = "nominatim";
  let queryUsed = usedQuery ?? variants[0] ?? `${name}, ${city}`;

  if (top) {
    lat = Number(top.lat);
    lng = Number(top.lon);
    label = top.display_name;
    importance = top.importance;
  } else {
    const g = await geocodeViaGooglePlacesTextSearch(name, city, countryIso2);
    if (!g) {
      return Response.json({ result: null });
    }
    lat = g.lat;
    lng = g.lng;
    label = g.label;
    source = "google_places";
    queryUsed = `${name} ${city} (Google Places)`;
  }

  let websiteUrl: string | null = null;
  try {
    websiteUrl = await lookupRestaurantWebsite({
      name: nameRaw.trim() || name,
      city,
      lat,
      lng,
      region: regionForGooglePlaces(countryIso2),
    });
  } catch {
    websiteUrl = null;
  }

  const result: GeocodeResult = {
    lat,
    lng,
    label,
    importance,
    query: queryUsed,
    websiteUrl,
    source,
  };

  return Response.json({ result });
}
