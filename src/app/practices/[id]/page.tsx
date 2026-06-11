import { and, desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { odPracticeBlocks, practices, shifts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { formatShiftWhen } from "@/lib/dates";
import { formatUsd } from "@/lib/pricing";
import { BlockButton } from "./BlockButton";

export const dynamic = "force-dynamic";

export default async function PracticePublicProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [p] = await db
    .select()
    .from(practices)
    .where(eq(practices.id, id))
    .limit(1);
  if (!p) notFound();

  const session = await auth();
  const viewerOdId = session?.user.odId ?? null;
  let isBlocked = false;
  if (viewerOdId) {
    const [b] = await db
      .select({ odId: odPracticeBlocks.odId })
      .from(odPracticeBlocks)
      .where(
        and(
          eq(odPracticeBlocks.odId, viewerOdId),
          eq(odPracticeBlocks.practiceId, id),
        ),
      )
      .limit(1);
    isBlocked = !!b;
  }

  const openShifts = await db
    .select()
    .from(shifts)
    .where(
      and(
        eq(shifts.practiceId, id),
        eq(shifts.status, "posted"),
        sql`${shifts.startsAt} > now()`,
      ),
    )
    .orderBy(desc(shifts.startsAt))
    .limit(10);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-muted-foreground">
        ← Back
      </Link>

      <header className="mt-6 ne-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{p.name}</h1>
            {p.dba ? <p className="text-sm text-muted-foreground">d/b/a {p.dba}</p> : null}
            <p className="mt-1 text-sm text-muted-foreground">
              {p.addressLine}
              {p.addressLine ? ", " : ""}
              {p.city}, {p.state} {p.zip}
            </p>
            {p.ratingCount > 0 && p.ratingAvg ? (
              <p className="mt-2 text-sm">
                <span className="font-medium">{p.ratingAvg.toFixed(1)} ★</span>{" "}
                <span className="text-muted-foreground">
                  · {p.ratingCount} reviews · {p.shiftsCompleted} shifts hosted
                </span>
              </p>
            ) : null}
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-1">
            {p.businessLicenseVerified ? (
              <div className="ne-pill border-green-500/40 bg-green-100/60 text-green-900">
                Business verified
              </div>
            ) : null}
            {p.onTimePayPct ? (
              <div>{p.onTimePayPct.toFixed(0)}% on-time pay</div>
            ) : null}
            {p.avgFillTimeHrs ? (
              <div>~{p.avgFillTimeHrs.toFixed(1)}h avg fill</div>
            ) : null}
            {viewerOdId ? (
              <div className="pt-2">
                <BlockButton
                  practiceId={p.id}
                  practiceName={p.name}
                  initiallyBlocked={isBlocked}
                />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {p.bio ? (
        <section className="mt-6 ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            About
          </h2>
          <p className="mt-2 text-sm whitespace-pre-wrap">{p.bio}</p>
        </section>
      ) : null}

      {p.photos.length > 0 ? (
        <section className="mt-6 ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Photos
          </h2>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {p.photos.map((url, i) => {
              const img = (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={`${p.name} — photo ${i + 1}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-md border object-cover"
                />
              );
              // Dev uploads are data: URLs, which browsers refuse to open in
              // a new tab — only link out the real (http) ones.
              return url.startsWith("http") ? (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block transition-opacity hover:opacity-90"
                >
                  {img}
                </a>
              ) : (
                <div key={i}>{img}</div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="ne-card">
          <h3 className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
            Practice details
          </h3>
          <dl className="mt-2 text-sm grid gap-1">
            <Row label="EHR" value={p.ehr ?? "—"} />
            <Row label="Chairs" value={String(p.chairs ?? "—")} />
            <Row label="Established" value={String(p.yearEstablished ?? "—")} />
          </dl>
        </div>
        <div className="ne-card">
          <h3 className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
            Services
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.services.length === 0 ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              p.services.map((s) => (
                <span key={s} className="ne-pill border-border">
                  {s}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      {openShifts.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Open shifts at this practice
          </h2>
          <div className="mt-3 grid gap-2">
            {openShifts.map((s) => (
              <Link
                key={s.id}
                href={`/shifts/${s.id}`}
                className="ne-card hover:border-primary transition-colors flex items-baseline justify-between gap-4"
              >
                <div className="text-sm">
                  {formatShiftWhen(s.startsAt, s.endsAt)}
                </div>
                <div className="text-sm font-medium">
                  {formatUsd(s.rateCentsPerHour)}/hr
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
