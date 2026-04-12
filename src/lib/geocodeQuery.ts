/**
 * Build tolerant search strings for Nominatim (punctuation, spacing, venue suffixes).
 */

/** Collapse spaces, trim, strip characters that often break fuzzy matching. */
export function normalizeGeocodePhrase(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[''']/g, "")
    .replace(/[.,;:!?()[\]{}]/g, " ")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Greater Manchester bbox (lon left, lat top, lon right, lat bottom) — Nominatim viewbox order. */
export const MANCHESTER_VIEWBOX = "-2.60,53.60,-2.05,53.35" as const;

export function isManchesterArea(city: string): boolean {
  const c = city.trim().toLowerCase();
  return c === "" || c === "manchester";
}

/** Only UK + Manchester (or empty city defaulting to Manchester) uses the tight local viewbox. */
export function shouldUseManchesterViewbox(
  city: string,
  countryIso2: string | null
): boolean {
  if (countryIso2 !== "gb") return false;
  return isManchesterArea(city);
}

/** "Marco Polo Restaurant" → "Marco Polo"; "Joe's Café" already normalized apostrophe out */
export function stripCommonVenueSuffixes(name: string): string {
  let s = name.trim();
  s = s.replace(
    /\s+(restaurant|restaurants|cafe|café|coffee shop|bar & grill|bar and grill|bar|pub|bistro|grill|kitchen|pizzeria|steakhouse)\s*$/i,
    ""
  );
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Ordered query strings to try (most specific first).
 * Partial names like "Marco Polo" + "Hartlepool" work as long as city is correct.
 */
/**
 * @param countryLabel - English country name for Nominatim, or `null` for worldwide queries (city + name only).
 */
export function buildNominatimQueryVariants(
  name: string,
  city: string,
  countryLabel: string | null
): string[] {
  const n = normalizeGeocodePhrase(name);
  const c = normalizeGeocodePhrase(city);
  const out: string[] = [];
  const push = (q: string) => {
    const t = q.trim();
    if (t && !out.includes(t)) out.push(t);
  };

  if (!n || !c) return out;

  const suffix = countryLabel ? `, ${countryLabel}` : "";

  push(`${n}, ${c}${suffix}`);

  const stripped = stripCommonVenueSuffixes(n);
  if (stripped && stripped.toLowerCase() !== n.toLowerCase()) {
    push(`${stripped}, ${c}${suffix}`);
  }

  const parts = stripped.split(/\s+/);
  if (parts.length >= 4) {
    push(`${parts.slice(0, -1).join(" ")}, ${c}${suffix}`);
  }

  return out;
}
