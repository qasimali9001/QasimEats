import { getAdminSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session.admin?.username) {
    return Response.json({ user: null });
  }
  return Response.json({ user: session.admin.username });
}
