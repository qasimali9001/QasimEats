import type { Map } from "maplibre-gl";

/**
 * Default basemap: **OpenFreeMap** vector style (OpenMapTiles schema, Planetiler-derived tiles).
 * Attribution is supplied by the style (OpenFreeMap / OpenMapTiles / OSM as required).
 *
 * Override with `NEXT_PUBLIC_MAP_STYLE_URL` (e.g. another `tiles.openfreemap.org/styles/…` URL).
 *
 * @see https://openfreemap.org/
 */
export const DEFAULT_MAP_STYLE_URL =
  "https://tiles.openfreemap.org/styles/dark";

/** Deep navy canvas — “midnight blue” land base. */
const BG = "#0a1224";
/** Water slightly darker than land for subtle contrast. */
const WATER = "#050c18";
const WATER_RIVER = "#0a1628";

/**
 * Road & building colours — edit hex/rgba here (same blue family, lower = darker).
 * Labels live in `LABEL_*` below; road *names* use LABEL_ROAD / LABEL_ROAD_MOTORWAY.
 */
const ROAD_MINOR = "#354e78";
const ROAD_MAJOR = "#46689e";
const ROAD_MAJOR_SUBTLE = "#2c4568";
const ROAD_CASING = "rgba(55, 82, 118, 0.88)";
const ROAD_MOTORWAY = "#4f78b0";
const ROAD_MOTORWAY_CASING = "rgba(70, 105, 150, 0.92)";

const BUILDING = "#101f34";
const BUILDING_OUTLINE = "#162a42";
const AEROWAY = "#151f32";
const RAIL = "#3d5878";
const RAIL_DASH_BG = BG;

const BOUNDARY = "rgba(55, 85, 125, 0.6)";

/** Place names (cities, towns, villages, countries, …) */
const LABEL_CITY = "#b9cce8";
const LABEL_TOWN = "#8fa6c4";
const LABEL_ACCENT = "#5dd4f0";
const LABEL_STATE = "#9eb4d4";
const LABEL_COUNTRY = "#a3b8d6";

/** Street / motorway name labels along roads */
const LABEL_ROAD = "#6d849e";
const LABEL_ROAD_MOTORWAY = "#889eb8";
const LABEL_WATER = "#6b8eb8";

/** Text halo behind labels (keeps type readable on dark land). */
const HALO = "rgba(6, 10, 20, 0.92)";

function safe<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

/**
 * Tints OpenFreeMap `dark` (and compatible OFM styles) toward monochromatic navy (Eggeats-like).
 * Safe no-op if layer ids differ (unrelated `NEXT_PUBLIC_MAP_STYLE_URL`).
 */
export function applyOpenFreeMapEggeatsTheme(map: Map) {
  const setPaint = (id: string, prop: string, value: unknown) => {
    if (!map.getLayer(id)) return;
    safe(() => map.setPaintProperty(id, prop, value));
  };

  setPaint("background", "background-color", BG);

  setPaint("water", "fill-color", WATER);
  setPaint("waterway", "line-color", WATER_RIVER);
  setPaint("water_name", "text-color", LABEL_WATER);
  setPaint("water_name", "text-halo-color", HALO);
  setPaint("water_name", "text-halo-width", 1.2);

  setPaint("landcover_ice_shelf", "fill-color", BG);
  setPaint("landcover_glacier", "fill-color", "#0c1426");
  setPaint("landuse_residential", "fill-color", "#0c1528");
  setPaint("landuse_park", "fill-color", "#0b1426");
  setPaint("landcover_wood", "fill-opacity", 0);

  setPaint("building", "fill-color", BUILDING);
  setPaint("building", "fill-outline-color", BUILDING_OUTLINE);

  setPaint("aeroway-taxiway", "line-color", AEROWAY);
  setPaint("aeroway-runway-casing", "line-color", ROAD_CASING);
  setPaint("aeroway-area", "fill-color", "#0a1426");
  setPaint("aeroway-runway", "line-color", "#1a2d48");

  setPaint("road_area_pier", "fill-color", BG);
  setPaint("road_pier", "line-color", BG);
  setPaint("highway_path", "line-color", ROAD_MAJOR_SUBTLE);
  setPaint("highway_minor", "line-color", ROAD_MINOR);
  setPaint("highway_major_casing", "line-color", ROAD_CASING);
  setPaint("highway_major_inner", "line-color", ROAD_MAJOR);
  setPaint("highway_major_subtle", "line-color", ROAD_MAJOR_SUBTLE);
  setPaint("highway_motorway_casing", "line-color", ROAD_MOTORWAY_CASING);
  setPaint("highway_motorway_inner", "line-color", ROAD_MOTORWAY);
  setPaint("highway_motorway_subtle", "line-color", ROAD_MAJOR_SUBTLE);

  setPaint("railway_transit", "line-color", RAIL);
  setPaint("railway_transit_dashline", "line-color", RAIL_DASH_BG);
  setPaint("railway_minor", "line-color", RAIL);
  setPaint("railway_minor_dashline", "line-color", RAIL_DASH_BG);
  setPaint("railway", "line-color", RAIL);
  setPaint("railway_dashline", "line-color", RAIL_DASH_BG);

  setPaint("highway_name_other", "text-color", LABEL_ROAD);
  setPaint("highway_name_other", "text-halo-color", HALO);
  setPaint("highway_name_motorway", "text-color", LABEL_ROAD_MOTORWAY);

  setPaint("boundary_state", "line-color", BOUNDARY);
  setPaint("boundary_country_z0-4", "line-color", BOUNDARY);
  setPaint("boundary_country_z5-", "line-color", BOUNDARY);

  const cityPaint = {
    "text-color": LABEL_CITY,
    "text-halo-color": HALO,
    "text-halo-width": 1.2,
  } as const;
  const townPaint = {
    "text-color": LABEL_TOWN,
    "text-halo-color": HALO,
    "text-halo-width": 1.2,
  } as const;
  const accentPaint = {
    "text-color": LABEL_ACCENT,
    "text-halo-color": HALO,
    "text-halo-width": 1.2,
  } as const;

  for (const id of ["place_city", "place_city_large", "place_state"] as const) {
    const p = id === "place_state" ? townPaint : cityPaint;
    setPaint(id, "text-color", p["text-color"]);
    setPaint(id, "text-halo-color", p["text-halo-color"]);
    setPaint(id, "text-halo-width", p["text-halo-width"]);
  }

  for (const id of ["place_town"] as const) {
    setPaint(id, "text-color", townPaint["text-color"]);
    setPaint(id, "text-halo-color", townPaint["text-halo-color"]);
    setPaint(id, "text-halo-width", townPaint["text-halo-width"]);
  }

  for (const id of ["place_other", "place_suburb", "place_village"] as const) {
    setPaint(id, "text-color", accentPaint["text-color"]);
    setPaint(id, "text-halo-color", accentPaint["text-halo-color"]);
    setPaint(id, "text-halo-width", accentPaint["text-halo-width"]);
  }

  for (const id of [
    "place_country_other",
    "place_country_minor",
    "place_country_major",
  ] as const) {
    setPaint(id, "text-color", LABEL_COUNTRY);
    setPaint(id, "text-halo-color", HALO);
    setPaint(id, "text-halo-width", 1.4);
  }
}
