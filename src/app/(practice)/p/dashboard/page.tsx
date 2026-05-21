import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { practices, shifts } from "@/db/schema";
import { DashboardCalendar } from "./DashboardCalendar";
import Link from "next/link";

export const metadata = { title: "Dashboard · NotifEyes" };
export const dynamic = "force-dynamic";

export default async function PracticeDashboard({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const session = await auth();
  const practiceId = session!.user.practiceId!;
  const [practice] = await db
    .select()
    .from(practices)
    .where(eq(practices.id, practiceId))
    .limit(1);

  // Which month are we showing? Default = now in the server's local TZ.
  const sp = await searchParams;
  const now = new Date();
  const year = sp.y ? Number(sp.y) : now.getFullYear();
  const month = sp.m ? Number(sp.m) - 1 : now.getMonth(); // 0-indexed
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const monthShifts = await db
    .select({
      id: shifts.id,
      startsAt: shifts.startsAt,
      endsAt: shifts.endsAt,
      status: shifts.status,
      rateCentsPerHour: shifts.rateCentsPerHour,
      type: shifts.type,
    })
    .from(shifts)
    .where(
      and(
        eq(shifts.practiceId, practiceId),
        sql`${shifts.startsAt} >= ${monthStart}`,
        sql`${shifts.startsAt} < ${monthEnd}`,
      ),
    )
    .orderBy(shifts.startsAt);

  const counts = await db
    .select({
      status: shifts.status,
      count: sql<number>`count(*)::int`,
    })
    .from(shifts)
    .where(eq(shifts.practiceId, practiceId))
    .groupBy(shifts.status);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.count]));

  const monthLabel = monthStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const navHref = (d: Date) =>
    `/p/dashboard?y=${d.getFullYear()}&m=${d.getMonth() + 1}`;

  return (
    <div>
      <h1 className="text-2xl font-bold">{practice?.name ?? "Practice"}</h1>
      <p className="mt-1 text-muted-foreground">
        Welcome back. Here&apos;s a snapshot of your shift activity.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Stat label="Draft" value={byStatus.draft ?? 0} />
        <Stat label="Posted" value={byStatus.posted ?? 0} />
        <Stat label="Booked" value={byStatus.booked ?? 0} />
        <Stat label="Completed" value={byStatus.completed ?? 0} />
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/p/shifts/new" className="ne-btn">
          + Post a shift
        </Link>
        <Link href="/p/shifts" className="ne-btn-secondary">
          All shifts
        </Link>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{monthLabel}</h2>
          <div className="flex items-center gap-2">
            <Link href={navHref(prev)} className="ne-btn-ghost h-8 px-2 text-sm">
              ← Prev
            </Link>
            <Link href={navHref(now)} className="ne-btn-ghost h-8 px-2 text-sm">
              Today
            </Link>
            <Link href={navHref(next)} className="ne-btn-ghost h-8 px-2 text-sm">
              Next →
            </Link>
          </div>
        </div>

        <DashboardCalendar
          year={year}
          month={month}
          shifts={monthShifts.map((s) => ({
            id: s.id,
            startsAt: s.startsAt.toISOString(),
            endsAt: s.endsAt.toISOString(),
            status: s.status,
            rateCentsPerHour: s.rateCentsPerHour,
            type: s.type,
          }))}
        />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="ne-card">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}
