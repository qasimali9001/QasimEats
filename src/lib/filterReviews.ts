import type { Review, ReviewFilters } from "./types";

function includesCI(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function filterReviews(reviews: Review[], filters: ReviewFilters) {
  const q = filters.query.trim();

  return reviews.filter((r) => {
    if (!filters.includeUnlocated && r.needsLocation) return false;

    if (filters.cuisines.length && !filters.cuisines.includes(r.cuisine)) {
      return false;
    }

    if (filters.prices.length && !filters.prices.includes(r.price)) {
      return false;
    }

    if (filters.minRating > 0) {
      const rating = r.rating ?? 0;
      if (rating < filters.minRating) return false;
    }

    if (q) {
      const hay = `${r.name} ${r.cuisine} ${r.review} ${r.whatIOrdered}`.trim();
      if (!includesCI(hay, q)) return false;
    }

    return true;
  });
}

