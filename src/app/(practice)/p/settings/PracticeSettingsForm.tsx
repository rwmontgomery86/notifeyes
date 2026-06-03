"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileField } from "@/components/FileField";
import { updatePracticeSettings } from "./actions";

type PracticeForm = {
  id: string;
  name: string;
  dba: string | null;
  bio: string | null;
  yearEstablished: number | null;
  chairs: number | null;
  ehr: string | null;
  services: string[];
  addressLine: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  photos: string[];
  email: string;
  phone: string | null;
  emailOptedIn: boolean;
  smsOptedIn: boolean;
  marketingOptedIn: boolean;
  conciergeOptedIn: boolean;
  hasLocation: boolean;
};

const SERVICE_OPTIONS = [
  "Comprehensive exam",
  "Contact lens fitting",
  "Pediatrics",
  "Ocular disease",
  "Dry eye treatment",
  "LASIK co-management",
];

export function PracticeSettingsForm({ initial }: { initial: PracticeForm }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // null = address unchanged on the last save; true/false = geocode hit/missed.
  const [geocoded, setGeocoded] = useState<boolean | null>(null);

  function toggle(key: "services", value: string) {
    const cur = form[key];
    setForm({
      ...form,
      [key]: cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value],
    });
  }

  function addPhoto(url: string | null) {
    if (!url) return;
    if (form.photos.length >= 6) return;
    setForm({ ...form, photos: [...form.photos, url] });
  }

  function removePhoto(idx: number) {
    setForm({ ...form, photos: form.photos.filter((_, i) => i !== idx) });
  }

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updatePracticeSettings({
        name: form.name,
        dba: form.dba,
        bio: form.bio,
        yearEstablished: form.yearEstablished,
        chairs: form.chairs,
        ehr: form.ehr,
        services: form.services,
        addressLine: form.addressLine,
        city: form.city,
        state: form.state,
        zip: form.zip,
        photos: form.photos,
        phone: form.phone,
        emailOptedIn: form.emailOptedIn,
        smsOptedIn: form.smsOptedIn,
        marketingOptedIn: form.marketingOptedIn,
        conciergeOptedIn: form.conciergeOptedIn,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save");
        return;
      }
      setSaved(true);
      setGeocoded(res.geocoded);
      router.refresh();
    });
  }

  const phoneTrimmed = (form.phone ?? "").trim();
  const smsDisabled = phoneTrimmed.length === 0;
  // Reflect the live geocode state: the just-saved result if the address
  // changed, otherwise whatever was stored when the page loaded.
  const located = geocoded == null ? initial.hasLocation : geocoded;

  return (
    <div className="mt-6 grid gap-6">
      <section id="contact" className="ne-card grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Notification contact
        </h2>
        <p className="text-xs text-muted-foreground">
          How we reach you when an OD applies, books, or messages. At least one
          channel must be enabled before you can post a shift.
        </p>
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
          <span>Notify me by email about applicants, bookings, and messages.</span>
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
                smsOptedIn:
                  next.trim().length === 0 ? false : form.smsOptedIn,
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
          <span className={smsDisabled ? "text-muted-foreground" : undefined}>
            Notify me by SMS about applicants and bookings.
            {smsDisabled ? " (add a phone number first)" : null}
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.marketingOptedIn}
            onChange={(e) =>
              setForm({ ...form, marketingOptedIn: e.target.checked })
            }
            className="mt-1"
          />
          <span>
            Send me occasional product updates and tips (optional, separate
            from transactional alerts).
          </span>
        </label>
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
            calendar invite (.ics) for each shift you book — an optional extra
            on top of your standard booking alerts.
          </span>
        </label>
        <p className="text-xs text-muted-foreground">
          We use your phone and email only to notify you about applicants,
          bookings, and your account. Marketing updates (product news, tips)
          are separate and require opt-in above. We do not sell or share your
          contact info with marketing agencies. Standard message and data
          rates may apply for SMS. Reply STOP to opt out at any time.
        </p>
      </section>

      <section className="ne-card grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Basics
        </h2>
        <label>
          <span className="ne-label">Practice name</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="ne-input"
            required
          />
        </label>
        <label>
          <span className="ne-label">DBA (optional)</span>
          <input
            value={form.dba ?? ""}
            onChange={(e) => setForm({ ...form, dba: e.target.value })}
            className="ne-input"
          />
        </label>
        <label>
          <span className="ne-label">Bio</span>
          <textarea
            rows={4}
            value={form.bio ?? ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="ne-input h-auto"
            maxLength={2000}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label>
            <span className="ne-label">Year established</span>
            <input
              type="number"
              min={1800}
              max={2100}
              value={form.yearEstablished ?? ""}
              onChange={(e) => setForm({ ...form, yearEstablished: Number(e.target.value) || null })}
              className="ne-input"
            />
          </label>
          <label>
            <span className="ne-label">Chairs / lanes</span>
            <input
              type="number"
              min={1}
              max={50}
              value={form.chairs ?? ""}
              onChange={(e) => setForm({ ...form, chairs: Number(e.target.value) || null })}
              className="ne-input"
            />
          </label>
          <label>
            <span className="ne-label">EHR</span>
            <input
              value={form.ehr ?? ""}
              onChange={(e) => setForm({ ...form, ehr: e.target.value })}
              className="ne-input"
            />
          </label>
        </div>
      </section>

      <section className="ne-card grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Location
        </h2>
        <label>
          <span className="ne-label">Address</span>
          <input
            value={form.addressLine ?? ""}
            onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
            className="ne-input"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <label>
            <span className="ne-label">City</span>
            <input
              value={form.city ?? ""}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="ne-input"
            />
          </label>
          <label>
            <span className="ne-label">State</span>
            <input
              value={form.state ?? ""}
              maxLength={2}
              onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
              className="ne-input"
            />
          </label>
          <label>
            <span className="ne-label">ZIP</span>
            <input
              value={form.zip ?? ""}
              onChange={(e) => setForm({ ...form, zip: e.target.value })}
              className="ne-input"
              maxLength={10}
            />
          </label>
        </div>
        {located ? (
          <p className="flex items-start gap-2 text-xs text-green-700">
            <span aria-hidden>✓</span>
            <span>
              Your practice is on the map — shifts you post reach nearby ODs. We
              re-check this automatically whenever you change the address.
            </span>
          </p>
        ) : (
          <p className="flex items-start gap-2 text-xs text-amber-700">
            <span aria-hidden>⚠</span>
            <span>
              We couldn&apos;t pin this address to the map, so your shifts
              won&apos;t reach ODs by location yet. Double-check it and save — we
              geocode automatically, no admin step needed.
            </span>
          </p>
        )}
      </section>

      <section className="ne-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Services
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {SERVICE_OPTIONS.map((s) => {
            const on = form.services.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle("services", s)}
                className={`ne-pill border ${on ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
              >
                {s}
              </button>
            );
          })}
        </div>

      </section>

      <section className="ne-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Photos
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Up to 6 photos of the practice. The first is used as a cover image.
        </p>
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {form.photos.map((p, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" className="aspect-square w-full object-cover rounded border" />
              <button
                onClick={() => removePhoto(i)}
                type="button"
                className="absolute top-1 right-1 ne-btn-ghost h-6 px-1 bg-background/80 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {form.photos.length < 6 ? (
          <div className="mt-3">
            <FileField label="Add photo" value={null} onChange={addPhoto} accept="image/*" />
          </div>
        ) : null}
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
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
