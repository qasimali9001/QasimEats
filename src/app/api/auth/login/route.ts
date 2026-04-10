import bcrypt from "bcryptjs";
import { writeAudit } from "@/lib/audit";
import { getSuperuserPasswordHashFromEnv } from "@/lib/auth/passwordHashFromEnv";
import {
  clearLoginFailures,
  isLoginBlocked,
  rateLimitKey,
  recordLoginFailure,
} from "@/lib/auth/loginRateLimit";
import { getAdminSession } from "@/lib/session";

export const runtime = "nodejs";

function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: Request) {
  const expectedUser = process.env.SUPERUSER_USERNAME?.trim();
  const hashResult = getSuperuserPasswordHashFromEnv();

  if (!expectedUser) {
    return Response.json(
      { error: "Set SUPERUSER_USERNAME in `.env.local`." },
      { status: 503 }
    );
  }

  if (!hashResult.ok) {
    return Response.json({ error: hashResult.message }, { status: 503 });
  }

  const hash = hashResult.hash;

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const u = (body.username ?? "").trim();
  const p = body.password ?? "";
  const key = rateLimitKey(clientIp(req), u || "unknown");

  if (isLoginBlocked(key)) {
    return Response.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const matchUser = u === expectedUser;
  const matchPass =
    matchUser && p.length > 0 && (await bcrypt.compare(p, hash));

  if (!matchPass) {
    recordLoginFailure(key);
    await writeAudit({
      actor: u || "unknown",
      action: "login_failed",
      entityType: "auth",
      summary: "Invalid credentials",
    });
    return Response.json({ error: "Invalid username or password" }, { status: 401 });
  }

  clearLoginFailures(key);
  const session = await getAdminSession();
  session.admin = { username: u };
  await session.save();

  await writeAudit({
    actor: u,
    action: "login_success",
    entityType: "auth",
    summary: "Session created",
  });

  return Response.json({ ok: true });
}
