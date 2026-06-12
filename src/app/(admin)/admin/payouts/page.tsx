import { asc, eq, ne } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import {
  bookings,
  optometrists,
  payouts,
  practices,
  shifts,
} from "@/db/schema";
import { formatUsd } from "@/lib/pricing";
import { formatShiftWhen } from "@/lib/dates";
import { PayoutActions } from "./PayoutActions";

export const metadata = { title: "Manual payouts · NotifEyes admin" };
export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const rows = await db
    .select({
      payout: payouts,
      booking: bookings,
      shift: shifts,
      practice: practices,
      od: optometrists,
    })
    .from(payouts)
    .innerJoin(bookings, eq(bookings.id, payouts.bookingId))
    .innerJoin(shifts, eq(shifts.id, bookings.shiftId))
    .innerJoin(practices, eq(practices.id, bookings.practiceId))
    .innerJoin(optometrists, eq(optometrists.id, payouts.odId))
    .where(ne(payouts.status, "sent"))
    .orderBy(asc(payouts.scheduledFor))
    .limit(200);

  const dueNow = rows.filter((r) => r.payout.scheduledFor.getTime() <= Date.now());

  return (
    <div>
      <h1 className="text-2xl font-bold">Wage tracking</h1>
      <p className="mt-1 text-muted-foreground">
        Fee-only model: each practice pays its OD&apos;s wage directly —
        NotifEyes never moves it. This queue tracks those wages. Mark one paid
        once the practice confirms, and it shows as paid on the OD&apos;s
        payouts dashboard.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Due now ({dueNow.length})</h2>
      {dueNow.length === 0 ? (
        <div className="ne-card mt-3 text-sm text-muted-foreground">
          Nothing due right this second.
        </div>
      ) : null}
      <div className="mt-3 grid gap-2">
        {dueNow.map(({ payout, booking, shift, practice, od }) => (
          <div key={payout.id} className="ne-card">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{od.name}</div>
                <div className="text-xs text-muted-foreground">
                  <Link href={`/bookings/${booking.id}`} className="hover:underline">
                    {practice.name}
                  </Link>{" "}
                  · {formatShiftWhen(shift.startsAt, shift.endsAt)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Paid directly by the practice — wage never routes through
                  NotifEyes.
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">
                  {formatUsd(payout.amountCents)}
                </div>
                <span className="ne-pill border-amber-500/40 bg-amber-100/60 text-amber-900">
                  {payout.status}
                </span>
              </div>
            </div>
            <PayoutActions payoutId={payout.id} />
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Upcoming ({rows.length - dueNow.length})</h2>
      <div className="mt-3 grid gap-2">
        {rows
          .filter((r) => r.payout.scheduledFor.getTime() > Date.now())
          .map(({ payout, od }) => (
            <div key={payout.id} className="ne-card opacity-70">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-sm">{od.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Scheduled {payout.scheduledFor.toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {formatUsd(payout.amountCents)}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
