export type LatLng = { lat: number; lng: number };

export type PriceRangeId = "lt5" | "5-10" | "10-15" | "15plus";

export type Review = {
  id: string;
  name: string;
  /** Raw CSV label */
  cuisine: string;
  /** Broad group for filters, e.g. Mexican */
  cuisineGroup: string;
  /** Dish tags, e.g. Burrito, Ramen */
  dishTypes: string[];
  /** Raw price cell */
  price: string;
  /** Parsed £ amount for filters and display; null if not parseable */
  pricePounds: number | null;
  whatIOrdered: string;
  distanceText: string;
  rating: number | null;
  review: string;
  googleMapsUrl?: string;
  /** Restaurant website (manual or CSV). */
  websiteUrl?: string;
  /** Link to menu (PDF, page, or third-party). */
  menuUrl?: string;
  location: LatLng | null;
  needsLocation: boolean;
  geocode?: {
    source: "googleMapsUrl" | "nominatim" | "csv" | "manual";
    label?: string;
    importance?: number;
  };
  /** Good for lunch / daytime visit */
  lunch: boolean;
  /** Good for dinner / evening visit */
  dinner: boolean;
};

export type MealTag = "lunch" | "dinner";

export type ReviewFilters = {
  query: string;
  cuisineGroups: string[];
  dishTypes: string[];
  priceRanges: PriceRangeId[];
  minRating: number;
  includeUnlocated: boolean;
  /** Empty = any. If set, show places that match at least one selected tag. */
  mealTags: MealTag[];
};

export const DEFAULT_REVIEW_FILTERS: ReviewFilters = {
  query: "",
  cuisineGroups: [],
  dishTypes: [],
  priceRanges: [],
  minRating: 0,
  includeUnlocated: false,
  mealTags: [],
};
