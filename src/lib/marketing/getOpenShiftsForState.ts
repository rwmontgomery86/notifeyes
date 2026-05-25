import "server-only";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { practices, shifts } from "@/db/schema";

export interface OpenShiftCard {
  id: string;
  practiceName: string;
  startsAt: Date;
  endsAt: Date;
  rateCentsPerHour: number;
  type: "fill_in" | "half_day" | "weekend" | "recurring" | "permanent";
  urgent: boolean;
}

export async function getOpenShiftsForState(
  stateCode: string,
  limit = 6,
): Promise<OpenShiftCard[]> {
  const rows = await db
    .select({
      id: shifts.id,
      practiceName: practices.name,
      startsAt: shifts.startsAt,
      endsAt: shifts.endsAt,
      rateCentsPerHour: shifts.rateCentsPerHour,
      type: shifts.type,
      urgent: shifts.urgent,
    })
    .from(shifts)
    .innerJoin(practices, eq(practices.id, shifts.practiceId))
    .where(
      and(
        eq(practices.state, stateCode),
        eq(shifts.status, "posted"),
        gt(shifts.startsAt, sql`now()`),
      ),
    )
    .orderBy(desc(shifts.postedAt))
    .limit(limit);

  return rows;
}
