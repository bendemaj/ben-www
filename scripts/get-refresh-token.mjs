// One-time helper to obtain a Spotify REFRESH token.
//
// Usage:
//   1. Create an app at https://developer.spotify.com/dashboard
//   2. Add  http://127.0.0.1:8888/callback  as a Redirect URI in the app settings
//   3. Put SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local
//   4. Run:  npm run spotify-token
//   5. Open the printed URL, approve, and copy the REFRESH token it prints
//      into .env.local as SPOTIFY_REFRESH_TOKEN
//
// Uses only Node built-ins — no dependencies.

import http from "node:http";
import { readFileSync } from "node:fs";
import { URL } from "node:url";

// Minimal .env.local loader (so you don't need dotenv just for this script).
function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local — rely on real env vars */
  }
}
loadEnv();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const PORT = 8888;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\nMissing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET.\n" +
      "Add them to .env.local first.\n"
  );
  process.exit(1);
}

// Scopes needed for the homepage line + the music page.
const SCOPES = [
  "user-read-currently-playing",
  "user-read-recently-played",
  "user-top-read",
].join(" ");

const authorizeUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
  }).toString();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("No code returned.");
    return;
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const data = await tokenRes.json();
  if (!data.refresh_token) {
    res.writeHead(500).end("Token exchange failed: " + JSON.stringify(data));
    console.error("\nToken exchange failed:", data, "\n");
    server.close();
    return;
  }

  res
    .writeHead(200, { "Content-Type": "text/html" })
    .end(
      "<h2>Success.</h2><p>Copy the refresh token from your terminal into .env.local, then close this tab.</p>"
    );

  console.log("\n  Refresh token (add to .env.local):\n");
  console.log("  SPOTIFY_REFRESH_TOKEN=" + data.refresh_token + "\n");
  server.close();
});

server.listen(PORT, () => {
  console.log("\n  Open this URL in your browser to authorise:\n");
  console.log("  " + authorizeUrl + "\n");
});
