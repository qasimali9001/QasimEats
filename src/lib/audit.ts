import { getDb } from "@/db";
import { auditLog } from "@/db/schema";

export async function writeAudit(opts: {
  actor: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string | null;
  before?: unknown;
  after?: unknown;
}) {
  const db = getDb();
  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    actor: opts.actor,
    action: opts.action,
    entityType: opts.entityType,
    entityId: opts.entityId ?? null,
    summary: opts.summary ?? null,
    beforeJson:
      opts.before !== undefined ? JSON.stringify(opts.before) : null,
    afterJson: opts.after !== undefined ? JSON.stringify(opts.after) : null,
    createdAt: new Date(),
  });
}
