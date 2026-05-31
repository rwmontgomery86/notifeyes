import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookings, optometrists, shifts } from "@/db/schema";
import { formatShiftWhen } from "@/lib/dates";
import { formatUsd } from "@/lib/pricing";

export const metadata = { title: "Billing · NotifEyes" };
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending auth",
  authorizing: "Authorizing",
  requires_capture: "Authorized · pending capture",
  succeeded: "Charged",
  canceled: "Cancelled",
  failed: "Failed",
};

export default async function PracticeBillingPage() {
  const session = await auth();
  const practiceId = session!.user.practiceId!;

  const rows = await db
    .select({
      booking: bookings,
      shift: shifts,
      od: optometrists,
    })
    .from(bookings)
    .innerJoin(shifts, eq(shifts.id, bookings.shiftId))
    .innerJoin(optometrists, eq(optometrists.id, bookings.odId))
    .where(eq(bookings.practiceId, practiceId))
    .orderBy(desc(bookings.createdAt))
    .limit(100);

  // Fee-only: NotifEyes only charges the match fee. Wages are paid directly by
  // the practice and never sum into anything NotifEyes bills.
  const feesCharged = rows
    .filter((r) => r.booking.paymentStatus === "succeeded")
    .reduce((s, r) => s + r.booking.platformFeeCents, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold">Billing</h1>
      <p className="mt-1 text-muted-foreground">
        NotifEyes only charges its match fee per booking — held when you book and
        captured once you confirm the OD showed up. You pay each OD&apos;s wage
        directly; we never handle it.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Bookings on file" value={String(rows.length)} />
        <Stat label="Match fees charged" value={formatUsd(feesCharged)} />
        <Stat
          label="Payment method"
          value={"Stub (Stripe pending integration)"}
          sub
        />
      </div>

      <h2 className="mt-10 text-lg font-semibold">Invoices</h2>
      <div className="mt-4 grid gap-2">
        {rows.length === 0 ? (
          <div className="ne-card text-sm text-muted-foreground">
            Invoices appear here once you book your first shift.
          </div>
        ) : null}
        {rows.map(({ booking, shift, od }) => (
          <div key={booking.id} className="ne-card">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="text-sm font-medium">
                  <Link href={`/bookings/${booking.id}`} className="hover:underline">
                    {od.name}
                  </Link>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatShiftWhen(shift.startsAt, shift.endsAt)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Intent {booking.paymentIntentId?.slice(0, 16) ?? "—"} · status{" "}
                  <span className="font-medium text-foreground">
                    {STATUS_LABELS[booking.paymentStatus] ?? booking.paymentStatus}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">
                  {formatUsd(booking.platformFeeCents)}
                </div>
                <div className="text-xs text-muted-foreground">
                  match fee · OD wage{" "}
                  {formatUsd(booking.totalCents - booking.platformFeeCents)} paid
                  directly
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        {/* --TODO: legal review --- tax / 1099 / receipts copy */}
        Year-end tax documents are not yet generated. Stripe Connect + automated
        1099 collection is V2.
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: boolean }) {
  return (
    <div className="ne-card">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={"mt-1 " + (sub ? "text-sm" : "text-2xl font-semibold")}>
        {value}
      </div>
    </div>
  );
}
