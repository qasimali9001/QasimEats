import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { restaurants } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { isoDateLocal } from "@/lib/entryDate";
import { parseRestaurantBody, snapshotRow } from "@/lib/restaurantPayload";
import { requireAdminSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireAdminSession();
  if (!session?.admin?.username) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(restaurants)
    .orderBy(asc(restaurants.name));
  return Response.json({ restaurants: rows });
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session?.admin?.username) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseRestaurantBody(body, "create");
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Bad request" },
      { status: 400 }
    );
  }

  if (!parsed.name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const now = new Date();
  const id = crypto.randomUUID();

  const entryDate =
    "entryDate" in parsed
      ? (parsed.entryDate ?? null)
      : isoDateLocal(now);

  const row = {
    id,
    name: parsed.name,
    cuisine: parsed.cuisine ?? "",
    price: parsed.price ?? "",
    whatIOrdered: parsed.whatIOrdered ?? "",
    distanceText: parsed.distanceText ?? "",
    rating: parsed.rating ?? null,
    review: parsed.review ?? "",
    googleMapsUrl: parsed.googleMapsUrl ?? null,
    websiteUrl: parsed.websiteUrl ?? null,
    menuUrl: parsed.menuUrl ?? null,
    lat: parsed.lat ?? null,
    lng: parsed.lng ?? null,
    geocodeSource: parsed.geocodeSource ?? null,
    geocodeLabel: parsed.geocodeLabel ?? null,
    lunch: parsed.lunch ?? false,
    dinner: parsed.dinner ?? false,
    entryDate,
    createdAt: now,
    updatedAt: now,
  };

  const db = getDb();
  await db.insert(restaurants).values(row);

  await writeAudit({
    actor: session.admin.username,
    action: "create",
    entityType: "restaurant",
    entityId: id,
    summary: `Created "${row.name}"`,
    after: snapshotRow(row),
  });

  return Response.json({ restaurant: row });
}
