import PgBoss from "pg-boss";
import { env } from "@/env";

let _boss: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (_boss) return _boss;
  const boss = new PgBoss(env.DATABASE_URL);
  boss.on("error", (err) => console.error("[pg-boss]", err));
  await boss.start();
  _boss = boss;
  return boss;
}
