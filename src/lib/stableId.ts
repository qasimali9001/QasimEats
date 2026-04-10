function djb2(str: string) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function stableReviewId(fields: {
  name: string;
  cuisine: string;
  whatIOrdered: string;
}) {
  const base = `${fields.name}||${fields.cuisine}||${fields.whatIOrdered}`.trim();
  const h = djb2(base).toString(16).padStart(8, "0");
  return `${slugify(fields.name).slice(0, 40) || "review"}-${h}`;
}

