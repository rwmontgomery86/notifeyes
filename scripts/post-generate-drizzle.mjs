#!/usr/bin/env node
/**
 * Post-process drizzle-kit generated SQL to fix PostGIS type quoting.
 *
 * drizzle-kit wraps custom type names in double quotes when emitting DDL.
 * For PostGIS parametric types like `geography(Point, 4326)`, those quotes
 * turn the type expression into an unknown identifier and Postgres throws:
 *
 *   type "geography(Point, 4326)" does not exist
 *
 * This script reads every .sql file in ./drizzle and rewrites the quoted
 * geography types to their unquoted form. Idempotent — running it twice
 * does nothing on the second pass.
 *
 * Wired into the `db:generate` npm script so it runs every time you
 * regenerate schema migrations.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "drizzle");

// Patterns to strip: anything like  "geography(...)"  becomes  geography(...).
// We're permissive on the inner argument list to catch future PostGIS types
// like geography(Polygon,4326) or geometry(LineString,4326).
const replacers = [
  {
    re: /"geography\(([^)]*)\)"/g,
    to: (_match, inner) => `geography(${inner})`,
  },
  {
    re: /"geometry\(([^)]*)\)"/g,
    to: (_match, inner) => `geometry(${inner})`,
  },
];

let filesChanged = 0;
let entries;
try {
  entries = readdirSync(dir);
} catch (err) {
  if (err.code === "ENOENT") {
    console.log("[post-generate-drizzle] no drizzle/ directory yet, skipping");
    process.exit(0);
  }
  throw err;
}

for (const name of entries) {
  if (!name.endsWith(".sql")) continue;
  const path = join(dir, name);
  const before = readFileSync(path, "utf8");
  let after = before;
  for (const { re, to } of replacers) {
    after = after.replace(re, to);
  }
  if (after !== before) {
    writeFileSync(path, after);
    filesChanged++;
    console.log(`[post-generate-drizzle] patched ${name}`);
  }
}

if (filesChanged === 0) {
  console.log("[post-generate-drizzle] no changes needed");
}
