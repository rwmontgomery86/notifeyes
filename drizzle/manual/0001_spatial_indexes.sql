-- PostGIS spatial indexes. drizzle-kit doesn't generate GIST syntax, so these
-- live in a hand-written migration that the migrate runner applies after the
-- main drizzle migrations.

CREATE INDEX IF NOT EXISTS watch_zones_geom_gix
  ON watch_zones USING GIST (geometry);

CREATE INDEX IF NOT EXISTS practices_location_gix
  ON practices USING GIST (location);

CREATE INDEX IF NOT EXISTS ods_home_location_gix
  ON optometrists USING GIST (home_location);
