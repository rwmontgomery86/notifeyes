"use client";

import { useState, useTransition } from "react";
import { requestPasswordReset } from "./actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("email", email);
    startTransition(async () => {
      await requestPasswordReset(formData);
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="mt-6 rounded-md border border-green-500/40 bg-green-50/40 px-3 py-3 text-sm text-green-900">
        If an account exists for <span className="font-medium">{email}</span>,
        we&apos;ve emailed a password-reset link. It expires in 1 hour — check
        your spam folder if it doesn&apos;t arrive.
      </div>
    );
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
      <button type="submit" className="ne-btn w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
