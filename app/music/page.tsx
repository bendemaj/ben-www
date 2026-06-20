import Image from "next/image";
import { getTopArtists, getTopTracks } from "@/lib/spotify";

export const revalidate = 3600; // top lists change slowly — hourly is plenty

export default async function MusicPage() {
  let artists: Awaited<ReturnType<typeof getTopArtists>> = [];
  let tracks: Awaited<ReturnType<typeof getTopTracks>> = [];
  try {
    [artists, tracks] = await Promise.all([
      getTopArtists(10),
      getTopTracks(10),
    ]);
  } catch {
    // Leave lists empty if Spotify isn't configured yet.
  }

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          Music
        </h1>
        <p className="text-[15px] text-muted dark:text-muted-dark">
          My top artists and tracks, straight from Spotify.
        </p>
      </header>

      {artists.length === 0 && tracks.length === 0 ? (
        <p className="text-[15px] text-faint dark:text-faint-dark">
          Connect Spotify to see this come alive — see the README for the
          one-time setup.
        </p>
      ) : (
        <>
          <Section title="Top Artists">
            {artists.map((a, i) => (
              <li key={a.url} className="flex items-center gap-4">
                <span className="w-5 text-right text-sm tabular-nums text-faint dark:text-faint-dark">
                  {i + 1}
                </span>
                <Thumb src={a.imageUrl} alt={a.name} rounded />
                <a
                  href={a.url}
                  className="text-[15px] text-ink hover:underline dark:text-ink-dark"
                >
                  {a.name}
                </a>
              </li>
            ))}
          </Section>

          <Section title="Top Tracks">
            {tracks.map((t, i) => (
              <li key={t.songUrl + i} className="flex items-center gap-4">
                <span className="w-5 text-right text-sm tabular-nums text-faint dark:text-faint-dark">
                  {i + 1}
                </span>
                <Thumb src={t.albumImageUrl} alt={t.album} />
                <div className="min-w-0">
                  <a
                    href={t.songUrl}
                    className="block truncate text-[15px] text-ink hover:underline dark:text-ink-dark"
                  >
                    {t.title}
                  </a>
                  <span className="block truncate text-sm text-muted dark:text-muted-dark">
                    {t.artist}
                  </span>
                </div>
              </li>
            ))}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-faint dark:text-faint-dark">
        {title}
      </h2>
      <ul className="space-y-3">{children}</ul>
    </section>
  );
}

function Thumb({
  src,
  alt,
  rounded = false,
}: {
  src: string | null;
  alt: string;
  rounded?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={`size-11 shrink-0 bg-line dark:bg-line-dark ${
          rounded ? "rounded-full" : "rounded"
        }`}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={44}
      height={44}
      className={`size-11 shrink-0 object-cover ${
        rounded ? "rounded-full" : "rounded"
      }`}
    />
  );
}
