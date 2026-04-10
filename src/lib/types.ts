export type LatLng = { lat: number; lng: number };

export type Review = {
  id: string;
  name: string;
  cuisine: string;
  price: string;
  whatIOrdered: string;
  distanceText: string;
  rating: number | null;
  review: string;
  googleMapsUrl?: string;
  location: LatLng | null;
  needsLocation: boolean;
  geocode?: {
    source: "googleMapsUrl" | "nominatim" | "csv";
    label?: string;
    importance?: number;
  };
};

export type ReviewFilters = {
  query: string;
  cuisines: string[];
  prices: string[];
  minRating: number;
  includeUnlocated: boolean;
};

