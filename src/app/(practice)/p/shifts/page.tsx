import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { shifts } from "@/db/schema";
import { formatShiftWhen } from "@/lib/dates";
import { formatUsd } from "@/lib/pricing";

export const metadata = { title: "Shifts · NotifEyes" };
export const dynamic = "force-dynamic";

export default async function PracticeShiftsIndex() {
  const session = await auth();
  const practiceId = session!.user.practiceId!;

  const rows = await db
    .select()
    .from(shifts)
    .where(eq(shifts.practiceId, practiceId))
    .orderBy(desc(shifts.startsAt))
    .limit(200);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All shifts</h1>
        <Link href="/p/shifts/new" className="ne-btn">
          + Post a shift
        </Link>
      </div>

      <div className="mt-6 grid gap-2">
        {rows.length === 0 ? (
          <div className="ne-card text-sm text-muted-foreground">
            No shifts yet. Post your first one to start receiving applications.
          </div>
        ) : null}
        {rows.map((s) => (
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
        ))}
      </div>
    </div>
  );
}
