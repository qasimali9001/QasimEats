import { AppShell } from "@/components/AppShell";
import { getInitialReviews } from "@/lib/reviews";

export default function Home() {
  const reviewsPromise = getInitialReviews();
  return (
    <AppShell reviewsPromise={reviewsPromise} />
  );
}
