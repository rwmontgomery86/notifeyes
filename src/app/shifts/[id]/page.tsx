import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { applications, optometrists, practices, shifts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { computeShiftCost, formatUsd } from "@/lib/pricing";
import { formatShiftWhen, relativeTime } from "@/lib/dates";
import { ApplyButton } from "./ApplyButton";
import { ApplicationStatusCard } from "./ApplicationStatusCard";
import { InviteResponse } from "./InviteResponse";
import { isUuid } from "@/lib/uuid";

export const dynamic = "force-dynamic";

export default async function ShiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [row] = await db
    .select({
      shift: shifts,
      practice: practices,
    })
    .from(shifts)
    .innerJoin(practices, eq(shifts.practiceId, practices.id))
    .where(eq(shifts.id, id))
    .limit(1);
  if (!row) notFound();

  const session = await auth();
  const meIsOd = session?.user?.role === "od";
  const meIsPractice =
    session?.user?.role === "practice_owner" ||
    session?.user?.role === "practice_scheduler";

  // If the viewer is the practice that owns this shift, send them to /p admin
  const isOwnPractice =
    meIsPractice && session?.user.practiceId === row.shift.practiceId;

  const cost = computeShiftCost({
    rateCentsPerHour: row.shift.rateCentsPerHour,
    startsAt: row.shift.startsAt,
    endsAt: row.shift.endsAt,
    lunchMinutes: row.shift.lunchMinutes,
  });

  let existingApplication:
    | { id: string; status: string; source: string }
    | null = null;
  let odVerified = false;
  if (meIsOd && session?.user.odId) {
    const { and: andOp } = await import("drizzle-orm");
    const [appRow] = await db
      .select({
        id: applications.id,
        status: applications.status,
        source: applications.source,
      })
      .from(applications)
      .where(
        andOp(
          eq(applications.shiftId, id),
          eq(applications.odId, session.user.odId),
        ),
      )
      .limit(1);
    existingApplication = appRow
      ? { id: appRow.id, status: appRow.status, source: appRow.source }
      : null;
    const [od] = await db
      .select({ status: optometrists.verificationStatus })
      .from(optometrists)
      .where(eq(optometrists.id, session.user.odId))
      .limit(1);
    odVerified = od?.status === "verified";
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={meIsOd ? "/d/shifts" : "/"}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        {row.shift.status !== "posted" ? (
          <span className="ne-pill border-amber-500/40 bg-amber-100/60 text-amber-900 capitalize">
            {row.shift.status}
          </span>
        ) : (
          <span className="ne-pill border-green-500/40 bg-green-100/60 text-green-900">
            Open
          </span>
        )}
      </div>

      <header className="ne-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{row.practice.name}</h1>
            <p className="text-sm text-muted-foreground">
              {row.practice.city}, {row.practice.state}
            </p>
            <p className="mt-3 text-lg">
              {formatShiftWhen(row.shift.startsAt, row.shift.endsAt)}
            </p>
            <p className="text-sm text-muted-foreground">
              {relativeTime(row.shift.startsAt)} ·{" "}
              {cost.hours.toFixed(1)} billable hours
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {formatUsd(row.shift.rateCentsPerHour)}
              <span className="text-sm font-medium text-muted-foreground">
                /hr
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Est. total {formatUsd(cost.subtotalCents)}
            </div>
          </div>
        </div>
      </header>

      <section className="mt-6 ne-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          About this shift
        </h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium capitalize">
              {row.shift.type.replace("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Lunch</dt>
            <dd className="font-medium">{row.shift.lunchMinutes} min</dd>
          </div>
          {row.shift.notesForOd ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Notes from the practice</dt>
              <dd className="mt-1 whitespace-pre-wrap">
                {row.shift.notesForOd}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="mt-6 ne-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          About the practice
        </h2>
        <p className="mt-2 text-sm">{row.practice.bio ?? "—"}</p>
        <Link
          href={`/practices/${row.practice.id}`}
          className="mt-3 inline-block text-sm font-medium text-primary"
        >
          View full practice profile →
        </Link>
      </section>

      <div className="mt-8 flex justify-end">
        {isOwnPractice ? (
          <Link href={`/p/shifts/${id}`} className="ne-btn-secondary">
            Manage shift →
          </Link>
        ) : meIsOd ? (
          row.shift.status !== "posted" ? (
            <span className="ne-pill border-muted-foreground/40 text-muted-foreground">
              Shift no longer open
            </span>
          ) : existingApplication?.source === "invite" &&
            existingApplication.status === "offered" ? (
            <InviteResponse
              applicationId={existingApplication.id}
              practiceName={row.practice.name}
            />
          ) : existingApplication ? (
            <ApplicationStatusCard
              shiftId={id}
              status={existingApplication.status}
              source={existingApplication.source}
            />
          ) : (
            <ApplyButton shiftId={id} verified={odVerified} />
          )
        ) : (
          <Link href="/login" className="ne-btn">
            Log in to apply
          </Link>
        )}
      </div>
    </div>
  );
}
