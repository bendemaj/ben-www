import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Spotify CDN serves all artist/album artwork from i.scdn.co
      { protocol: "https", hostname: "i.scdn.co" },
    ],
  },
};

export default nextConfig;
