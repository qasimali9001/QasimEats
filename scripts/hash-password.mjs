#!/usr/bin/env node
/**
 * Generate bcrypt hash for admin login. Prefer the B64 line in .env.local
 * (Next.js corrupts raw bcrypt in unquoted env values because of `$`).
 *
 * Usage: npm run hash-password -- "your-password"
 */
import bcrypt from "bcryptjs";
import { Buffer } from "node:buffer";

const pwd = process.argv[2];
if (!pwd) {
  console.error('Usage: npm run hash-password -- "your-password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(pwd, 10);
const b64 = Buffer.from(hash, "utf8").toString("base64");

console.log("bcrypt (60 chars, for reference only — do not paste raw into .env):");
console.log(hash);
console.log("");
console.log("Add this line to `.env.local` (safe with Next.js):");
console.log(`SUPERUSER_PASSWORD_HASH_B64=${b64}`);
