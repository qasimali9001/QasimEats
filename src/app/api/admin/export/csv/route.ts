import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { restaurants } from "@/db/schema";
import { requireAdminSession } from "@/lib/session";
import { rowToCsvLine } from "@/lib/csvEscape";

export const runtime = "nodejs";

const HEADERS = [
  "Id",
  "Name",
  "Cuisine/Type",
  "Price",
  "What I Ordered",
  "Distance",
  "Rating (out of 5)",
  "Review",
  "Latitude",
  "Longitude",
  "Website",
  "Google Maps",
  "Menu",
  "Geocode source",
  "Geocode label",
  "Lunch",
  "Dinner",
  "Entry date",
  "Created at",
  "Updated at",
] as const;

function fmtDate(d: Date | null | undefined): string {
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function fmtNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return String(n);
}

function fmtRating(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return String(n);
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session?.admin?.username) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(restaurants)
    .orderBy(asc(restaurants.name));

  const lines: string[] = [rowToCsvLine([...HEADERS])];

  for (const r of rows) {
    lines.push(
      rowToCsvLine([
        r.id,
        r.name,
        r.cuisine,
        r.price,
        r.whatIOrdered,
        r.distanceText,
        fmtRating(r.rating),
        r.review,
        fmtNum(r.lat),
        fmtNum(r.lng),
        r.websiteUrl ?? "",
        r.googleMapsUrl ?? "",
        r.menuUrl ?? "",
        r.geocodeSource ?? "",
        r.geocodeLabel ?? "",
        r.lunch ? "yes" : "",
        r.dinner ? "yes" : "",
        r.entryDate ?? "",
        fmtDate(r.createdAt),
        fmtDate(r.updatedAt),
      ])
    );
  }

  const csv = lines.join("\r\n") + "\r\n";
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `qasimeats-export-${stamp}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
