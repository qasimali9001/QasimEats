import { AppShell } from "@/components/AppShell";
import { getInitialReviews } from "@/lib/reviews";

/** Always read restaurants from Postgres so new pins appear without rebuilding. */
export const dynamic = "force-dynamic";

export default function Home() {
  const reviewsPromise = getInitialReviews();
  return (
    <AppShell reviewsPromise={reviewsPromise} />
  );
}
