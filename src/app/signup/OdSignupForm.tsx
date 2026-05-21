"use client";

import { useState, useTransition } from "react";
import { signupOd } from "./actions";

const STEPS = ["Account", "License", "Welcome"] as const;
type Step = (typeof STEPS)[number];

export function OdSignupForm() {
  const [step, setStep] = useState<Step>("Account");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Hold values across steps client-side until final submit
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    licenseState: "CA",
    licenseNumber: "",
  });
  const [licenseDoc, setLicenseDoc] = useState<File | null>(null);

  function next() {
    setError(null);
    const idx = STEPS.indexOf(step);
    if (idx < 0 || idx + 1 >= STEPS.length) return;
    setStep(STEPS[idx + 1]!);
  }
  function back() {
    setError(null);
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]!);
  }

  function submit() {
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (licenseDoc) fd.append("licenseDoc", licenseDoc);
    startTransition(async () => {
      const res = await signupOd(fd);
      if (!res.ok) {
        setError(res.error ?? "Signup failed");
        setStep("Account");
      }
    });
  }

  return (
    <div>
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => {
          const idx = STEPS.indexOf(step);
          const state = i < idx ? "done" : i === idx ? "current" : "next";
          return (
            <li key={s} className="flex items-center gap-2 text-sm">
              <span
                className={
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold " +
                  (state === "done"
                    ? "bg-primary text-primary-foreground border-primary"
                    : state === "current"
                      ? "border-primary text-primary"
                      : "text-muted-foreground")
                }
              >
                {i + 1}
              </span>
              <span
                className={
                  state === "next" ? "text-muted-foreground" : "text-foreground"
                }
              >
                {s}
              </span>
              {i < STEPS.length - 1 ? (
                <span className="ml-1 text-muted-foreground">·</span>
              ) : null}
            </li>
          );
        })}
      </ol>

      {step === "Account" ? (
        <Step1
          form={form}
          setForm={setForm}
          onNext={next}
          error={error}
          setError={setError}
        />
      ) : step === "License" ? (
        <Step2
          form={form}
          setForm={setForm}
          licenseDoc={licenseDoc}
          setLicenseDoc={setLicenseDoc}
          onNext={next}
          onBack={back}
          error={error}
          setError={setError}
        />
      ) : (
        <Step3 onSubmit={submit} onBack={back} pending={pending} />
      )}
    </div>
  );
}

function Step1({
  form,
  setForm,
  onNext,
  error,
  setError,
}: {
  form: {
    name: string;
    email: string;
    password: string;
    licenseState: string;
    licenseNumber: string;
  };
  setForm: (v: typeof form) => void;
  onNext: () => void;
  error: string | null;
  setError: (e: string | null) => void;
}) {
  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || form.password.length < 8) {
      setError("Fill in name, email, and a password (min 8 chars).");
      return;
    }
    onNext();
  }
  return (
    <form onSubmit={go} className="grid gap-4">
      <h1 className="text-3xl font-bold">Your details.</h1>
      <p className="text-muted-foreground">
        We&apos;ll use this to set up your OD profile.
      </p>
      <label className="block">
        <span className="ne-label">Full name (as on your license)</span>
        <input
          required
          className="ne-input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="ne-label">Email</span>
        <input
          required
          type="email"
          autoComplete="email"
          className="ne-input"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="ne-label">Password (min 8 chars)</span>
        <input
          required
          type="password"
          autoComplete="new-password"
          minLength={8}
          className="ne-input"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </label>
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="flex justify-end">
        <button type="submit" className="ne-btn">
          Continue
        </button>
      </div>
    </form>
  );
}

function Step2({
  form,
  setForm,
  licenseDoc,
  setLicenseDoc,
  onNext,
  onBack,
  error,
  setError,
}: {
  form: {
    name: string;
    email: string;
    password: string;
    licenseState: string;
    licenseNumber: string;
  };
  setForm: (v: typeof form) => void;
  licenseDoc: File | null;
  setLicenseDoc: (f: File | null) => void;
  onNext: () => void;
  onBack: () => void;
  error: string | null;
  setError: (e: string | null) => void;
}) {
  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!form.licenseState || form.licenseState.length !== 2 || !form.licenseNumber) {
      setError("Enter your license state (2 letters) and license number.");
      return;
    }
    onNext();
  }
  return (
    <form onSubmit={go} className="grid gap-4">
      <h1 className="text-3xl font-bold">License info.</h1>
      <p className="text-muted-foreground">
        We verify your license before you can apply to shifts. Browse and watch
        zones are unlocked immediately; applying unlocks after verification
        (typically &lt; 24 hours).
      </p>
      <div className="grid grid-cols-[1fr_3fr] gap-3">
        <label className="block">
          <span className="ne-label">State</span>
          <input
            required
            maxLength={2}
            className="ne-input"
            value={form.licenseState}
            onChange={(e) =>
              setForm({ ...form, licenseState: e.target.value.toUpperCase() })
            }
          />
        </label>
        <label className="block">
          <span className="ne-label">License number</span>
          <input
            required
            className="ne-input"
            value={form.licenseNumber}
            onChange={(e) =>
              setForm({ ...form, licenseNumber: e.target.value })
            }
          />
        </label>
      </div>

      <div>
        <span className="ne-label">License document (optional now, required before applying)</span>
        <div className="flex items-center gap-3">
          <label className="ne-btn-secondary cursor-pointer">
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => setLicenseDoc(e.target.files?.[0] ?? null)}
            />
            {licenseDoc ? "Replace" : "Upload"}
          </label>
          {licenseDoc ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{licenseDoc.name}</span>
              <button
                type="button"
                onClick={() => setLicenseDoc(null)}
                className="text-destructive"
              >
                Remove
              </button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              JPG, PNG, WEBP, or PDF — max 4 MB
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Upload now and an admin starts verifying immediately. Skip and you can
          add it from your profile — your account is created either way.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="flex justify-between">
        <button type="button" className="ne-btn-secondary" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="ne-btn">
          Continue
        </button>
      </div>
    </form>
  );
}

function Step3({
  onSubmit,
  onBack,
  pending,
}: {
  onSubmit: () => void;
  onBack: () => void;
  pending: boolean;
}) {
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-bold">You&apos;re almost in.</h1>
      <p className="text-muted-foreground">
        Once you create your account, you can set a watch zone, browse open
        shifts, and upload your credential documents. Applying unlocks the
        moment your license is verified.
      </p>
      <ul className="ne-card text-sm space-y-2">
        <li>· Browse and follow practices — <strong>unlocked now</strong></li>
        <li>· Draw watch zones, set rate floor — <strong>unlocked now</strong></li>
        <li>· Apply to a shift — <strong>unlocks after verification</strong></li>
      </ul>
      <div className="flex justify-between">
        <button type="button" className="ne-btn-secondary" onClick={onBack} disabled={pending}>
          Back
        </button>
        <button type="button" className="ne-btn" onClick={onSubmit} disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </div>
    </div>
  );
}
