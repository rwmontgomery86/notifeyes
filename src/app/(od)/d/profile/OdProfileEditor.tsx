"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileField } from "@/components/FileField";
import { SmsConsentNote } from "@/components/SmsConsentNote";
import { unblockPracticeFromProfile, updateOdProfile } from "./actions";

type OdProfile = {
  id: string;
  name: string;
  displayName: string | null;
  headshotUrl: string | null;
  bio: string | null;
  travelRadiusMi: number;
  homeZip: string | null;
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
  email: string;
  phone: string | null;
  emailOptedIn: boolean;
  smsOptedIn: boolean;
  conciergeOptedIn: boolean;
};

type BlockedPractice = { practiceId: string; practiceName: string };

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

export function OdProfileEditor({
  initial,
  blocked,
}: {
  initial: OdProfile;
  blocked: BlockedPractice[];
}) {
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
        homeZip: form.homeZip,
        licenseDocUrl: form.licenseDocUrl,
        deaUrl: form.deaUrl,
        malpracticeUrl: form.malpracticeUrl,
        cprUrl: form.cprUrl,
        npiNumber: form.npiNumber,
        ehrExperience: form.ehrExperience,
        specialties: form.specialties,
        phone: form.phone,
        smsOptedIn: form.smsOptedIn,
        emailOptedIn: form.emailOptedIn,
        conciergeOptedIn: form.conciergeOptedIn,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function unblock(practiceId: string) {
    startTransition(async () => {
      await unblockPracticeFromProfile(practiceId);
      router.refresh();
    });
  }

  const phoneTrimmed = (form.phone ?? "").trim();
  const smsDisabled = phoneTrimmed.length === 0;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="grid gap-6">
        <section className="ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Notification contact
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            How we reach you when a shift matches one of your watch zones. At
            least one channel must be enabled before you can create a watch zone.
          </p>
          <div className="mt-3 grid gap-4">
            <label>
              <span className="ne-label">Email</span>
              <input
                value={form.email}
                readOnly
                className="ne-input bg-muted/40"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.emailOptedIn}
                onChange={(e) =>
                  setForm({ ...form, emailOptedIn: e.target.checked })
                }
              />
              <span>Notify me by email about matching shifts.</span>
            </label>
            <label>
              <span className="ne-label">Phone</span>
              <input
                type="tel"
                value={form.phone ?? ""}
                onChange={(e) => {
                  const next = e.target.value;
                  setForm({
                    ...form,
                    phone: next,
                    smsOptedIn: next.trim().length === 0 ? false : form.smsOptedIn,
                  });
                }}
                className="ne-input"
                maxLength={32}
                placeholder="+1 555 123 4567"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.smsOptedIn}
                disabled={smsDisabled}
                onChange={(e) =>
                  setForm({ ...form, smsOptedIn: e.target.checked })
                }
              />
              <span
                className={smsDisabled ? "text-muted-foreground" : undefined}
              >
                Notify me by SMS about matching shifts.
                {smsDisabled ? " (add a phone number first)" : null}
              </span>
            </label>
            <SmsConsentNote about="shifts that match your watch zones" />
            <label className="flex items-start gap-2 border-t border-border pt-3 text-sm">
              <input
                type="checkbox"
                checked={form.conciergeOptedIn}
                onChange={(e) =>
                  setForm({ ...form, conciergeOptedIn: e.target.checked })
                }
                className="mt-1"
              />
              <span>
                <span className="font-medium">Concierge updates.</span> Get a
                same-day reminder with the practice address and a calendar
                invite (.ics) for each booking — optional extras on top of your
                standard shift alerts.
              </span>
            </label>
          </div>
        </section>

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
              <span className="ne-label">Mileage willing to travel</span>
              <input
                type="number"
                min={5}
                max={200}
                value={form.travelRadiusMi}
                onChange={(e) => setForm({ ...form, travelRadiusMi: Number(e.target.value) })}
                className="ne-input w-32"
              />
            </label>
            <label>
              <span className="ne-label">Home ZIP code</span>
              <input
                value={form.homeZip ?? ""}
                onChange={(e) => setForm({ ...form, homeZip: e.target.value })}
                inputMode="numeric"
                maxLength={10}
                placeholder="e.g. 94110"
                className="ne-input w-32"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Centers your shift map and powers &ldquo;miles away&rdquo; on
                open shifts. Never shown to practices.
              </p>
            </label>
          </div>
        </section>

        <section className="ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Credentials
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            All documents here are optional — your license number is what we
            verify. Uploading the license document helps our team verify you
            faster, and the rest strengthen your profile.
          </p>
          <div className="mt-3 grid gap-3">
            <FileField
              label="License document (optional — speeds up verification)"
              value={form.licenseDocUrl}
              onChange={(v) => setForm({ ...form, licenseDocUrl: v })}
              accept="image/*,application/pdf"
            />
            <FileField
              label="DEA registration (optional)"
              value={form.deaUrl}
              onChange={(v) => setForm({ ...form, deaUrl: v })}
              accept="image/*,application/pdf"
            />
            <FileField
              label="Malpractice insurance (optional)"
              value={form.malpracticeUrl}
              onChange={(v) => setForm({ ...form, malpracticeUrl: v })}
              accept="image/*,application/pdf"
            />
            <FileField
              label="CPR certificate (optional)"
              value={form.cprUrl}
              onChange={(v) => setForm({ ...form, cprUrl: v })}
              accept="image/*,application/pdf"
            />
            <label>
              <span className="ne-label">NPI (optional)</span>
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

        <section className="ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Blocked practices
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Shifts from blocked practices are hidden from your feed and
            notifications.
          </p>
          {blocked.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              You haven&apos;t blocked any practices.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {blocked.map((b) => (
                <li
                  key={b.practiceId}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span>{b.practiceName}</span>
                  <button
                    type="button"
                    onClick={() => unblock(b.practiceId)}
                    disabled={pending}
                    className="ne-btn-ghost text-xs"
                  >
                    Unblock
                  </button>
                </li>
              ))}
            </ul>
          )}
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
              An admin reviews and verifies typically within 24 hours.
              Uploading your license doc above can speed up the review.
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
