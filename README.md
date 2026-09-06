# Portfolio

A minimal, typography-first portfolio in the spirit of leerob.com — a single
narrow reading column, light/dark mode, and a live Spotify integration that
shows what you're listening to and your top artists/tracks.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS v4 · next-themes**.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

The site renders fine with no Spotify keys — the listening line and music page
just stay empty until you connect Spotify.

The uni dashboard also renders without Neon. Until `DATABASE_URL` is configured,
changes are stored locally in the browser. Set `UNI_DASHBOARD_PASSWORD` to put
the dashboard and its course API behind a simple password gate.

## Connecting Spotify (one-time)

The integration uses the OAuth **refresh-token** flow: you authorise once, store
a long-lived refresh token, and the server swaps it for a short-lived access
token on each request. Your secret never touches the browser.

1. Create an app at https://developer.spotify.com/dashboard
2. In the app's settings, add this Redirect URI:
   `http://127.0.0.1:8888/callback`
3. Copy the **Client ID** and **Client Secret** into `.env.local`.
4. Run the helper and follow the printed URL:

   ```bash
   npm run spotify-token
   ```

5. Paste the printed `SPOTIFY_REFRESH_TOKEN` into `.env.local`.
6. Restart `npm run dev`. The homepage line and `/music` will populate.

Scopes requested: `user-read-currently-playing`, `user-read-recently-played`,
`user-top-read`.

## Where things live

| Path | What it does |
| --- | --- |
| `app/page.tsx` | Homepage — intro prose + favorite writing + live "last listened to" line |
| `app/music/page.tsx` | Top Artists + Top Tracks, numbered with artwork |
| `app/apps/tick/page.tsx` | Monospace time tracker for focused work sessions |
| `app/api/tick/time-entries/*` | Server-side tick API backed by Neon Postgres |
| `app/apps/uni-dashboard/page.tsx` | Uni course tracker with ECTS, grade, semester, and exam views |
| `app/api/uni/courses/*` | Server-side course API backed by Neon Postgres |
| `lib/uni/*` | Uni course types, seed data, stats, and Neon data access |
| `db/uni-dashboard.sql` | Optional SQL schema if you want to create the table manually in Neon |
| `app/api/spotify/now-playing/route.ts` | Optional JSON endpoint for a client-side live widget |
| `lib/spotify.ts` | All Spotify calls (token refresh, now-playing, recent, top tracks/artists) |
| `components/theme-*.tsx` | Dark/light mode (next-themes) |
| `app/globals.css` | Design tokens + the whole visual system |
| `scripts/get-refresh-token.mjs` | One-time OAuth helper (no dependencies) |

## Making it yours

- Replace the copy and the `writing` array in `app/page.tsx`.
- Swap the GitHub/email links in `app/page.tsx` and the name in `app/layout.tsx`.
- The entire palette lives in the `@theme` block of `app/globals.css` — change
  a handful of hex values to re-skin the site.
- `getTopTracks`/`getTopArtists` accept a time range: `short_term` (~4 weeks,
  the default), `medium_term` (~6 months), or `long_term` (years).

## Deploy

Push to GitHub and import into Vercel. Add the three `SPOTIFY_*` variables in
the Vercel project settings (Settings → Environment Variables). That's it — the
same refresh token works in production.

For the uni dashboard, create a Neon database and add its pooled connection
string as `DATABASE_URL` in Vercel. The app creates `uni_courses` automatically
on first load and seeds it with the existing course list when the table is empty.
If you prefer to run SQL yourself, use `db/uni-dashboard.sql`.

Also add `UNI_DASHBOARD_PASSWORD` in Vercel for Production and any Preview
environment you want protected. The app stores a 30-day HttpOnly session cookie
after a successful unlock.

Tick is available at `/apps/tick` and uses the same `DATABASE_URL`, creating a
separate `tick_time_entries` table on first use. The running timer itself stays
in browser storage so a refresh does not lose an active session. For protection,
set `TICK_PASSWORD` or a shared `APPS_PASSWORD`; if neither is set, tick falls
back to `UNI_DASHBOARD_PASSWORD`.

The dashboard route is `/apps/uni-dashboard`. `vercel.json` also rewrites
`apps.bendemaj.com/uni-dashboard` and `apps.bendemaj.com/tick` to their app
routes when the `apps.bendemaj.com` domain is attached to the same Vercel
project.

## Notes

- Pages use Incremental Static Regeneration (`revalidate`) so Spotify data stays
  fresh without re-fetching on every visit (60s on the homepage, 1h on /music).
- `next.config.ts` allow-lists `i.scdn.co` so `next/image` can optimise Spotify
  artwork.
- The uni dashboard uses a single password instead of user accounts. If
  `UNI_DASHBOARD_PASSWORD` is not set, the dashboard and API are open.
- Tick uses a single password too. If `TICK_PASSWORD`, `APPS_PASSWORD`, and
  `UNI_DASHBOARD_PASSWORD` are all unset, tick and its API are open.
