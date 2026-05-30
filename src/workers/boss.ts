import PgBoss from "pg-boss";
import { env } from "@/env";

let _boss: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (_boss) return _boss;
  // Cap the pg-boss pool at 5. Default is pg's 10, which — stacked with the
  // Drizzle query pool (max 5, also on the session pooler in the worker since
  // DATABASE_URL_POOLED is unset here) — reaches the Supabase Supavisor session
  // pool_size of 15 and trips EMAXCONNSESSION on startup. 5 + 5 = 10 leaves
  // headroom for Vercel's SSE listenPool, which shares the same session budget.
  const boss = new PgBoss({ connectionString: env.DATABASE_URL, max: 5 });
  boss.on("error", (err) => console.error("[pg-boss]", err));
  await boss.start();
  _boss = boss;
  return boss;
}
