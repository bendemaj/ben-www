import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import { getPost, getAllPosts, formatDate } from "@/lib/posts";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return { title: `${post.title} — Ben`, description: post.excerpt };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const html = marked(post.content) as string;

  return (
    <article>
      <header className="mb-10 space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          {post.title}
        </h1>
        <p className="text-sm text-faint dark:text-faint-dark">
          {formatDate(post.date)}
        </p>
      </header>

      <div
        className="post-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
