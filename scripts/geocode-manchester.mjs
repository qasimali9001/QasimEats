/**
 * One-off: geocode restaurant names for Manchester CSV (Nominatim).
 * Run: node scripts/geocode-manchester.mjs
 * Respect 1 req/s — takes ~30s for ~28 rows.
 */
import https from "https";

const QUERY_SUFFIX = ", Manchester, UK";

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "QasimEats/1.0 (coordinate fill; contact: local)",
            Accept: "application/json",
          },
        },
        (res) => {
          let d = "";
          res.on("data", (c) => (d += c));
          res.on("end", () => {
            try {
              resolve(JSON.parse(d));
            } catch (e) {
              reject(e);
            }
          });
        }
      )
      .on("error", reject);
  });
}

async function nominatim(q) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", q);
  url.searchParams.set("countrycodes", "gb");
  url.searchParams.set("viewbox", "-2.60,53.60,-2.05,53.35");
  url.searchParams.set("bounded", "1");
  url.searchParams.set("addressdetails", "0");
  const data = await get(url.toString());
  const top = Array.isArray(data) ? data[0] : null;
  if (!top) return null;
  return { lat: Number(top.lat), lon: Number(top.lon), label: top.display_name };
}

const rows = [
  "Hawksmoor",
  "Pieminister",
  "Gerrys Piccadilly Gardens",
  "Bisous Bisous",
  "Bunsik",
  "Street Star Manchester",
  "Listo's Oxford Road Manchester",
  "Panchos Arndale Manchester",
  "Koreana",
  "Wong Wong Manchester",
  "Ban Mi Co Ba",
  "Zaap Thai Manchester",
  "Go Falafel Manchester",
  "Greek Gyros Bar Manchester",
  "Ram Yum Manchester",
  "Holy Grain Bakery Manchester",
  "Shirleys Manchester sandwich",
  "Soup Co Manchester",
  "Topkapi Manchester",
  "Rolawala Manchester",
  "HOP Vietnamese Manchester",
  "This n That Manchester",
  "Lets Sushi Manchester",
  "Katsouris Manchester",
  "Pizza Pilgrim Manchester",
  "Honi Poke Manchester",
  "Middle Point Arndale Manchester",
  "Ohannes Burger Salford",
];

(async () => {
  for (const name of rows) {
    const q = `${name}${QUERY_SUFFIX}`;
    await new Promise((r) => setTimeout(r, 1100));
    try {
      const r = await nominatim(q);
      if (r) {
        console.log(`${name}\t${r.lat}\t${r.lon}\t${r.label}`);
      } else {
        console.log(`${name}\tNONE`);
      }
    } catch (e) {
      console.log(`${name}\tERROR\t${e.message}`);
    }
  }
})();
