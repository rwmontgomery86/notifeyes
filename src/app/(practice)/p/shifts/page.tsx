import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { shifts, shiftStatusEnum } from "@/db/schema";
import { formatShiftWhen } from "@/lib/dates";
import { formatUsd } from "@/lib/pricing";
import { DraftActions } from "./DraftActions";

export const metadata = { title: "Shifts · NotifEyes" };
export const dynamic = "force-dynamic";

type StatusFilter = (typeof shiftStatusEnum.enumValues)[number];

const STATUS_LABELS: Record<StatusFilter, string> = {
  draft: "Draft",
  posted: "Posted",
  booked: "Booked",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function PracticeShiftsIndex({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const practiceId = session!.user.practiceId!;

  const sp = await searchParams;
  const filter: StatusFilter | null =
    sp.status && (shiftStatusEnum.enumValues as readonly string[]).includes(sp.status)
      ? (sp.status as StatusFilter)
      : null;

  const rows = await db
    .select()
    .from(shifts)
    .where(
      filter
        ? and(eq(shifts.practiceId, practiceId), eq(shifts.status, filter))
        : eq(shifts.practiceId, practiceId),
    )
    .orderBy(desc(shifts.startsAt))
    .limit(200);

  const heading = filter ? `${STATUS_LABELS[filter]} shifts` : "All shifts";
  const emptyCopy = filter
    ? `No ${STATUS_LABELS[filter].toLowerCase()} shifts.`
    : "No shifts yet. Post your first one to start receiving applications.";

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold">{heading}</h1>
          <span className="text-sm text-muted-foreground">({rows.length})</span>
          {filter ? (
            <Link
              href="/p/shifts"
              className="text-sm font-medium text-primary hover:underline"
            >
              All
            </Link>
          ) : null}
        </div>
        <Link href="/p/shifts/new" className="ne-btn">
          + Post a shift
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {(["draft", "posted", "booked", "completed", "cancelled"] as const).map(
          (s) => (
            <Link
              key={s}
              href={`/p/shifts?status=${s}`}
              className={`ne-pill border ${
                filter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary"
              }`}
            >
              {STATUS_LABELS[s]}
            </Link>
          ),
        )}
      </div>

      <div className="mt-6 grid gap-2">
        {rows.length === 0 ? (
          <div className="ne-card text-sm text-muted-foreground">{emptyCopy}</div>
        ) : null}
        {rows.map((s) =>
          s.status === "draft" ? (
            <div
              key={s.id}
              className="ne-card flex items-center justify-between gap-4"
            >
              <Link
                href={`/p/shifts/${s.id}/edit`}
                className="flex-1 min-w-0 hover:text-primary"
              >
                <div className="text-sm">
                  {formatShiftWhen(s.startsAt, s.endsAt)}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {s.type.replace("_", " ")} · {s.lunchMinutes} min lunch ·{" "}
                  {formatUsd(s.rateCentsPerHour)}/hr
                </div>
              </Link>
              <DraftActions shiftId={s.id} />
            </div>
          ) : (
            <Link
              key={s.id}
              href={`/p/shifts/${s.id}`}
              className="ne-card hover:border-primary transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-sm">
                    {formatShiftWhen(s.startsAt, s.endsAt)}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {s.type.replace("_", " ")} · {s.lunchMinutes} min lunch
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {formatUsd(s.rateCentsPerHour)}/hr
                  </span>
                  <span className="ne-pill border-border capitalize">
                    {s.status}
                  </span>
                </div>
              </div>
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
