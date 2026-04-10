import type { LatLng } from "./types";

// Handles common Google Maps URL patterns:
// - .../@53.4808,-2.2426,17z
// - ...!3d53.4808!4d-2.2426
export function parseGoogleMapsLatLng(url: string): LatLng | null {
  const at = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };

  const bang = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (bang) return { lat: Number(bang[1]), lng: Number(bang[2]) };

  return null;
}

