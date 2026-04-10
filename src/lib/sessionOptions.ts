import type { SessionOptions } from "iron-session";

function sessionPassword(): string {
  const p = process.env.SESSION_SECRET?.trim();
  if (p && p.length >= 32) return p;
  console.warn(
    "QasimEats: SESSION_SECRET missing or shorter than 32 characters — using a dev-only default. Set SESSION_SECRET in `.env.local` (and in hosting env for production)."
  );
  return "dev-only-please-set-SESSION_SECRET-in-env-file!";
}

export function getSessionOptions(): SessionOptions {
  return {
    password: sessionPassword(),
    cookieName: "qasimeats_admin",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    },
  };
}
