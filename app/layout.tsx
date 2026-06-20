import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export const metadata: Metadata = {
  metadataBase: new URL("https://your-domain.com"),
  title: "Ben — Developer",
  description: "Developer, builder, embedded systems & FPGA.",
  openGraph: {
    title: "Ben — Developer",
    description: "Developer, builder, embedded systems & FPGA.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-serif antialiased">
        <ThemeProvider>
          <div className="mx-auto flex min-h-dvh max-w-[600px] flex-col px-6 py-12 sm:py-16">
            <header className="mb-12 flex items-center justify-between text-sm">
              <nav className="flex gap-5 text-muted dark:text-muted-dark">
                <Link href="/" className="hover:text-ink dark:hover:text-ink-dark">
                  Home
                </Link>
                <Link
                  href="/posts"
                  className="hover:text-ink dark:hover:text-ink-dark"
                >
                  Posts
                </Link>
              </nav>
              <ThemeToggle />
            </header>
            <main className="flex-1">{children}</main>
            <footer className="mt-16 text-sm text-faint flex dark:text-faint-dark">
              made in Vienna, AT - {new Date().getFullYear()}
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
