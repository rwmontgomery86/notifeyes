/**
 * Worker entrypoint. Run alongside `next dev`:
 *
 *   npm run worker      (or: tsx --env-file=.env src/workers/index.ts)
 *
 * Responsibilities:
 *   - Watch-zone fanout (M3)
 *   - Scheduled review-publisher cron (M6) — runs hourly
 *   - No-show check timer (M7)
 *   - Shift reminders (M3)
 *   - Scheduled payouts (M8)
 */

import { getBoss } from "./boss";
import {
  fanoutShiftPosted,
  type FanoutShiftPostedData,
} from "./jobs/fanout-shift-posted";
import {
  fanoutShiftBumped,
  type FanoutShiftBumpedData,
} from "./jobs/fanout-shift-bumped";
import {
  bookingCompletedFollowups,
  type BookingCompletedData,
} from "./jobs/booking-completed-followups";
import { publishPendingReviews } from "./jobs/publish-pending-reviews";
import { advanceBookings } from "./jobs/booking-progression";
import { noShowCheckScan } from "./jobs/no-show-check";
import { shiftRemindersScan } from "./jobs/shift-reminders";
import { conciergeRemindersScan } from "./jobs/concierge-reminders";
import { shiftUnfilledNudgeScan } from "./jobs/shift-unfilled-nudge";
import { credentialExpiringScan } from "./jobs/credential-expiring";
import { purgePasswordResets } from "./jobs/purge-password-resets";

const QUEUE_FANOUT = "fanout-shift-posted";
const QUEUE_FANOUT_BUMPED = "fanout-shift-bumped";
const QUEUE_BOOKING_COMPLETED = "booking-completed-followups";
const QUEUE_REVIEW_CRON = "publish-pending-reviews";
const QUEUE_BOOKING_PROGRESSION = "booking-progression";
const QUEUE_NO_SHOW_CHECK = "no-show-check";
const QUEUE_SHIFT_REMINDERS = "shift-reminders";
const QUEUE_CONCIERGE_REMINDERS = "concierge-reminders";
const QUEUE_SHIFT_UNFILLED = "shift-unfilled-nudge";
const QUEUE_CREDENTIAL_EXPIRING = "credential-expiring";
const QUEUE_PURGE_PASSWORD_RESETS = "purge-password-resets";

