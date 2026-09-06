"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export function TickLogin() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/tick/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setMessage("Wrong password.");
        return;
      }

      window.location.reload();
    } catch {
      setMessage("Could not unlock tick.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-8 font-mono text-sm text-muted dark:text-muted-dark">
      <header className="space-y-3">
        <Link
          href="/apps"
          className="text-xs text-faint underline decoration-line underline-offset-4 hover:text-ink hover:decoration-current dark:text-faint-dark dark:decoration-line-dark dark:hover:text-ink-dark"
        >
          apps
        </Link>
        <div className="space-y-2">
          <h1 className="text-base font-medium text-ink dark:text-ink-dark">tick</h1>
          <p>enter the apps password.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 border border-line p-4 dark:border-line-dark">
        <label className="block space-y-1.5">
          <span className="block text-[0.7rem] uppercase text-faint dark:text-faint-dark">
            password
          </span>
          <input
            autoFocus
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-9 w-full rounded border border-line bg-paper px-2.5 text-ink outline-none focus:border-ink dark:border-line-dark dark:bg-paper-dark dark:text-ink-dark dark:focus:border-ink-dark"
          />
        </label>

        {message ? <p className="text-xs text-faint dark:text-faint-dark">{message}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="font-mono text-xs uppercase text-ink underline decoration-line underline-offset-4 disabled:text-faint dark:text-ink-dark dark:decoration-line-dark dark:disabled:text-faint-dark"
        >
          {isSubmitting ? "unlocking" : "unlock"}
        </button>
      </form>
    </div>
  );
}
