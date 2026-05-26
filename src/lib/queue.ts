/**
 * Helper to enqueue jobs from server actions / API routes.
 *
 * Note: server-side Next.js routes create their own PgBoss instance lazily
 * because the worker process is separate. PgBoss uses Postgres-backed queues
 * so multiple producers + a single consumer all coordinate through the DB.
 */

import "server-only";
import PgBoss from "pg-boss";
import { env } from "@/env";

const globalForBoss = globalThis as unknown as { boss?: PgBoss };

async function getProducerBoss(): Promise<PgBoss> {
  if (globalForBoss.boss) return globalForBoss.boss;
  const boss = new PgBoss(env.DATABASE_URL);
  boss.on("error", (err) => console.error("[boss-producer]", err));
  await boss.start();
  globalForBoss.boss = boss;
  return boss;
}

export async function enqueueFanoutShiftPosted(shiftId: string): Promise<void> {
  const boss = await getProducerBoss();
  await boss.send("fanout-shift-posted", { shiftId });
}

export async function enqueueFanoutShiftBumped(shiftId: string): Promise<void> {
  const boss = await getProducerBoss();
  await boss.send("fanout-shift-bumped", { shiftId });
}

export async function enqueueBookingCompletedFollowups(
  bookingId: string,
  options: { delaySeconds?: number } = {},
): Promise<void> {
  const boss = await getProducerBoss();
  // 2-hour default per §6F (review prompts fire 2h after completion).
  await boss.send(
    "booking-completed-followups",
    { bookingId },
    { startAfter: options.delaySeconds ?? 60 * 60 * 2 },
  );
}
