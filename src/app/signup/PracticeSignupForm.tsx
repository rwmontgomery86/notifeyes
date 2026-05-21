"use client";

import { useState, useTransition } from "react";
import { signupPractice } from "./actions";

export function PracticeSignupForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await signupPractice(formData);
      if (!res.ok) setError(res.error ?? "Signup failed");
    });
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Create your practice account.</h1>
      <p className="mt-2 text-muted-foreground">
        You&apos;ll be able to post shifts and invite ODs immediately.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
        <fieldset className="grid gap-4 md:grid-cols-2">
          <Field name="name" label="Your name" required />
          <Field name="email" label="Work email" type="email" required />
          <Field
            name="password"
            label="Password (min 8 chars)"
            type="password"
            required
            minLength={8}
          />
          <Field name="practiceName" label="Practice name" required />
        </fieldset>

        <fieldset className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
          <Field name="addressLine" label="Street address" required />
          <Field name="city" label="City" required defaultValue="San Francisco" />
          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <Field name="state" label="State" required defaultValue="CA" maxLength={2} />
            <Field name="zip" label="ZIP" required maxLength={10} />
          </div>
        </fieldset>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="pt-2">
          <button type="submit" className="ne-btn" disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          {/* --TODO: legal review --- terms acknowledgement copy */}
          By creating an account you agree to NotifEyes&apos;s Terms and Privacy Policy.
        </p>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
  minLength,
  maxLength,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="ne-label">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        minLength={minLength}
        maxLength={maxLength}
        className="ne-input"
      />
    </label>
  );
}
