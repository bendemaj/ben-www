import { NextResponse } from "next/server";
import { getNowPlaying } from "@/lib/spotify";

// Optional endpoint: GET /api/spotify/now-playing
// Returns JSON so you can build a live client-side widget that polls this,
// instead of (or alongside) the server-rendered line on the homepage.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getNowPlaying();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { isPlaying: false, lastPlayed: null },
      { status: 200 }
    );
  }
}
