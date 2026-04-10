import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function getDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim();
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL (or POSTGRES_URL). Add your Neon connection string to .env.local. See .env.example."
    );
  }
  return url;
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  const sql = neon(getDatabaseUrl());
  _db = drizzle(sql, { schema });
  return _db;
}

export type Db = NonNullable<typeof _db>;
