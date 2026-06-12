"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LoginForm({
  callbackUrl,
  googleEnabled = false,
}: {
  callbackUrl?: string;
  googleEnabled?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password.");
        return;
      }
      // /me is a server route that 307s to the right dashboard for the
      // session's role. We don't know the role on the client at this point
      // (signIn returns just a status), so let the server route it.
      router.push(callbackUrl ?? "/me");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="ne-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="ne-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label className="ne-label" htmlFor="password">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="mb-1.5 text-xs font-medium text-rust hover:text-rust-2"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="ne-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <button type="submit" className="ne-btn w-full" disabled={pending}>
        {pending ? "Signing in…" : "Log in"}
      </button>

      {googleEnabled ? (
        <>
          <div className="my-2 text-center text-xs uppercase tracking-wide text-ink-2">
            or
          </div>
          <button
            type="button"
            onClick={() =>
              signIn("google", { callbackUrl: callbackUrl ?? "/me" })
            }
            className="ne-btn-secondary w-full"
          >
            Continue with Google
          </button>
        </>
      ) : null}
    </form>
  );
}
