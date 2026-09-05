"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export function UniLogin() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/uni/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setMessage("Wrong password");
        return;
      }

      window.location.reload();
    } catch {
      setMessage("Could not unlock the dashboard");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-8 text-[15px] text-muted dark:text-muted-dark">
      <header className="space-y-3">
        <Link
          href="/apps"
          className="text-sm text-faint underline decoration-line underline-offset-4 hover:text-ink hover:decoration-current dark:text-faint-dark dark:decoration-line-dark dark:hover:text-ink-dark"
        >
          Apps
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-ink-dark">
            Uni Dashboard
          </h1>
          <p>Enter the dashboard password.</p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 border border-line p-4 dark:border-line-dark"
      >
        <label className="block space-y-1">
          <span className="block text-sm text-faint dark:text-faint-dark">
            Password
          </span>
          <input
            autoFocus
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10 w-full rounded border border-line bg-paper px-3 text-ink outline-none transition-colors focus:border-ink dark:border-line-dark dark:bg-paper-dark dark:text-ink-dark dark:focus:border-ink-dark"
          />
        </label>

        {message ? (
          <p className="text-sm text-faint dark:text-faint-dark">{message}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 w-full rounded bg-ink px-3 text-sm font-medium text-paper transition-opacity disabled:opacity-50 dark:bg-ink-dark dark:text-paper-dark"
        >
          {isSubmitting ? "Unlocking" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
