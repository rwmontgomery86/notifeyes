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
import { computeShiftCost, formatUsd } from "@/lib/pricing";
import { computeCancellationFee } from "@/lib/cancellation";
import { formatShiftWhen } from "@/lib/dates";
import { OdContractSign } from "./OdContractSign";
import { CancelBooking } from "./CancelBooking";
import { NoShowReport } from "./NoShowReport";
import { CheckInOut } from "./CheckInOut";

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

  const cost = computeShiftCost({
    rateCentsPerHour: row.shift.rateCentsPerHour,
    startsAt: row.shift.startsAt,
    endsAt: row.shift.endsAt,
    lunchMinutes: row.shift.lunchMinutes,
  });

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
          <Row label="Subtotal" value={formatUsd(cost.subtotalCents)} />
          <Row
            label={`Platform fee (${(cost.feeBps / 100).toFixed(0)}%)`}
            value={formatUsd(cost.feeCents)}
          />
          <div className="border-t pt-2 mt-1 font-semibold">
            <Row label="Total" value={formatUsd(cost.totalCents)} />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Payment status:{" "}
            <span className="font-medium text-foreground">
              {row.booking.paymentStatus}
            </span>
            {row.booking.paymentIntentId
              ? ` · intent ${row.booking.paymentIntentId.slice(0, 16)}…`
              : ""}
          </div>
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

      {isMyOd ? (
        <section className="mt-6 ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Check in / out
          </h2>
          <CheckInOut
            bookingId={row.booking.id}
            bookingStatus={row.booking.status}
            shiftStartsAt={row.shift.startsAt.toISOString()}
            shiftEndsAt={row.shift.endsAt.toISOString()}
            checkedInAt={row.booking.checkInAt?.toISOString() ?? null}
            checkedOutAt={row.booking.checkOutAt?.toISOString() ?? null}
          />
        </section>
      ) : null}

      {row.booking.status === "confirmed" || row.booking.status === "in_progress" ? (
        <section className="mt-6 ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Manage booking
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {(() => {
              const fee = computeCancellationFee({
                shiftStartsAt: row.shift.startsAt,
                totalCents: row.booking.totalCents,
              });
              return (
                <CancelBooking
                  bookingId={row.booking.id}
                  feeCents={fee.feeCents}
                  feeCopy={fee.copy}
                  side={isMyPractice ? "practice" : "od"}
                />
              );
            })()}
            {isMyPractice ? (
              <NoShowReport bookingId={row.booking.id} shiftStartsAt={row.shift.startsAt.toISOString()} />
            ) : null}
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