async function main() {
  const boss = await getBoss();
  await boss.createQueue(QUEUE_FANOUT);
  await boss.createQueue(QUEUE_FANOUT_BUMPED);
  await boss.createQueue(QUEUE_BOOKING_COMPLETED);
  await boss.createQueue(QUEUE_REVIEW_CRON);
  await boss.createQueue(QUEUE_BOOKING_PROGRESSION);
  await boss.createQueue(QUEUE_NO_SHOW_CHECK);
  await boss.createQueue(QUEUE_SHIFT_REMINDERS);
  await boss.createQueue(QUEUE_CONCIERGE_REMINDERS);
  await boss.createQueue(QUEUE_SHIFT_UNFILLED);
  await boss.createQueue(QUEUE_CREDENTIAL_EXPIRING);
  await boss.createQueue(QUEUE_PURGE_PASSWORD_RESETS);

  await boss.work<FanoutShiftPostedData>(
    QUEUE_FANOUT,
    { batchSize: 5 },
    async (jobs) => {
      for (const job of jobs) {
        try {
          await fanoutShiftPosted(job.data);
        } catch (err) {
          console.error(`[worker] ${QUEUE_FANOUT} job ${job.id} failed:`, err);
          throw err;
        }
      }
    },
  );

  await boss.work<FanoutShiftBumpedData>(
    QUEUE_FANOUT_BUMPED,
    { batchSize: 5 },
    async (jobs) => {
      for (const job of jobs) {
        try {
          await fanoutShiftBumped(job.data);
        } catch (err) {
          console.error(
            `[worker] ${QUEUE_FANOUT_BUMPED} job ${job.id} failed:`,
            err,
          );
          throw err;
        }
      }
    },
  );

  await boss.work<BookingCompletedData>(
    QUEUE_BOOKING_COMPLETED,
    { batchSize: 5 },
    async (jobs) => {
      for (const job of jobs) {
        try {
          await bookingCompletedFollowups(job.data);
        } catch (err) {
          console.error(
            `[worker] ${QUEUE_BOOKING_COMPLETED} job ${job.id} failed:`,
            err,
          );
          throw err;
        }
      }
    },
  );

  await boss.work(QUEUE_REVIEW_CRON, async () => {
    await publishPendingReviews();
  });
  await boss.work(QUEUE_BOOKING_PROGRESSION, async () => {
    await advanceBookings();
  });
  await boss.work(QUEUE_NO_SHOW_CHECK, async () => {
    await noShowCheckScan();
  });
  await boss.work(QUEUE_SHIFT_REMINDERS, async () => {
    await shiftRemindersScan();
  });
  await boss.work(QUEUE_CONCIERGE_REMINDERS, async () => {
    await conciergeRemindersScan();
  });
  await boss.work(QUEUE_SHIFT_UNFILLED, async () => {
    await shiftUnfilledNudgeScan();
  });
  await boss.work(QUEUE_CREDENTIAL_EXPIRING, async () => {
    await credentialExpiringScan();
  });
  await boss.work(QUEUE_PURGE_PASSWORD_RESETS, async () => {
    await purgePasswordResets();
  });

  // Schedule the review cron hourly. pg-boss schedule accepts cron syntax.
  await boss.schedule(QUEUE_REVIEW_CRON, "0 * * * *", {});
  // Schedule the booking-progression scan every 5 minutes.
  await boss.schedule(QUEUE_BOOKING_PROGRESSION, "*/5 * * * *", {});
  // No-show check + shift reminders both run every 5 minutes (they're
  // cheap scans with idempotency via the notifications table).
  await boss.schedule(QUEUE_NO_SHOW_CHECK, "*/5 * * * *", {});
  await boss.schedule(QUEUE_SHIFT_REMINDERS, "*/5 * * * *", {});
  // Concierge morning-of reminders: every 15 min (cheap scan, dedup'd via the
  // notifications table).
  await boss.schedule(QUEUE_CONCIERGE_REMINDERS, "*/15 * * * *", {});
  // Concierge "shift still unfilled" nudge: hourly (2–24h window + dedup).
  await boss.schedule(QUEUE_SHIFT_UNFILLED, "0 * * * *", {});
  // Credential expiration check daily at 9am.
  await boss.schedule(QUEUE_CREDENTIAL_EXPIRING, "0 9 * * *", {});
  // Purge unredeemable password-reset rows daily (kept 24h past expiry).
  await boss.schedule(QUEUE_PURGE_PASSWORD_RESETS, "30 3 * * *", {});

  // Kick once on startup so first run doesn't wait.
  await Promise.all([
    boss.send(QUEUE_BOOKING_PROGRESSION, {}),
    boss.send(QUEUE_NO_SHOW_CHECK, {}),
    boss.send(QUEUE_SHIFT_REMINDERS, {}),
    boss.send(QUEUE_CONCIERGE_REMINDERS, {}),
    boss.send(QUEUE_SHIFT_UNFILLED, {}),
    boss.send(QUEUE_CREDENTIAL_EXPIRING, {}),
    boss.send(QUEUE_PURGE_PASSWORD_RESETS, {}),
  ]);

  console.log(
    `[worker] listening on: ${QUEUE_FANOUT}, ${QUEUE_FANOUT_BUMPED}, ${QUEUE_BOOKING_COMPLETED}, ${QUEUE_REVIEW_CRON} (cron), ${QUEUE_BOOKING_PROGRESSION} (cron), ${QUEUE_NO_SHOW_CHECK} (cron), ${QUEUE_SHIFT_REMINDERS} (cron), ${QUEUE_CONCIERGE_REMINDERS} (cron), ${QUEUE_SHIFT_UNFILLED} (cron), ${QUEUE_CREDENTIAL_EXPIRING} (cron), ${QUEUE_PURGE_PASSWORD_RESETS} (cron)`,
  );

  // Graceful shutdown
  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.on(sig, async () => {
      console.log(`\n[worker] ${sig} received, stopping…`);
      await boss.stop();
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
