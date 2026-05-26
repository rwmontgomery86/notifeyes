import { and, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { practices, shifts } from "@/db/schema";
import { countOdsMatchingShift } from "@/lib/matching";
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

  // Reach estimate: how many ODs would match a typical fill-in shift here.
  // Use the median rate of recent posts (or a sane default if there are none),
  // a generic next-weekday 9-5 window, and shiftType=fill_in.
  let reach: { count: number; bumpedCount: number } | null = null;
  try {
    const recent = await db
      .select({ rate: shifts.rateCentsPerHour })
      .from(shifts)
      .where(eq(shifts.practiceId, practiceId))
      .orderBy(desc(shifts.createdAt))
      .limit(5);
    const rates = recent.map((r) => r.rate).sort((a, b) => a - b);
    const medianRate =
      rates.length === 0
        ? 11000
        : rates[Math.floor(rates.length / 2)] ?? 11000;
    // Next weekday from today, 9am-5pm UTC.
    const probe = new Date();
    do {
      probe.setUTCDate(probe.getUTCDate() + 1);
    } while (probe.getUTCDay() === 0 || probe.getUTCDay() === 6);
    const startsAt = new Date(
      Date.UTC(
        probe.getUTCFullYear(),
        probe.getUTCMonth(),
        probe.getUTCDate(),
        9,
        0,
        0,
      ),
    );
    const endsAt = new Date(
      Date.UTC(
        probe.getUTCFullYear(),
        probe.getUTCMonth(),
        probe.getUTCDate(),
        17,
        0,
        0,
      ),
    );
    reach = await countOdsMatchingShift({
      practiceId,
      startsAt,
      endsAt,
      shiftType: "fill_in",
      rateCentsPerHour: medianRate,
    });
  } catch (err) {
    console.warn("[dashboard] reach estimate failed:", err);
  }

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

      <div className="mt-6 grid gap-4 md:grid-cols-5">
        <ReachStat count={reach?.count ?? null} />
        <Stat label="Draft" value={byStatus.draft ?? 0} status="draft" />
        <Stat label="Posted" value={byStatus.posted ?? 0} status="posted" />
        <Stat label="Booked" value={byStatus.booked ?? 0} status="booked" />
        <Stat label="Completed" value={byStatus.completed ?? 0} status="completed" />
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

function Stat({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: "draft" | "posted" | "booked" | "completed";
}) {
  return (
    <Link
      href={`/p/shifts?status=${status}`}
      className="ne-card hover:border-primary transition-colors"
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </Link>
  );
}

function ReachStat({ count }: { count: number | null }) {
  return (
    <Link
      href="/p/shifts/new"
      className="ne-card hover:border-primary transition-colors border-amber-500/40 bg-amber-50/40"
    >
      <div className="text-xs uppercase tracking-wide text-amber-800">
        ODs watching
      </div>
      <div className="mt-2 text-3xl font-semibold">
        {count == null ? "—" : count}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Typical weekday fill-in
      </div>
    </Link>
  );
}
