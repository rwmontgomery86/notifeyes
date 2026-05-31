import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookings, payouts, practices, shifts } from "@/db/schema";
import { formatUsd } from "@/lib/pricing";
import { formatShiftWhen } from "@/lib/dates";

export const metadata = { title: "Payouts · NotifEyes" };
export const dynamic = "force-dynamic";

export default async function OdPayoutsPage() {
  const session = await auth();
  const odId = session!.user.odId!;

  const rows = await db
    .select({
      payout: payouts,
      booking: bookings,
      shift: shifts,
      practice: practices,
    })
    .from(payouts)
    .innerJoin(bookings, eq(bookings.id, payouts.bookingId))
    .innerJoin(shifts, eq(shifts.id, bookings.shiftId))
    .innerJoin(practices, eq(practices.id, bookings.practiceId))
    .where(eq(payouts.odId, odId))
    .orderBy(desc(payouts.scheduledFor))
    .limit(100);

  const totalScheduled = rows
    .filter((r) => r.payout.status === "scheduled")
    .reduce((s, r) => s + r.payout.amountCents, 0);
  const totalSent = rows
    .filter((r) => r.payout.status === "sent")
    .reduce((s, r) => s + r.payout.amountCents, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold">Payouts</h1>
      <p className="mt-1 text-muted-foreground">
        Your wage is paid to you <strong>directly by each practice</strong> —
        NotifEyes doesn&apos;t process your pay during beta (Stripe Connect payouts
        arrive in V2). This is your record of what you&apos;ve earned and when each
        practice marked it paid.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Owed to you" value={formatUsd(totalScheduled)} />
        <Stat label="Marked paid" value={formatUsd(totalSent)} />
        <Stat label="Shifts on file" value={String(rows.length)} />
      </div>

      <h2 className="mt-10 text-lg font-semibold">Per-shift</h2>
      <div className="mt-4 grid gap-2">
        {rows.length === 0 ? (
          <div className="ne-card text-sm text-muted-foreground">
            Payouts show up here as soon as you complete a shift.
          </div>
        ) : null}
        {rows.map(({ payout, booking, shift, practice }) => (
          <div key={payout.id} className="ne-card">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="text-sm font-medium">
                  <Link href={`/bookings/${booking.id}`} className="hover:underline">
                    {practice.name}
                  </Link>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatShiftWhen(shift.startsAt, shift.endsAt)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Expected by {payout.scheduledFor.toLocaleDateString()}
                  {payout.sentAt
                    ? ` · paid ${payout.sentAt.toLocaleDateString()}`
                    : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">
                  {formatUsd(payout.amountCents)}
                </div>
                <span
                  className={
                    payout.status === "sent"
                      ? "ne-pill border-green-500/40 bg-green-100/60 text-green-900"
                      : payout.status === "scheduled"
                        ? "ne-pill border-amber-500/40 bg-amber-100/60 text-amber-900"
                        : "ne-pill border-destructive/40 bg-destructive/10 text-destructive"
                  }
                >
                  {payout.status === "sent"
                    ? "paid"
                    : payout.status === "scheduled"
                      ? "owed"
                      : payout.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ne-card">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
