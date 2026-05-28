import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "@/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pool?: pg.Pool;
  listenPool?: pg.Pool;
};

// Main query pool — every Drizzle query + `pg_notify` (a single statement, so
// transaction pooling is fine). In prod this is routed through the Supabase
// transaction pooler (DATABASE_URL_POOLED, port 6543), which multiplexes many
// serverless clients onto a few Postgres backends so we don't exhaust the
// session-pooler / max_connections ceiling. Falls back to DATABASE_URL when no
// pooled URL is set (local dev, the worker).
export const pool =
  globalForDb.pool ??
  new pg.Pool({
    connectionString: env.DATABASE_URL_POOLED ?? env.DATABASE_URL,
    max: 5,
  });

// Dedicated session-mode pool. Only for connections that need a persistent
// session: the SSE `LISTEN notification_inserted` relay. MUST use DATABASE_URL
// (session pooler / direct connection) — transaction pooling does not support
// LISTEN. Kept small; each connection is held open for a client stream's life.
export const listenPool =
  globalForDb.listenPool ??
  new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: 4,
  });

if (env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
  globalForDb.listenPool = listenPool;
}

export const db = drizzle(pool, { schema });

export * as s from "./schema";
