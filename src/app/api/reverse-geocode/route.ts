import { lookupRestaurantWebsite } from "@/lib/lookupRestaurantWebsite";

export const runtime = "nodejs";

let lastCallAt = 0;

function clamp(s: string, max: number) {
  const t = s.trim();
  return t.length > max ? t.slice(0, max) : t;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");
  const placeName = clamp(searchParams.get("name") ?? "", 120);
  const placeCity = clamp(searchParams.get("city") ?? "", 80);

  const lat = latRaw === null ? NaN : Number(latRaw);
  const lng = lngRaw === null ? NaN : Number(lngRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "Missing or invalid `lat` / `lng`" }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return Response.json({ error: "Coordinates out of range" }, { status: 400 });
  }

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

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "QasimEats/1.0 (https://github.com/qasimali9001/QasimEats; Nominatim reverse)",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return Response.json(
      { error: `Reverse geocode failed (${res.status})` },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { display_name?: string; error?: string };

  if (data.error) {
    return Response.json({ label: null as string | null });
  }

  const label =
    typeof data.display_name === "string" && data.display_name.trim().length > 0
      ? data.display_name.trim()
      : null;

  let websiteUrl: string | null = null;
  if (placeName) {
    try {
      websiteUrl = await lookupRestaurantWebsite({
        name: placeName,
        city: placeCity,
        lat,
        lng,
      });
    } catch {
      websiteUrl = null;
    }
  }

  return Response.json({ label, websiteUrl });
}
