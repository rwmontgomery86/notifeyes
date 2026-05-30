import { sql } from "drizzle-orm";
import { db } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness/health probe for uptime monitors and quick manual checks.
 *
 *   GET /api/health
 *
 * Reports:
 *   - database: a `SELECT 1` round-trip + latency.
 *   - worker:   pg-boss queue depth (queued/active) and the most recent
 *               completed-job timestamp. The worker schedules cron scans every
 *               5 min, so a completion within the last 15 min means it's alive.
 *
 * HTTP 200 when the DB is reachable (even if the worker looks stale — that's
 * reported in the body as status "degraded"); 503 only when the DB is down.
 * No secrets in the response.
 */

// Crons fire every 5 min; allow 3× headroom before calling the worker stale.
const WORKER_FRESH_MS = 15 * 60 * 1000;

export async function GET(): Promise<Response> {
  const started = Date.now();

  const database: { ok: boolean; latencyMs: number | null } = {
    ok: false,
    latencyMs: null,
  };
  const worker: {
    ok: boolean;
    lastJobCompletedAt: string | null;
    queued: number | null;
    active: number | null;
    note: string;
  } = { ok: false, lastJobCompletedAt: null, queued: null, active: null, note: "" };

  let status: "ok" | "degraded" | "down" = "ok";

  // --- Database ---------------------------------------------------------
  try {
    const t = Date.now();
    await db.execute(sql`SELECT 1`);
    database.ok = true;
    database.latencyMs = Date.now() - t;
  } catch {
    database.ok = false;
    status = "down";
  }

  // --- Worker (pg-boss) -------------------------------------------------
  if (database.ok) {
    try {
      const result = await db.execute<{
        queued: string | number;
        active: string | number;
        last_completed: string | Date | null;
      }>(sql`
        SELECT
          count(*) FILTER (WHERE state IN ('created', 'retry')) AS queued,
          count(*) FILTER (WHERE state = 'active') AS active,
          max(completed_on) AS last_completed
        FROM pgboss.job
      `);
      const row = result.rows[0];
      worker.queued = Number(row?.queued ?? 0);
      worker.active = Number(row?.active ?? 0);
      const last = row?.last_completed ? new Date(row.last_completed) : null;
      worker.lastJobCompletedAt = last?.toISOString() ?? null;

      if (last && Date.now() - last.getTime() < WORKER_FRESH_MS) {
        worker.ok = true;
        worker.note = "recent job activity";
      } else {
        worker.ok = false;
        worker.note = last
          ? "no job completed in the last 15m — worker may be down"
          : "no completed jobs recorded yet";
        if (status === "ok") status = "degraded";
      }
    } catch {
      worker.ok = false;
      worker.note =
        "could not read pgboss.job — the worker may never have started (schema absent) or the pg-boss version differs";
      if (status === "ok") status = "degraded";
    }
  }

  return Response.json(
    {
      status,
      timestamp: new Date().toISOString(),
      tookMs: Date.now() - started,
      checks: { database, worker },
    },
    { status: status === "down" ? 503 : 200 },
  );
}
