import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import {
  bookings,
  contracts,
  optometrists,
  practices,
  shifts,
  threads,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { formatUsd } from "@/lib/pricing";
import { cancellationNotice } from "@/lib/cancellation";
import { formatShiftWhen } from "@/lib/dates";
import { OdContractSign } from "./OdContractSign";
import { CancelBooking } from "./CancelBooking";
import { NoShowReport } from "./NoShowReport";
import { ConfirmAttendance } from "./ConfirmAttendance";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [row] = await db
    .select({
      booking: bookings,
      shift: shifts,
      practice: practices,
      od: optometrists,
      contract: contracts,
    })
    .from(bookings)
    .innerJoin(shifts, eq(bookings.shiftId, shifts.id))
    .innerJoin(practices, eq(bookings.practiceId, practices.id))
    .innerJoin(optometrists, eq(bookings.odId, optometrists.id))
    .leftJoin(contracts, eq(contracts.bookingId, bookings.id))
    .where(eq(bookings.id, id))
    .limit(1);
  if (!row) notFound();

  // Authorization: practice user on this practice, OR the OD whose odId matches
  const isMyPractice =
    (session.user.role === "practice_owner" ||
      session.user.role === "practice_scheduler") &&
    session.user.practiceId === row.booking.practiceId;
  const isMyOd =
    session.user.role === "od" && session.user.odId === row.booking.odId;
  if (!isMyPractice && !isMyOd && session.user.role !== "admin") {
    redirect("/");
  }

  const [thread] = await db
    .select({ id: threads.id })
    .from(threads)
    .where(eq(threads.contextBookingId, row.booking.id))
    .limit(1);

  // Read fee/total from the booking row (preserves historical accuracy across
  // pricing-model changes). Subtotal = total − fee; OD payout = subtotal.
  const feeCents = row.booking.platformFeeCents;
  const totalCents = row.booking.totalCents;
  const subtotalCents = totalCents - feeCents;
  const matchFeeLabel = "Match fee";
  const feeStatus = feeStatusCopy(row.booking.paymentStatus);

  const odSigned = !!row.contract?.signedByOdAt;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="ne-card bg-green-50/40 border-green-500/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide font-semibold text-green-800">
              Booking confirmed
            </div>
            <h1 className="mt-1 text-2xl font-bold">
              {row.practice.name} × {row.od.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatShiftWhen(row.shift.startsAt, row.shift.endsAt)} ·{" "}
              {row.practice.city}, {row.practice.state}
            </p>
          </div>
          <Link
            href={thread ? `/messages/${thread.id}` : "/messages"}
            className="ne-btn-secondary"
          >
            Message
          </Link>
        </div>
      </div>

      <section className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Practice
          </h2>
          <div className="mt-2 text-sm">
            <div className="font-medium">{row.practice.name}</div>
            <div className="text-muted-foreground">
              {row.practice.addressLine}
              {row.practice.addressLine ? ", " : ""}
              {row.practice.city}, {row.practice.state} {row.practice.zip}
            </div>
          </div>
        </div>
        <div className="ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Optometrist
          </h2>
          <div className="mt-2 text-sm">
            <div className="font-medium">{row.od.name}</div>
            <Link
              href={`/ods/${row.od.id}`}
              className="text-xs font-medium text-primary"
            >
              View profile →
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 ne-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Payment
        </h2>
        <dl className="mt-3 grid gap-1 text-sm">
          {isMyOd ? (
            <>
              <div className="font-semibold text-base">
                <Row label="You earn" value={formatUsd(subtotalCents)} />
              </div>
              <p className="pt-1 text-xs text-muted-foreground">
                Paid to you directly by the practice. NotifEyes doesn&apos;t take a
                cut of your pay.
              </p>
            </>
          ) : (
            <>
              <Row label="OD wage — you pay directly" value={formatUsd(subtotalCents)} />
              <Row label={`${matchFeeLabel} — your card`} value={formatUsd(feeCents)} />
              <div
                className={`mt-2 rounded-md border px-3 py-2 text-xs ${FEE_TONE[feeStatus.tone]}`}
              >
                <span className="font-medium">{feeStatus.label}.</span>{" "}
                {feeStatus.detail}
              </div>
            </>
          )}
        </dl>
      </section>

      <section className="mt-6 ne-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Engagement agreement
        </h2>
        <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
          <div>
            Practice signed:{" "}
            {row.contract?.signedByPracticeAt
              ? row.contract.signedByPracticeAt.toLocaleString()
              : "—"}
          </div>
          <div>
            OD signed:{" "}
            {row.contract?.signedByOdAt
              ? row.contract.signedByOdAt.toLocaleString()
              : "Pending"}
          </div>
        </div>

        {isMyOd && !odSigned && row.contract ? (
          <OdContractSign
            bookingId={row.booking.id}
            contractBody={row.contract.bodyText}
          />
        ) : null}

        {row.contract ? (
          <details className="mt-3">
            <summary className="text-xs cursor-pointer text-muted-foreground">
              View agreement text
            </summary>
            <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-md border bg-secondary/30 p-3 text-xs">
{row.contract.bodyText}
            </pre>
          </details>
        ) : null}
      </section>

      {isMyPractice &&
      !row.booking.attendanceConfirmedAt &&
      (row.booking.status === "in_progress" ||
        row.booking.status === "completed") ? (
        <section className="mt-6 ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Did the doctor show up?
          </h2>
          <div className="mt-3 space-y-3">
            <ConfirmAttendance
              bookingId={row.booking.id}
              odName={row.od.displayName ?? row.od.name}
            />
            <div className="border-t pt-3">
              <NoShowReport
                bookingId={row.booking.id}
                shiftStartsAt={row.shift.startsAt.toISOString()}
              />
            </div>
          </div>
        </section>
      ) : null}

      {isMyPractice && row.booking.attendanceConfirmedAt ? (
        <section className="mt-6 ne-card border-green-500/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-green-900">
            Attendance confirmed
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You confirmed {row.od.name} showed up on{" "}
            {row.booking.attendanceConfirmedAt.toLocaleString()}. Your{" "}
            {formatUsd(feeCents)}{" "}match fee was captured. The OD&apos;s wage is paid
            by you directly.
          </p>
        </section>
      ) : null}

      {row.booking.status === "confirmed" || row.booking.status === "in_progress" ? (
        <section className="mt-6 ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Manage booking
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <CancelBooking
              bookingId={row.booking.id}
              notice={cancellationNotice({ shiftStartsAt: row.shift.startsAt }).copy}
              side={isMyPractice ? "practice" : "od"}
            />
          </div>
        </section>
      ) : null}

      {row.booking.status === "cancelled" ? (
        <section className="mt-6 ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Cancellation
          </h2>
          <div className="mt-2 text-sm">
            <div>Reason: {row.booking.cancellationReason ?? "—"}</div>
            {row.booking.cancellationFeeCents != null ? (
              <div>Fee charged: {formatUsd(row.booking.cancellationFeeCents)}</div>
            ) : null}
            {row.booking.cancelledAt ? (
              <div className="text-xs text-muted-foreground">
                Cancelled {row.booking.cancelledAt.toLocaleString()}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {row.booking.status === "no_show" ? (
        <section className="mt-6 ne-card border-destructive/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive">
            No-show reported
          </h2>
          <p className="mt-2 text-sm">
            The practice reported a no-show. The OD&apos;s record reflects this.
          </p>
        </section>
      ) : null}

      {row.booking.status === "completed" ? (
        <section className="mt-6 ne-card border-green-500/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-green-900">
            Completed
          </h2>
          <Link
            href={`/reviews/${row.booking.id}`}
            className="mt-2 inline-block text-sm font-medium text-primary"
          >
            Leave a review →
          </Link>
        </section>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

type FeeTone = "ok" | "pending" | "warn";

const FEE_TONE: Record<FeeTone, string> = {
  ok: "border-green-500/30 bg-green-50/40 text-green-900",
  pending: "border-border bg-secondary/30 text-muted-foreground",
  warn: "border-amber-500/40 bg-amber-50/40 text-amber-900",
};

// Human-friendly match-fee status for the practice. In the fee-only model the
// $10 is captured only when the practice confirms attendance, so a not-yet-
// authorized or failed pre-auth is NOT a broken booking — surface it calmly
// with a clear "nothing to do now" instead of a raw machine status (the old
// invite-accept "payment limbo"). Card collection now exists (A3, /p/billing);
// when the real provider is active the hold authorizes off_session at booking.
function feeStatusCopy(status: string): {
  label: string;
  detail: string;
  tone: FeeTone;
} {
  switch (status) {
    case "succeeded":
    case "requires_capture":
    case "authorized":
      return {
        label: "Card authorized",
        detail:
          "We'll capture the match fee only when you confirm the doctor showed up.",
        tone: "ok",
      };
    case "failed":
      return {
        label: "We'll sort the fee out later",
        detail:
          "We couldn't pre-authorize the match fee, but your booking is locked in. We'll collect it when you confirm attendance — nothing to do right now.",
        tone: "warn",
      };
    default:
      // authorizing / requires_payment_method / pending / unknown
      return {
        label: "Booking confirmed",
        detail:
          "The match fee is collected when you confirm the doctor showed up — no payment needed now.",
        tone: "pending",
      };
  }
}
