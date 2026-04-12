import { parseDishTagsJson } from "@/lib/dishTagsJson";
import { cuisineToGroup, parsePriceToPounds } from "@/lib/foodMeta";
import type { Review } from "@/lib/types";
import type { restaurants } from "@/db/schema";

export type RestaurantRow = typeof restaurants.$inferSelect;

export function restaurantRowToReview(row: RestaurantRow): Review {
  const pricePounds = parsePriceToPounds(row.price);
  const cuisineGroup = row.cuisineTag?.trim()
    ? row.cuisineTag.trim()
    : cuisineToGroup(row.cuisine);
  /** Only explicit tags from `dish_tags` — no keyword inference from order text. */
  const dishTypes = parseDishTagsJson(row.dishTags);
  const hasLoc = row.lat != null && row.lng != null;

  const geocode: Review["geocode"] =
    row.geocodeSource && hasLoc
      ? {
          source: row.geocodeSource as NonNullable<Review["geocode"]>["source"],
          label: row.geocodeLabel ?? undefined,
        }
      : undefined;

  return {
    id: row.id,
    name: row.name,
    cuisine: row.cuisine,
    cuisineGroup,
    dishTypes,
    price: row.price,
    pricePounds,
    whatIOrdered: row.whatIOrdered,
    distanceText: row.distanceText,
    rating: row.rating,
    review: row.review,
    googleMapsUrl: row.googleMapsUrl ?? undefined,
    websiteUrl: row.websiteUrl ?? undefined,
    menuUrl: row.menuUrl ?? undefined,
    location: hasLoc ? { lat: row.lat!, lng: row.lng! } : null,
    needsLocation: !hasLoc,
    geocode,
    lunch: row.lunch,
    dinner: row.dinner,
  };
}
