// Server-only Spotify client using the OAuth refresh-token flow.
//
// How it works: you authorise once (run `npm run spotify-token`) and store a
// long-lived REFRESH token in env. On each request the server exchanges that
// refresh token for a short-lived ACCESS token, then calls the Web API. The
// client secret never reaches the browser — every function here runs on the
// server only.

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN!;

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

async function getAccessToken(): Promise<string> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Spotify token request failed: ${res.status}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function spotifyFetch(path: string) {
  const token = await getAccessToken();
  return fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    // Re-fetch at most once per minute. Tune to taste.
    next: { revalidate: 60 },
  });
}

// ---- Shaped return types ---------------------------------------------------

export type Track = {
  title: string;
  artist: string;
  album: string;
  albumImageUrl: string | null;
  songUrl: string;
};

export type Artist = {
  name: string;
  url: string;
  imageUrl: string | null;
};

export type NowPlaying =
  | { isPlaying: false; lastPlayed: Track | null }
  | { isPlaying: true; track: Track };

// ---- Public API ------------------------------------------------------------

/** What's playing right now, or the most recently played track as fallback. */
export async function getNowPlaying(): Promise<NowPlaying> {
  const res = await spotifyFetch("/me/player/currently-playing");

  // 204 = nothing currently playing → fall back to recently played.
  if (res.status === 204 || res.status > 400) {
    const recent = await getRecentlyPlayed(1);
    return { isPlaying: false, lastPlayed: recent[0] ?? null };
  }

  const data = await res.json();
  if (!data?.item) {
    const recent = await getRecentlyPlayed(1);
    return { isPlaying: false, lastPlayed: recent[0] ?? null };
  }

  return { isPlaying: true, track: mapTrack(data.item) };
}

export async function getRecentlyPlayed(limit = 10): Promise<Track[]> {
  const res = await spotifyFetch(`/me/player/recently-played?limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map((i: any) => mapTrack(i.track));
}

/** time_range: short_term (~4wk) | medium_term (~6mo) | long_term (years) */
export async function getTopTracks(
  limit = 10,
  range: "short_term" | "medium_term" | "long_term" = "medium_term"
): Promise<Track[]> {
  const res = await spotifyFetch(
    `/me/top/tracks?time_range=${range}&limit=${limit}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map(mapTrack);
}

export async function getTopArtists(
  limit = 10,
  range: "short_term" | "medium_term" | "long_term" = "long_term"
): Promise<Artist[]> {
  const res = await spotifyFetch(
    `/me/top/artists?time_range=${range}&limit=${limit}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map((a: any) => ({
    name: a.name,
    url: a.external_urls?.spotify ?? "#",
    imageUrl: a.images?.[a.images.length - 1]?.url ?? a.images?.[0]?.url ?? null,
  }));
}

// ---- Helpers ---------------------------------------------------------------

function mapTrack(item: any): Track {
  return {
    title: item.name,
    artist: (item.artists ?? []).map((a: any) => a.name).join(", "),
    album: item.album?.name ?? "",
    albumImageUrl: item.album?.images?.[item.album.images.length - 1]?.url ?? null,
    songUrl: item.external_urls?.spotify ?? "#",
  };
}
