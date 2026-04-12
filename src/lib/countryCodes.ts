/**
 * ISO 3166-1 alpha-2 for geocoding / Places region bias.
 * "world" = no country filter (Nominatim worldwide; Places without region bias).
 */

export const DEFAULT_COUNTRY_CODE = "gb" as const;

/** UI: value → label. Value `world` = search globally. */
export const COUNTRY_SELECT_OPTIONS: { value: string; label: string }[] = [
  { value: "gb", label: "United Kingdom" },
  { value: "world", label: "Worldwide (no country filter)" },
  { value: "us", label: "United States" },
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "it", label: "Italy" },
  { value: "es", label: "Spain" },
  { value: "ie", label: "Ireland" },
  { value: "nl", label: "Netherlands" },
  { value: "be", label: "Belgium" },
  { value: "pt", label: "Portugal" },
  { value: "gr", label: "Greece" },
  { value: "tr", label: "Türkiye" },
  { value: "in", label: "India" },
  { value: "jp", label: "Japan" },
  { value: "au", label: "Australia" },
  { value: "ca", label: "Canada" },
  { value: "mx", label: "Mexico" },
  { value: "br", label: "Brazil" },
  { value: "ae", label: "United Arab Emirates" },
];

const ISO2_TO_LABEL: Record<string, string> = Object.fromEntries(
  COUNTRY_SELECT_OPTIONS.filter((o) => o.value !== "world").map((o) => [o.value, o.label])
);

/** Suffix for Nominatim free-text queries (English name). */
export function countryLabelForNominatim(iso2: string): string {
  return ISO2_TO_LABEL[iso2] ?? iso2.toUpperCase();
}

/**
 * API query param: ISO2, `uk`→`gb`, or `world`/empty → null (worldwide).
 * Invalid → default GB.
 */
export function parseCountryCodeParam(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s || s === "world" || s === "worldwide" || s === "any") return null;
  if (s === "uk") return "gb";
  if (/^[a-z]{2}$/.test(s)) return s;
  return DEFAULT_COUNTRY_CODE;
}

/** Google Places `region` / ccTLD bias — omit when null (worldwide). */
export function regionForGooglePlaces(iso2: string | null): string | undefined {
  if (!iso2) return undefined;
  return iso2 === "gb" ? "uk" : iso2;
}

/** UK / unset — no "(Country)" suffix in search. */
export function isUkCountryIso2(iso: string | null | undefined): boolean {
  const s = (iso ?? "").trim().toLowerCase();
  return !s || s === "gb" || s === "uk";
}

function countryLabelForSearchSuffix(iso2: string): string {
  const s = iso2.trim().toLowerCase();
  if (s === "world") return "Worldwide";
  const opt = COUNTRY_SELECT_OPTIONS.find((o) => o.value === s);
  if (opt) return opt.label;
  return countryLabelForNominatim(s);
}

/**
 * Map search dropdown: plain name in the UK; abroad, `Name (France)` etc.
 */
export function reviewSearchMenuLabel(
  name: string,
  countryIso2: string | null | undefined
): string {
  if (isUkCountryIso2(countryIso2)) return name;
  const raw = (countryIso2 ?? "").trim().toLowerCase();
  return `${name} (${countryLabelForSearchSuffix(raw)})`;
}

/** Admin / API: normalize `gb` → stored as UK (empty string). */
export function countryIso2ToStorage(code: string | null | undefined): string {
  const s = (code ?? "").trim().toLowerCase();
  if (!s || s === "gb" || s === "uk") return "";
  if (s === "world" || s === "worldwide") return "world";
  if (/^[a-z]{2}$/.test(s)) return s;
  return "";
}

/** Load row into country `<select>`: empty/gb → `gb`. */
export function countryIso2ToFormValue(iso: string | null | undefined): string {
  const stored = (iso ?? "").trim().toLowerCase();
  if (!stored || stored === "gb" || stored === "uk") return "gb";
  if (COUNTRY_SELECT_OPTIONS.some((o) => o.value === stored)) return stored;
  return "gb";
}
