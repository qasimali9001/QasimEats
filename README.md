# QasimEats

Manchester food reviews on a MapLibre map (OpenFreeMap / OpenMapTiles). Built with Next.js.

**Repository:** [github.com/qasimali9001/QasimEats](https://github.com/qasimali9001/QasimEats)

## Setup

```bash
npm install
```

Create a local env file from the example (this file is gitignored):

```bash
copy .env.example .env.local
```

### Database (Neon Postgres)

The app uses **Postgres** over **Neon’s serverless driver** (works on Vercel; no SQLite file).

1. Create a free project at [neon.tech](https://neon.tech) and copy the **connection string** (include `sslmode=require`).
2. Put it in `.env.local` as **`DATABASE_URL`** (see `.env.example`).

Generate a **bcrypt hash** for your superuser password (the plaintext password is never stored in the repo):

```bash
npm run hash-password -- "YourPasswordHere"
```

Copy the **`SUPERUSER_PASSWORD_HASH_B64=...`** line into `.env.local` (not the raw bcrypt line — Next.js treats `$` in `.env` as variable expansion and breaks the hash). Set `SUPERUSER_USERNAME` and a long random `SESSION_SECRET` (32+ characters).

Apply the Drizzle schema to your Neon database, then import the bundled CSV:

```bash
npm run db:push
npm run db:seed
```

Start the app:

```bash
npm run dev
```

Open the public map at `/` and the **admin** UI at `/admin` (sign in with your superuser credentials).

## Deploying (Vercel)

1. Connect the GitHub repo in Vercel.
2. Add the same env vars as in `.env.local`: **`DATABASE_URL`** (Neon), **`SESSION_SECRET`**, **`SUPERUSER_USERNAME`**, **`SUPERUSER_PASSWORD_HASH_B64`**.
3. In Neon, allow connections from Vercel (Neon dashboard → project → **Vercel** integration is recommended).
4. No file-based DB — `npm run db:push` and `npm run db:seed` are run **locally** against your Neon DB (or in CI) so production has data.

## Data source

Optional **CSV columns** (imported on seed / parsed when using CSV fallback): `Website`, `Menu` or `Menu URL`, and `Google Maps` / `Google Maps URL`. The public sidebar always offers a **Google Maps** link (stored URL, or a search from the pin coordinates, or a name search). Website and menu only appear when set in the DB or CSV.

The public map prefers **Postgres** when `DATABASE_URL` is set and the database has at least one restaurant row. Otherwise it falls back to CSV in this order:

1. `data/Manchester Food Ratings.csv`
2. `Manchester Food Ratings.csv` in the project root
3. `data/sample-reviews.csv`

After you run `db:seed`, edits in `/admin` are persisted in Postgres and are what visitors see.

## Admin

- **URL:** `/admin` (login at `/admin/login`).
- Credentials come only from `.env.local` (`SESSION_SECRET`, `SUPERUSER_USERNAME`, `SUPERUSER_PASSWORD_HASH_B64`). Rate limiting applies to failed logins.
- **Audit log** on the admin page records logins, logouts, and create/update/delete of pins.
- **Community score submissions** are stubbed in the database schema for a future approval workflow (not wired in the UI yet).

## Environment

See `.env.example`. Never commit `.env.local`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run db:push` — apply Drizzle schema to your Neon Postgres database (reads `DATABASE_URL` from `.env.local` via `drizzle.config.ts`)
- `npm run db:seed` — upsert rows from the CSV into Postgres
- `npm run csv:add-websites` — fill `Website` in the Manchester CSV from `src/lib/suggestedWebsites.ts`
- `npm run hash-password -- "password"` — print `SUPERUSER_PASSWORD_HASH_B64` for `.env.local`
