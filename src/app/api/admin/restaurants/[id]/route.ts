import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { restaurants } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { stringifyDishTags } from "@/lib/dishTagsJson";
import { parseRestaurantBody, snapshotRow } from "@/lib/restaurantPayload";
import { requireAdminSession } from "@/lib/session";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await requireAdminSession();
  if (!session?.admin?.username) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const db = getDb();
  const [row] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, id))
    .limit(1);

  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ restaurant: row });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await requireAdminSession();
  if (!session?.admin?.username) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseRestaurantBody(body, "update");
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Bad request" },
      { status: 400 }
    );
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, id))
    .limit(1);

  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const next = {
    ...existing,
    ...(parsed.name !== undefined ? { name: parsed.name } : {}),
    ...(parsed.cuisine !== undefined ? { cuisine: parsed.cuisine } : {}),
    ...(parsed.cuisineTag !== undefined ? { cuisineTag: parsed.cuisineTag } : {}),
    ...(parsed.dishTags !== undefined
      ? { dishTags: stringifyDishTags(parsed.dishTags ?? []) }
      : {}),
    ...(parsed.price !== undefined ? { price: parsed.price } : {}),
    ...(parsed.whatIOrdered !== undefined
      ? { whatIOrdered: parsed.whatIOrdered }
      : {}),
    ...(parsed.distanceText !== undefined
      ? { distanceText: parsed.distanceText }
      : {}),
    ...(parsed.rating !== undefined ? { rating: parsed.rating } : {}),
    ...(parsed.review !== undefined ? { review: parsed.review } : {}),
    ...(parsed.googleMapsUrl !== undefined
      ? { googleMapsUrl: parsed.googleMapsUrl }
      : {}),
    ...(parsed.websiteUrl !== undefined
      ? { websiteUrl: parsed.websiteUrl }
      : {}),
    ...(parsed.menuUrl !== undefined ? { menuUrl: parsed.menuUrl } : {}),
    ...(parsed.lat !== undefined ? { lat: parsed.lat } : {}),
    ...(parsed.lng !== undefined ? { lng: parsed.lng } : {}),
    ...(parsed.geocodeSource !== undefined
      ? { geocodeSource: parsed.geocodeSource }
      : {}),
    ...(parsed.geocodeLabel !== undefined
      ? { geocodeLabel: parsed.geocodeLabel }
      : {}),
    ...(parsed.countryIso2 !== undefined
      ? { countryIso2: parsed.countryIso2 }
      : {}),
    ...(parsed.lunch !== undefined ? { lunch: parsed.lunch } : {}),
    ...(parsed.dinner !== undefined ? { dinner: parsed.dinner } : {}),
    ...(parsed.entryDate !== undefined ? { entryDate: parsed.entryDate } : {}),
    updatedAt: now,
  };

  await db.update(restaurants).set(next).where(eq(restaurants.id, id));

  await writeAudit({
    actor: session.admin.username,
    action: "update",
    entityType: "restaurant",
    entityId: id,
    summary: `Updated "${next.name}"`,
    before: snapshotRow(existing),
    after: snapshotRow(next),
  });

  return Response.json({ restaurant: next });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await requireAdminSession();
  if (!session?.admin?.username) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const db = getDb();
  const [existing] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, id))
    .limit(1);

  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(restaurants).where(eq(restaurants.id, id));

  await writeAudit({
    actor: session.admin.username,
    action: "delete",
    entityType: "restaurant",
    entityId: id,
    summary: `Deleted "${existing.name}"`,
    before: snapshotRow(existing),
  });

  return Response.json({ ok: true });
}
