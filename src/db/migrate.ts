import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "@/env";

async function main() {
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

  // Ensure PostGIS is installed before any schema work
  await pool.query("CREATE EXTENSION IF NOT EXISTS postgis;");

  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: "./drizzle" });

  // Apply any hand-written SQL in drizzle/manual/*.sql AFTER drizzle migrations.
  // These exist because drizzle-kit can't generate PostGIS GIST indexes.
  try {
    const manualDir = join(process.cwd(), "drizzle", "manual");
    const files = readdirSync(manualDir).filter((f) => f.endsWith(".sql")).sort();
    for (const f of files) {
      const sqlText = readFileSync(join(manualDir, f), "utf8");
      console.log(`[migrate] applying manual ${f}`);
      await pool.query(sqlText);
    }
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code !== "ENOENT") throw err;
  }

  console.log("[migrate] done");
  await pool.end();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
