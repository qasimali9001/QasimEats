import { priceRangeForPounds } from "./foodMeta";
import type { Review, ReviewFilters } from "./types";

function includesCI(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function filterReviews(reviews: Review[], filters: ReviewFilters) {
  const q = filters.query.trim();

  return reviews.filter((r) => {
    if (!filters.includeUnlocated && r.needsLocation) return false;

    if (
      filters.cuisineGroups.length &&
      !filters.cuisineGroups.includes(r.cuisineGroup)
    ) {
      return false;
    }

    if (filters.dishTypes.length) {
      const any = filters.dishTypes.some((t) => r.dishTypes.includes(t));
      if (!any) return false;
    }

    if (filters.priceRanges.length) {
      const bucket = priceRangeForPounds(r.pricePounds);
      if (bucket == null || !filters.priceRanges.includes(bucket)) {
        return false;
      }
    }

    if (filters.minRating > 0) {
      const rating = r.rating ?? 0;
      if (rating < filters.minRating) return false;
    }

    if (q) {
      const hay =
        `${r.name} ${r.cuisine} ${r.cuisineGroup} ${r.dishTypes.join(" ")} ${r.review} ${r.whatIOrdered} ${r.googleMapsUrl ?? ""} ${r.websiteUrl ?? ""} ${r.menuUrl ?? ""}`.trim();
      if (!includesCI(hay, q)) return false;
    }

    return true;
  });
}

