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

Generate a **bcrypt hash** for your superuser password (the plaintext password is never stored in the repo):

```bash
npm run hash-password -- "YourPasswordHere"
```

Copy the **`SUPERUSER_PASSWORD_HASH_B64=...`** line into `.env.local` (not the raw bcrypt line — Next.js treats `$` in `.env` as variable expansion and breaks the hash). Set `SUPERUSER_USERNAME` and a long random `SESSION_SECRET` (32+ characters).

Create the SQLite database and tables, then import the bundled CSV into the database:

```bash
npm run db:push
npm run db:seed
```

Start the app:

```bash
npm run dev
```

Open the public map at `/` and the **admin** UI at `/admin` (sign in with your superuser credentials).

## Data source

Optional **CSV columns** (imported on seed / parsed when using CSV fallback): `Website`, `Menu` or `Menu URL`, and `Google Maps` / `Google Maps URL`. The public sidebar always offers a **Google Maps** link (stored URL, or a search from the pin coordinates, or a name search). Website and menu only appear when set in the DB or CSV.

The public map prefers **SQLite** (`data/qasimeats.db`, gitignored) when it contains at least one restaurant row. Otherwise it falls back to CSV in this order:

1. `data/Manchester Food Ratings.csv`
2. `Manchester Food Ratings.csv` in the project root
3. `data/sample-reviews.csv`

After you run `db:seed`, edits in `/admin` are persisted in SQLite and are what visitors see.

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
- `npm run db:push` — apply Drizzle schema to `data/qasimeats.db`
- `npm run db:seed` — upsert rows from the CSV into SQLite
- `npm run hash-password -- "password"` — print `SUPERUSER_PASSWORD_HASH_B64` for `.env.local`
