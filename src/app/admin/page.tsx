import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { restaurants } from "@/db/schema";
import { requireAdminSession } from "@/lib/session";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await requireAdminSession();
  if (!session?.admin) {
    redirect("/admin/login");
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(restaurants)
    .orderBy(asc(restaurants.name));

  const serialized = JSON.parse(JSON.stringify(rows)) as Parameters<
    typeof AdminDashboard
  >[0]["initialRows"];

  return <AdminDashboard initialRows={serialized} />;
}
