# QasimEats

Manchester food reviews on a MapLibre map (OpenFreeMap / OpenMapTiles). Built with Next.js.

**Repository:** [github.com/qasimali9001/QasimEats](https://github.com/qasimali9001/QasimEats)

## Setup

```bash
npm install
npm run dev
```

## Data

Reviews load from CSV. Resolution order:

1. `data/Manchester Food Ratings.csv` (bundled in this repo)
2. `Manchester Food Ratings.csv` in the project root (optional override)
3. `data/sample-reviews.csv` (fallback placeholder)

## Environment

See `.env.example`. Copy to `.env.local` if you need overrides (e.g. `NEXT_PUBLIC_MAP_STYLE_URL`).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
