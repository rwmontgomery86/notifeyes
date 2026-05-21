"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileField } from "@/components/FileField";
import { updateOdProfile } from "./actions";

type OdProfile = {
  id: string;
  name: string;
  displayName: string | null;
  headshotUrl: string | null;
  bio: string | null;
  travelRadiusMi: number;
  licenseState: string | null;
  licenseNumber: string | null;
  licenseDocUrl: string | null;
  deaUrl: string | null;
  malpracticeUrl: string | null;
  cprUrl: string | null;
  npiNumber: string | null;
  ehrExperience: string[];
  specialties: string[];
  verificationStatus: string;
  verifiedAt: string | null;
  verificationNotes: string | null;
};

const EHR_OPTIONS = [
  "RevolutionEHR",
  "Crystal Practice",
  "Eyefinity OfficeMate",
  "Compulink",
  "Practice Director",
  "Maximeyes",
];
const SPECIALTIES = [
  "Pediatrics",
  "Specialty CL",
  "Ocular disease",
  "Dry eye",
  "Myopia control",
  "Low vision",
];

export function OdProfileEditor({ initial }: { initial: OdProfile }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggleArr(key: "ehrExperience" | "specialties", value: string) {
    const current = form[key];
    const has = current.includes(value);
    setForm({
      ...form,
      [key]: has ? current.filter((v) => v !== value) : [...current, value],
    });
  }

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateOdProfile({
        displayName: form.displayName,
        headshotUrl: form.headshotUrl,
        bio: form.bio,
        travelRadiusMi: form.travelRadiusMi,
        licenseDocUrl: form.licenseDocUrl,
        deaUrl: form.deaUrl,
        malpracticeUrl: form.malpracticeUrl,
        cprUrl: form.cprUrl,
        npiNumber: form.npiNumber,
        ehrExperience: form.ehrExperience,
        specialties: form.specialties,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="grid gap-6">
        <section className="ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Basics
          </h2>
          <div className="mt-3 grid gap-4">
            <FileField
              label="Headshot"
              value={form.headshotUrl}
              onChange={(v) => setForm({ ...form, headshotUrl: v })}
              accept="image/*"
            />
            <label>
              <span className="ne-label">Display name (how the practice sees you)</span>
              <input
                value={form.displayName ?? ""}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder={form.name}
                className="ne-input"
                maxLength={200}
              />
            </label>
            <label>
              <span className="ne-label">Short bio</span>
              <textarea
                rows={4}
                value={form.bio ?? ""}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="ne-input h-auto"
                maxLength={500}
                placeholder="A sentence or two about your experience, EHR fluency, and what kinds of shifts you love."
              />
            </label>
            <label>
              <span className="ne-label">Travel radius (miles)</span>
              <input
                type="number"
                min={5}
                max={200}
                value={form.travelRadiusMi}
                onChange={(e) => setForm({ ...form, travelRadiusMi: Number(e.target.value) })}
                className="ne-input w-32"
              />
            </label>
          </div>
        </section>

        <section className="ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Credentials
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            We require license, DEA, and malpractice docs. ID verification is
            optional but unlocks faster booking.
          </p>
          <div className="mt-3 grid gap-3">
            <FileField
              label="License document"
              value={form.licenseDocUrl}
              onChange={(v) => setForm({ ...form, licenseDocUrl: v })}
              accept="image/*,application/pdf"
            />
            <FileField
              label="DEA registration"
              value={form.deaUrl}
              onChange={(v) => setForm({ ...form, deaUrl: v })}
              accept="image/*,application/pdf"
            />
            <FileField
              label="Malpractice insurance"
              value={form.malpracticeUrl}
              onChange={(v) => setForm({ ...form, malpracticeUrl: v })}
              accept="image/*,application/pdf"
            />
            <FileField
              label="CPR certificate"
              value={form.cprUrl}
              onChange={(v) => setForm({ ...form, cprUrl: v })}
              accept="image/*,application/pdf"
            />
            <label>
              <span className="ne-label">NPI</span>
              <input
                value={form.npiNumber ?? ""}
                onChange={(e) => setForm({ ...form, npiNumber: e.target.value })}
                className="ne-input"
                maxLength={20}
              />
            </label>
          </div>
        </section>

        <section className="ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            EHR experience
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {EHR_OPTIONS.map((opt) => {
              const on = form.ehrExperience.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleArr("ehrExperience", opt)}
                  className={`ne-pill border ${on ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Specialties
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {SPECIALTIES.map((opt) => {
              const on = form.specialties.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleArr("specialties", opt)}
                  className={`ne-pill border ${on ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </section>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {saved ? (
          <div className="rounded-md border border-green-500/30 bg-green-50/40 px-3 py-2 text-sm text-green-900">
            Saved.
          </div>
        ) : null}

        <div>
          <button onClick={submit} disabled={pending} className="ne-btn">
            {pending ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>

      <aside className="ne-card sticky top-6 self-start">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Verification
        </h2>
        <div className="mt-3 space-y-2 text-sm">
          <Status status={form.verificationStatus} />
          <div className="text-xs text-muted-foreground">
            {form.licenseState} #{form.licenseNumber}
          </div>
          {form.verifiedAt ? (
            <div className="text-xs text-muted-foreground">
              Verified {new Date(form.verifiedAt).toLocaleDateString()}
            </div>
          ) : null}
          {form.verificationNotes ? (
            <div className="text-xs">
              Admin note: <span className="text-foreground">{form.verificationNotes}</span>
            </div>
          ) : null}
          {form.verificationStatus === "pending" ? (
            <p className="text-xs text-muted-foreground">
              Upload your license doc above. An admin reviews and verifies
              typically within 24 hours.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Status({ status }: { status: string }) {
  if (status === "verified")
    return (
      <span className="ne-pill border-green-500/40 bg-green-100/60 text-green-900">
        ✓ Verified
      </span>
    );
  if (status === "rejected")
    return (
      <span className="ne-pill border-destructive/40 bg-destructive/10 text-destructive">
        Not verified
      </span>
    );
  return (
    <span className="ne-pill border-amber-500/40 bg-amber-100/60 text-amber-900">
      Pending review
    </span>
  );
}
