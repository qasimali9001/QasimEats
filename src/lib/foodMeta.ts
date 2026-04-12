import type { PriceRangeId } from "./types";

/** First £ amount in the string, or 0 for free meals; null if not parseable. */
export function parsePriceToPounds(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;

  const lower = s.toLowerCase();
  if (
    /\bfree\b/.test(lower) &&
    !/£\s*[\d.]/.test(s)
  ) {
    return 0;
  }

  const poundMatch = s.match(/£\s*~?\s*([\d]+(?:\.[\d]+)?)/);
  if (poundMatch) return parseFloat(poundMatch[1]);

  return null;
}

/** Sidebar / list: compact £ label, numbers only (with £). */
export function formatPricePounds(pounds: number | null): string {
  if (pounds == null) return "—";
  if (pounds === 0) return "£0";
  const rounded = Math.round(pounds * 100) / 100;
  if (Number.isInteger(rounded)) return `£${rounded}`;
  return `£${rounded.toFixed(2).replace(/\.?0+$/, "")}`;
}

export function priceRangeForPounds(
  pounds: number | null
): PriceRangeId | null {
  if (pounds == null) return null;
  if (pounds < 5) return "lt5";
  if (pounds < 10) return "5-10";
  if (pounds < 15) return "10-15";
  return "15plus";
}

export const PRICE_RANGE_ORDER: PriceRangeId[] = [
  "lt5",
  "5-10",
  "10-15",
  "15plus",
];

export const PRICE_RANGE_LABEL: Record<PriceRangeId, string> = {
  lt5: "Under £5",
  "5-10": "£5–£10",
  "10-15": "£10–£15",
  "15plus": "£15+",
};

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/\?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Broad cuisine group for filters (one label per review). */
export function cuisineToGroup(raw: string): string {
  const s = norm(raw);
  if (!s) return "Other";

  const first = s.split("/")[0].split("&")[0].trim();

  const rules: Array<{ re: RegExp; group: string }> = [
    { re: /fusion|indian fusion|asian fusion/, group: "Fusion" },
    { re: /korean/, group: "Korean" },
    { re: /japanese|ramen|sushi/, group: "Japanese" },
    { re: /chinese|jianbing|dim sum|dimsum/, group: "Chinese" },
    { re: /thai/, group: "Thai" },
    { re: /vietnamese|banh|pho|^viet /, group: "Vietnamese" },
    { re: /indian|curry house|karahi|tikka|daal|dal|naan roll/, group: "Indian & South Asian" },
    { re: /mexican|burrito|taco|enchilada/, group: "Mexican" },
    { re: /turkish|kebab|kof?te|shwarma|shawarma/, group: "Turkish & Levantine" },
    { re: /greek|gyros|souvlaki/, group: "Greek" },
    { re: /middle eastern|falafel|lebanese|israeli/, group: "Middle Eastern" },
    { re: /italian|pizza|pasta|focaccia|foccaia/, group: "Italian" },
    { re: /french|spanish|portuguese|german/, group: "European" },
    { re: /hotpot|noodle soup|laksa/, group: "Asian soups & noodles" },
    { re: /poke|hawaiian|poke bowl/, group: "Poke & bowls" },
    { re: /steak|british|fish and chips|full english|roast dinner/, group: "British & Irish" },
    { re: /\bpie\b/, group: "British & Irish" },
    { re: /burger|american|bbq|smash|diner/, group: "American & burgers" },
    { re: /bakery|sandwich|cafe|café|deli/, group: "Bakery & sandwiches" },
  ];

  for (const { re, group } of rules) {
    if (re.test(first) || re.test(s)) return group;
  }

  return "Other";
}

const DISH_KEYWORDS: Array<{ re: RegExp; label: string }> = [
  { re: /\bburrito\b/i, label: "Burrito" },
  { re: /\bburger\b|\bburgers\b/i, label: "Burger" },
  { re: /\bramen\b/i, label: "Ramen" },
  { re: /\bpie\b(?!min)/i, label: "Pie" },
  { re: /\bsandwich\b/i, label: "Sandwich" },
  { re: /\bpizza\b/i, label: "Pizza" },
  { re: /\bsushi\b|\bmaki\b|\bsashimi\b/i, label: "Sushi" },
  { re: /\bpoke\b/i, label: "Poke bowl" },
  { re: /\bgyros\b/i, label: "Gyros" },
  { re: /\bkebab\b|\bkobeda\b|\bkofte\b/i, label: "Kebab" },
  { re: /\bfalafel\b/i, label: "Falafel" },
  { re: /\bwrap\b/i, label: "Wrap" },
  { re: /\bsteak\b/i, label: "Steak" },
  { re: /\bhotpot\b|\bhot pot\b/i, label: "Hotpot" },
  { re: /\bnoodle\b/i, label: "Noodles" },
  { re: /\bcurry\b|\bkarahi\b|\btikka\b/i, label: "Curry" },
  { re: /\bpho\b/i, label: "Pho" },
  { re: /\bbanh mi\b|banhmi/i, label: "Banh mi" },
  { re: /\bjianbing\b/i, label: "Jianbing" },
  { re: /\bfocaccia\b|\bfoccaia\b/i, label: "Focaccia" },
  { re: /\bbibimbap\b|\bbimimbap\b/i, label: "Bibimbap" },
  { re: /\bdumpling\b/i, label: "Dumplings" },
  { re: /\bsouvlaki\b/i, label: "Souvlaki" },
  { re: /\bshawarma\b|\bshwarma\b/i, label: "Shawarma" },
  { re: /\bnaan\b/i, label: "Naan" },
  { re: /\btaco\b/i, label: "Taco" },
  { re: /\bgyro\b/i, label: "Gyro" },
];

/** Labels from keyword rules — useful for admin dish-type suggestions. */
export const KNOWN_DISH_TYPE_LABELS: string[] = [
  ...new Set(DISH_KEYWORDS.map((k) => k.label)),
].sort((a, b) => a.localeCompare(b));

/** Dish / format tags (e.g. Burrito, Ramen) from cuisine + order text. */
export function extractDishTypes(cuisine: string, whatIOrdered: string): string[] {
  const hay = `${cuisine}\n${whatIOrdered}`;
  const found = new Set<string>();
  for (const { re, label } of DISH_KEYWORDS) {
    if (re.test(hay)) found.add(label);
  }
  return Array.from(found).sort((a, b) => a.localeCompare(b));
}
