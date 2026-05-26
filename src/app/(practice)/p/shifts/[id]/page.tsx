import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import {
  applications,
  bookings,
  optometrists,
  practices,
  shifts,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { computeCancellationFee } from "@/lib/cancellation";
import { formatShiftWhen } from "@/lib/dates";
import { formatUsd, computeShiftCost } from "@/lib/pricing";
import { buildContractBody, CONTRACT_TEMPLATE_VERSION } from "@/lib/contract";
import { ApplicantActions } from "./ApplicantActions";
import { BoostModal } from "./BoostModal";
import { CancelShift } from "./CancelShift";
import { InvitePanel } from "./InvitePanel";

export const dynamic = "force-dynamic";

export default async function ShiftAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user.practiceId) redirect("/p/dashboard");

  const [row0] = await db
    .select({ shift: shifts, practice: practices })
    .from(shifts)
    .innerJoin(practices, eq(practices.id, shifts.practiceId))
    .where(eq(shifts.id, id))
    .limit(1);
  if (!row0) notFound();
  const shift = row0.shift;
  const practice = row0.practice;
  if (
    shift.practiceId !== session.user.practiceId &&
    session.user.role !== "admin"
  ) {
    redirect("/p/dashboard");
  }

  const rows = await db
    .select({ application: applications, od: optometrists })
    .from(applications)
    .innerJoin(optometrists, eq(applications.odId, optometrists.id))
    .where(eq(applications.shiftId, id))
    .orderBy(desc(applications.createdAt));

  const effectiveRate = shift.bumpRateCentsPerHour ?? shift.rateCentsPerHour;
  const cost = computeShiftCost({
    rateCentsPerHour: effectiveRate,
    startsAt: shift.startsAt,
    endsAt: shift.endsAt,
    lunchMinutes: shift.lunchMinutes,
    urgent: shift.urgent,
  });
  const matchFeeDisplay = cost.sameDay
    ? `${formatUsd(cost.feeCents)} (same-day)`
    : formatUsd(cost.feeCents);

  let feePreview: { feeCents: number; copy: string } | null = null;
  if (shift.status === "booked") {
    const [booking] = await db
      .select({ totalCents: bookings.totalCents })
      .from(bookings)
      .where(eq(bookings.shiftId, shift.id))
      .limit(1);
    if (booking) {
      const fee = computeCancellationFee({
        shiftStartsAt: shift.startsAt,
        totalCents: booking.totalCents,
      });
      feePreview = { feeCents: fee.feeCents, copy: fee.copy };
    }
  }

  const buckets: Record<string, typeof rows> = {
    applied: [],
    shortlisted: [],
    offered: [],
    accepted: [],
    declined: [],
    withdrawn: [],
  };
  for (const r of rows) buckets[r.application.status]!.push(r);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Shift</h1>
        <div className="flex items-center gap-3">
          <span className="ne-pill capitalize border-border">
            {shift.status}
          </span>
          {shift.status === "posted" ? (
            <BoostModal
              shiftId={shift.id}
              baseRateCentsPerHour={shift.rateCentsPerHour}
              currentBumpRateCentsPerHour={shift.bumpRateCentsPerHour}
            />
          ) : null}
          <CancelShift
            shiftId={shift.id}
            status={shift.status}
            feePreview={feePreview}
          />
        </div>
      </div>

      <div className="mt-4 ne-card">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="text-lg">
              {formatShiftWhen(shift.startsAt, shift.endsAt)}
            </div>
            <div className="text-sm text-muted-foreground capitalize">
              {shift.type.replace("_", " ")} · {shift.lunchMinutes} min lunch
            </div>
          </div>
          <div className="text-right">
            {shift.bumpRateCentsPerHour != null ? (
              <>
                <div className="text-2xl font-bold">
                  {formatUsd(shift.bumpRateCentsPerHour)}/hr
                </div>
                <div className="text-xs text-amber-700">
                  Boosted from {formatUsd(shift.rateCentsPerHour)}/hr
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold">
                {formatUsd(shift.rateCentsPerHour)}/hr
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Est. {formatUsd(cost.totalCents)} total ({matchFeeDisplay} match fee)
            </div>
          </div>
        </div>
        {shift.notesForOd ? (
          <p className="mt-3 text-sm">{shift.notesForOd}</p>
        ) : null}
      </div>

      {shift.status === "posted" ? (
        <div className="mt-6">
          <InvitePanel
            shiftId={shift.id}
            contractBody={buildContractBody({
              practiceName: practice.name,
              odName: "[Invited OD]",
              shiftStartsAt: shift.startsAt,
              shiftEndsAt: shift.endsAt,
              ratePerHour: formatUsd(effectiveRate),
              totalAmount: formatUsd(cost.totalCents),
              matchFee: matchFeeDisplay,
            })}
          />
        </div>
      ) : null}

      <h2 className="mt-8 text-lg font-semibold">Applicants ({rows.length})</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Column title="Applied" rows={buckets.applied!} shift={shift} />
        <Column title="Shortlisted" rows={buckets.shortlisted!} shift={shift} />
        <Column title="Offered" rows={buckets.offered!} shift={shift} />
      </div>

      {buckets.declined!.length + buckets.withdrawn!.length > 0 ? (
        <details className="mt-6">
          <summary className="text-sm text-muted-foreground cursor-pointer">
            Declined / withdrawn ({buckets.declined!.length + buckets.withdrawn!.length})
          </summary>
          <div className="mt-3 grid gap-2">
            {[...buckets.declined!, ...buckets.withdrawn!].map((r) => (
              <div key={r.application.id} className="ne-card opacity-60">
                <div className="text-sm">{r.od.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {r.application.status}
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      <div className="mt-12 text-sm text-muted-foreground">
        <Link href={`/shifts/${id}`} className="hover:text-foreground">
          View public shift page →
        </Link>
      </div>
    </div>
  );
}

function Column({
  title,
  rows,
  shift,
}: {
  title: string;
  rows: { application: typeof applications.$inferSelect; od: typeof optometrists.$inferSelect }[];
  shift: typeof shifts.$inferSelect;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {title} · {rows.length}
      </div>
      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="ne-card text-xs text-muted-foreground">No one here yet.</div>
        ) : null}
        {rows.map(({ application, od }) => (
          <div key={application.id} className="ne-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{od.name}</div>
                <div className="text-xs text-muted-foreground">
                  {od.ratingCount > 0 && od.ratingAvg
                    ? `${od.ratingAvg.toFixed(1)} ★ · ${od.ratingCount} reviews · `
                    : ""}
                  {od.shiftsCompleted} shifts completed
                </div>
                {application.message ? (
                  <p className="mt-2 text-sm">{application.message}</p>
                ) : null}
                <Link
                  href={`/ods/${od.id}`}
                  className="mt-2 inline-block text-xs font-medium text-primary"
                >
                  View profile →
                </Link>
              </div>
            </div>
            <ApplicantActions
              applicationId={application.id}
              shiftId={shift.id}
              status={application.status}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
