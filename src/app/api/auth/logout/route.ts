import { writeAudit } from "@/lib/audit";
import { getAdminSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const session = await getAdminSession();
  const name = session.admin?.username;
  session.destroy();

  if (name) {
    await writeAudit({
      actor: name,
      action: "logout",
      entityType: "auth",
      summary: "Session cleared",
    });
  }

  return Response.json({ ok: true });
}
