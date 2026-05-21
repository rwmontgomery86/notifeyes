import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { applications, optometrists, practices, shifts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { computeShiftCost, formatUsd } from "@/lib/pricing";
import { formatShiftWhen } from "@/lib/dates";
import { buildContractBody, CONTRACT_TEMPLATE_VERSION } from "@/lib/contract";
import { ConfirmBookingForm } from "./ConfirmBookingForm";

export const dynamic = "force-dynamic";

export default async function ConfirmBookingPage({
  params,
}: {
  params: Promise<{ id: string; appId: string }>;
}) {
  const { id, appId } = await params;
  const session = await auth();
  if (!session?.user.practiceId) redirect("/p/dashboard");

  const [row] = await db
    .select({
      shift: shifts,
      application: applications,
      od: optometrists,
      practice: practices,
    })
    .from(applications)
    .innerJoin(shifts, eq(applications.shiftId, shifts.id))
    .innerJoin(optometrists, eq(applications.odId, optometrists.id))
    .innerJoin(practices, eq(shifts.practiceId, practices.id))
    .where(eq(applications.id, appId))
    .limit(1);
  if (!row || row.shift.id !== id) notFound();
  if (
    row.shift.practiceId !== session.user.practiceId &&
    session.user.role !== "admin"
  ) {
    redirect("/p/dashboard");
  }

  if (row.shift.status !== "posted") {
    redirect(`/p/shifts/${id}`);
  }

  const cost = computeShiftCost({
    rateCentsPerHour: row.shift.rateCentsPerHour,
    startsAt: row.shift.startsAt,
    endsAt: row.shift.endsAt,
    lunchMinutes: row.shift.lunchMinutes,
  });

  const contractBody = buildContractBody({
    practiceName: row.practice.name,
    odName: row.od.name,
    shiftStartsAt: row.shift.startsAt,
    shiftEndsAt: row.shift.endsAt,
    ratePerHour: formatUsd(row.shift.rateCentsPerHour),
    totalAmount: formatUsd(cost.totalCents),
    platformFeePct: `${(cost.feeBps / 100).toFixed(0)}%`,
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Confirm booking</h1>
      <p className="mt-1 text-muted-foreground">
        Once you confirm, we charge a card authorization, generate the contract,
        and notify {row.od.displayName ?? row.od.name}. The shift is locked in.
      </p>

      <section className="mt-6 ne-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Summary
        </h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Row label="Optometrist" value={row.od.name} />
          <Row label="Shift" value={formatShiftWhen(row.shift.startsAt, row.shift.endsAt)} />
          <Row label="Hours billed" value={cost.hours.toFixed(2)} />
          <Row label="Rate" value={`${formatUsd(row.shift.rateCentsPerHour)}/hr`} />
        </dl>
      </section>

      <section className="mt-6 ne-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Cost breakdown
        </h2>
        <dl className="mt-3 space-y-1 text-sm">
          <Row label="Subtotal" value={formatUsd(cost.subtotalCents)} />
          <Row
            label={`Platform fee (${(cost.feeBps / 100).toFixed(0)}%)`}
            value={formatUsd(cost.feeCents)}
          />
          <div className="border-t pt-2 mt-2 font-semibold text-base">
            <Row label="Total charged to practice" value={formatUsd(cost.totalCents)} />
          </div>
          <p className="pt-1 text-xs text-muted-foreground">
            {/* --TODO: legal review --- payout schedule + auth-vs-capture wording */}
            We authorize the charge now and capture at shift completion. The OD&apos;s
            payout of {formatUsd(cost.odPayoutCents)} is scheduled 3 days after completion.
          </p>
        </dl>
      </section>

      <section className="mt-6 ne-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Engagement agreement ({CONTRACT_TEMPLATE_VERSION})
        </h2>
        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border bg-secondary/40 p-3 text-xs leading-relaxed">
{contractBody}
        </pre>
      </section>

      <ConfirmBookingForm
        applicationId={appId}
        shiftId={id}
        contractBody={contractBody}
      />
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
