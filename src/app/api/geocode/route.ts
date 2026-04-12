import { lookupRestaurantWebsite } from "@/lib/lookupRestaurantWebsite";

export const runtime = "nodejs";

type GeocodeResult = {
  lat: number;
  lng: number;
  label: string;
  importance?: number;
  query?: string;
  /** Present when Google Places lookup found an official site (requires API key). */
  websiteUrl?: string | null;
};

function clampQuery(q: string) {
  const s = q.trim();
  return s.length > 180 ? s.slice(0, 180) : s;
}

let lastCallAt = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = clampQuery(searchParams.get("name") ?? "");
  const city = clampQuery(searchParams.get("city") ?? "Manchester");
  const country = clampQuery(searchParams.get("country") ?? "UK");

  if (!name) {
    return Response.json({ error: "Missing `name`" }, { status: 400 });
  }

  // Be a good citizen: throttle calls from this server process.
  const now = Date.now();
  const delta = now - lastCallAt;
  if (delta < 1100) {
    return Response.json(
      { error: "Rate limited. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((1100 - delta) / 1000)) },
      }
    );
  }
  lastCallAt = now;

  const q = `${name}, ${city}, ${country}`;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", q);
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "gb");
  // Bias hard to Greater Manchester area. (left,top,right,bottom)
  // This prevents many "not found" cases from snapping to Manchester city center.
  url.searchParams.set("viewbox", "-2.60,53.60,-2.05,53.35");
  url.searchParams.set("bounded", "1");

  const res = await fetch(url, {
    headers: {
      // Nominatim requests a descriptive UA. In Next's fetch, this becomes a normal header.
      "User-Agent":
        "QasimEats/1.0 (https://github.com/qasimali9001/QasimEats; Nominatim geocoding)",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return Response.json(
      { error: `Geocode failed (${res.status})` },
      { status: 502 }
    );
  }

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    importance?: number;
  }>;

  const top = data?.[0];
  if (!top) return Response.json({ result: null });

  const lat = Number(top.lat);
  const lng = Number(top.lon);

  let websiteUrl: string | null = null;
  try {
    websiteUrl = await lookupRestaurantWebsite({
      name,
      city,
      lat,
      lng,
    });
  } catch {
    websiteUrl = null;
  }

  const result: GeocodeResult = {
    lat,
    lng,
    label: top.display_name,
    importance: top.importance,
    query: q,
    websiteUrl,
  };

  return Response.json({ result });
}

