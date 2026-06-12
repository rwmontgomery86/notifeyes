/**
 * Structured JSON logging for the worker process. Railway's log search keys
 * on JSON fields, so every event is a single JSON line:
 *
 *   {"ts":"2026-06-12T20:01:02.345Z","level":"info","event":"fanout.matched","shiftId":"…","count":3}
 *
 * Worker-only by design — the Next.js app keeps plain console logs, and the
 * shared modules it imports (notification channels, queue.ts) must not import
 * this. `event` is a stable dot-separated name (job.scope), filterable in
 * Railway; everything else rides along as fields.
 */

type Level = "info" | "warn" | "error";
type Fields = Record<string, unknown>;

function serialize(fields: Fields): Fields {
  const out: Fields = {};
  for (const [k, v] of Object.entries(fields)) {
    // Error instances stringify to {} — flatten them to useful fields.
    out[k] =
      v instanceof Error ? { name: v.name, message: v.message, stack: v.stack } : v;
  }
  return out;
}

function emit(level: Level, event: string, fields: Fields = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...serialize(fields),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (event: string, fields?: Fields) => emit("info", event, fields),
  warn: (event: string, fields?: Fields) => emit("warn", event, fields),
  error: (event: string, fields?: Fields) => emit("error", event, fields),
};
