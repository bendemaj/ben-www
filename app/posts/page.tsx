import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";

export const metadata = {
  title: "Writing — Ben",
  description: "Posts on embedded systems, FPGA design, and software.",
};

export default function PostsPage() {
  const sorted = getAllPosts();

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          Writing
        </h1>
        <p className="text-[15px] text-muted dark:text-muted-dark">
          A curated collection of my thoughts.
        </p>
      </header>

      <ul className="space-y-8">
        {sorted.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/posts/${post.slug}`}
              className="group block space-y-1"
            >
              <div className="flex items-baseline gap-4">
                <span className="text-[15px] font-medium text-ink group-hover:underline dark:text-ink-dark">
                  {post.title}
                </span>
                <span className="shrink-0 text-sm text-faint dark:text-faint-dark">
                  {formatDate(post.date)}
                </span>
              </div>
              <p className="text-[15px] leading-6 text-muted dark:text-muted-dark">
                {post.excerpt}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
