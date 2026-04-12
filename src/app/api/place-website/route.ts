import {
  DEFAULT_COUNTRY_CODE,
  parseCountryCodeParam,
  regionForGooglePlaces,
} from "@/lib/countryCodes";
import { lookupRestaurantWebsite } from "@/lib/lookupRestaurantWebsite";
import { requireAdminSession } from "@/lib/session";

export const runtime = "nodejs";

let lastCallAt = 0;

export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session?.admin?.username) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("name") ?? "").trim().slice(0, 180);
  const city = (searchParams.get("city") ?? "").trim().slice(0, 80);
  const countryIso2 = parseCountryCodeParam(
    searchParams.get("country") ?? DEFAULT_COUNTRY_CODE
  );
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!name) {
    return Response.json({ error: "Missing name" }, { status: 400 });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json(
      { error: "Missing or invalid lat / lng — set a location first." },
      { status: 400 }
    );
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

  let websiteUrl: string | null = null;
  try {
    websiteUrl = await lookupRestaurantWebsite({
      name,
      city,
      lat,
      lng,
      region: regionForGooglePlaces(countryIso2),
    });
  } catch {
    websiteUrl = null;
  }

  return Response.json({ websiteUrl });
}
