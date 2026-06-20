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

## Notes

- Pages use Incremental Static Regeneration (`revalidate`) so Spotify data stays
  fresh without re-fetching on every visit (60s on the homepage, 1h on /music).
- `next.config.ts` allow-lists `i.scdn.co` so `next/image` can optimise Spotify
  artwork.
