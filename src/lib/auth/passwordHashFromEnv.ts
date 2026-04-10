import { Buffer } from "node:buffer";

/**
 * Next.js / dotenv treats `$...` as variable expansion, which corrupts bcrypt
 * strings in `SUPERUSER_PASSWORD_HASH`. Prefer `SUPERUSER_PASSWORD_HASH_B64`
 * (base64 of the exact 60-char bcrypt string).
 */
export function getSuperuserPasswordHashFromEnv():
  | { ok: true; hash: string }
  | { ok: false; message: string } {
  const b64 = process.env.SUPERUSER_PASSWORD_HASH_B64?.trim();
  if (b64) {
    try {
      const decoded = Buffer.from(b64, "base64").toString("utf8").trim();
      if (/^\$2[aby]?\$\d{2}\$/.test(decoded) && decoded.length === 60) {
        return { ok: true, hash: decoded };
      }
      return {
        ok: false,
        message:
          "SUPERUSER_PASSWORD_HASH_B64 decoded to an invalid bcrypt string (expected 60 chars starting with $2…).",
      };
    } catch {
      return { ok: false, message: "Invalid SUPERUSER_PASSWORD_HASH_B64." };
    }
  }

  const raw = process.env.SUPERUSER_PASSWORD_HASH?.trim();
  if (!raw) {
    return {
      ok: false,
      message:
        "Set SUPERUSER_PASSWORD_HASH_B64 (recommended) or SUPERUSER_PASSWORD_HASH in `.env.local`.",
    };
  }

  if (/^\$2[aby]?\$\d{2}\$/.test(raw) && raw.length === 60) {
    return { ok: true, hash: raw };
  }

  return {
    ok: false,
    message:
      "SUPERUSER_PASSWORD_HASH is not a valid 60-character bcrypt string. Next.js often corrupts unquoted `$` in .env — run `npm run hash-password` and use the SUPERUSER_PASSWORD_HASH_B64 line instead.",
  };
}
