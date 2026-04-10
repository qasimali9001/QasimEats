/**
 * Best-effort official URLs keyed by exact restaurant name (Manchester list).
 * Empty string = known to have no dedicated site; omit key = unknown.
 */
export const MANCHESTER_SUGGESTED_WEBSITES: Record<string, string> = {
  Hawksmoor: "https://thehawksmoor.com/",
  Pieminister: "https://www.pieminister.co.uk/",
  Gerrys: "",
  "Bisous Bisous": "https://bisousbisous.co.uk/",
  Bunsik: "https://bunsik.co.uk/",
  "Street Guys (Street Star)": "https://street-guys.co.uk/",
  "Listo's": "https://www.listoburrito.com/",
  Panchos: "https://www.panchosburritos.co.uk/",
  Koreana: "https://koreana.co.uk/",
  "Wong Wong": "https://www.wongwongbakery.com/",
  "Ban Mi Co Ba": "",
  Zaap: "https://zaapthai.co.uk/",
  "Go Falafel": "https://gofalafel.co.uk/",
  "Greek Gyros & Bar": "https://www.greekgyrosandbar.com/",
  "Ram Yum": "https://www.ramyum.org.uk/",
  "Holy Grain Bakery": "https://thegreatnorthern.com/unit/holy-grain/",
  Shirleys: "",
  "Soup Co": "",
  Topkapi: "https://www.topkapipalace.co.uk/",
  Rolawala: "https://rolawala.com/manchester/",
  HOP: "https://www.hopvietnamese.com/",
  "This n That": "https://www.thisandthatcafe.co.uk/",
  "Lets Sushi": "https://www.letussushi.co.uk/",
  Katsouris: "https://katsourisdeli.com/",
  "Pizza Pilgrim": "https://www.pizzapilgrims.co.uk/pizzerias/manchester/",
  HoniPoke: "https://www.honipoke.com/",
  "Middle Point (?)": "",
  "Ohannes Burger": "https://www.ohannesburger.co.uk/",
};

/** Returns a usable URL, or null if none on file / explicitly none. */
export function getSuggestedWebsite(restaurantName: string): string | null {
  const key = restaurantName.trim();
  if (!key) return null;
  const url = MANCHESTER_SUGGESTED_WEBSITES[key];
  if (url === undefined) return null;
  const t = url.trim();
  return t ? t : null;
}

/** True when we have an explicit "no site" entry (shows a hint in admin). */
export function hasExplicitNoWebsite(restaurantName: string): boolean {
  const key = restaurantName.trim();
  if (!key) return false;
  if (!(key in MANCHESTER_SUGGESTED_WEBSITES)) return false;
  return MANCHESTER_SUGGESTED_WEBSITES[key].trim() === "";
}
