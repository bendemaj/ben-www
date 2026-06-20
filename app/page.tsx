import Link from "next/link";
import { getNowPlaying } from "@/lib/spotify";
import { getAllPosts } from "@/lib/posts";

// Re-render the page server-side at most once a minute so the listening
// status stays reasonably fresh without hammering Spotify.
export const revalidate = 60;

export default async function Home() {
  let listening: Awaited<ReturnType<typeof getNowPlaying>> | null = null;
  try {
    listening = await getNowPlaying();
  } catch {
    listening = null; // Spotify not configured yet — page still renders.
  }

  const recentPosts = getAllPosts().slice(0, 3);

  return (
    <div className="prose space-y-6 text-[15px] leading-7 text-muted text-justify dark:text-muted-dark">
      <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-ink-dark">
        Arben Demaj
      </h1>

      <p>
        I&rsquo;m a developer and student based in Vienna, interested in building thoughtful, useful tech across
        software and hardware.
        Currently, studying <Link href="https://www.tuwien.ac.at">@tuwien</Link>, exploring new ideas and working on
        projects that help me learn, create and solve real-world problems.
      </p>

      <p>
        {" "}
        <ListeningLine listening={listening} />
      </p>

      <div>
        <p className="mb-2 text-ink dark:text-ink-dark">
          Some Posts you should check out:
        </p>
        <ul className="space-y-1">
          {recentPosts.map((p) => (
            <li key={p.slug}>
              <Link href={`/posts/${p.slug}`}>{p.title}</Link>
            </li>
          ))}
        </ul>
      </div>

      <p>
        You can read my <Link href="/posts">writing</Link>, see my{" "}
        <a href="https://github.com/bendemaj">code</a>, or look at what I&rsquo;m{" "}
        <Link href="/music">listening to</Link>.{" "}
        <a href="mailto:bendemaj.ad@gmail.com">Reach out</a>{" "}if you&rsquo;d like to
        talk.
      </p>
    </div>
  );
}

function ListeningLine({
  listening,
}: {
  listening: Awaited<ReturnType<typeof getNowPlaying>> | null;
}) {
  if (!listening) return null;

  if (listening.isPlaying) {
    const { track } = listening;
    return (
      <>
        Right now I&rsquo;m listening to{" "}
        <a href={track.songUrl}>{track.title}</a> by {track.artist}.
      </>
    );
  }

  if (listening.lastPlayed) {
    const t = listening.lastPlayed;
    return (
      <>
        I last listened to <a href={t.songUrl}>{t.title}</a> by {t.artist}.
      </>
    );
  }
  return null;
}
