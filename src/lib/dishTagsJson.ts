/** Stored in DB column `dish_tags` as JSON array string. */

export function parseDishTagsJson(raw: string | null | undefined): string[] {
  if (raw == null || raw === "") return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    const out = p
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);
    return [...new Set(out)].sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export function stringifyDishTags(tags: string[]): string {
  const unique = [
    ...new Set(tags.map((t) => t.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
  return JSON.stringify(unique);
}
