import { isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { practices } from "@/db/schema";
import { GeocodeBackfillButton } from "./BackfillButton";

export const metadata = { title: "Geocode backfill · NotifEyes admin" };
export const dynamic = "force-dynamic";

export default async function GeocodeBackfillPage() {
  const missing = await db
    .select({
      id: practices.id,
      name: practices.name,
      addressLine: practices.addressLine,
      city: practices.city,
      state: practices.state,
      zip: practices.zip,
    })
    .from(practices)
    .where(isNull(practices.location))
    .limit(200);

  return (
    <div>
      <h1 className="text-2xl font-bold">Geocode backfill</h1>
      <p className="mt-1 text-muted-foreground">
        Practices without a geocoded location can&apos;t be matched against
        watch zones. Re-run the geocoder over these rows. V1 uses Nominatim
        (free, rate-limited to ~1 request/sec).
      </p>

      <div className="mt-6 ne-card">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <strong>{missing.length}</strong>{" "}
            {missing.length === 1 ? "practice is" : "practices are"} missing a
            location.
          </div>
          {missing.length > 0 ? <GeocodeBackfillButton /> : null}
        </div>
      </div>

      {missing.length === 0 ? null : (
        <ul className="mt-6 space-y-2">
          {missing.map((p) => (
            <li key={p.id} className="ne-card">
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">
                {p.addressLine ?? "—"}, {p.city ?? "—"}, {p.state ?? "—"}{" "}
                {p.zip ?? ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
