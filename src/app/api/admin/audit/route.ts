import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLog } from "@/db/schema";
import { requireAdminSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session?.admin?.username) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    200,
    Math.max(1, Number(searchParams.get("limit") ?? "80") || 80)
  );

  const db = getDb();
  const rows = await db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  return Response.json({ entries: rows });
}
