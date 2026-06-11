import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { optometrists, users, watchZones } from "@/db/schema";
import { capitalForState } from "@/lib/geo/state-capitals";
import { hasAnyNotificationChannel } from "@/lib/notifications/optIn";
import { BayAreaQuickStart } from "./BayAreaQuickStart";
import { WatchZoneEditor } from "./WatchZoneEditor";
import { WatchZoneList } from "./WatchZoneList";

export const metadata = { title: "Watch zones · NotifEyes" };
export const dynamic = "force-dynamic";

export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await auth();
  const odId = session!.user.odId!;
  const sp = await searchParams;

  const [me] = await db
    .select({ licenseState: optometrists.licenseState })
    .from(optometrists)
    .where(eq(optometrists.id, odId))
    .limit(1);
  const capital = capitalForState(me?.licenseState);
  const initialCenter: [number, number] | undefined = capital
    ? [capital.lat, capital.lng]
    : undefined;

  const [u] = await db
    .select({
      email: users.email,
      phone: users.phone,
      emailOptedIn: users.emailOptedIn,
      smsOptedIn: users.smsOptedIn,
      marketingOptedIn: users.marketingOptedIn,
    })
    .from(users)
    .where(eq(users.id, session!.user.id))
    .limit(1);
  const optInOk = !!u && hasAnyNotificationChannel(u);
  const smsOptInEnabled = !!(u && u.smsOptedIn && u.phone);

  const zones = await db
    .select()
    .from(watchZones)
    .where(eq(watchZones.odId, odId))
    .orderBy(desc(watchZones.createdAt));

  // Serialize geometryMeta for client (Drizzle returns it as parsed object already)
  const zonesForClient = zones.map((z) => ({
    id: z.id,
    name: z.name,
    shape: z.shape,
    geometryMeta: z.geometryMeta,
    daysOfWeek: z.daysOfWeek,
    minRateCents: z.minRateCents,
    shiftTypes: z.shiftTypes,
    notifyChannels: z.notifyChannels,
    paused: z.paused,
  }));

  // ?edit=<zoneId> loads that zone into the editor. zonesForClient is already
  // scoped to this OD, so an id belonging to someone else simply finds nothing
  // (the update action re-checks ownership on write regardless).
  const editZone = sp.edit
    ? zonesForClient.find((z) => z.id === sp.edit) ?? null
    : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Watch zones</h1>
          <p className="mt-1 text-muted-foreground">
            Draw the area you&apos;ll travel to and we&apos;ll ping you the
            moment a matching shift posts.
          </p>
        </div>
      </div>

      {optInOk ? null : (
        <div className="mt-6 rounded-md border border-amber-500/40 bg-amber-100/60 px-4 py-3 text-sm text-amber-900">
          <strong className="font-semibold">Enable notifications first.</strong>{" "}
          You need at least one notification channel (email or SMS) opted in
          before you can create a watch zone — otherwise we can&apos;t reach
          you when a matching shift posts.{" "}
          <Link href="/d/profile" className="underline font-medium">
            Set it up in your profile →
          </Link>
        </div>
      )}

      {zones.length === 0 ? (
        <div className="mt-6">
          <BayAreaQuickStart disabled={!optInOk} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="ne-card p-0 overflow-hidden">
          {/* key remounts the editor per edit target so all state reseeds */}
          <WatchZoneEditor
            key={editZone?.id ?? "new"}
            initialCenter={initialCenter}
            disabled={!optInOk}
            smsOptInEnabled={smsOptInEnabled}
            editZone={editZone ?? undefined}
          />
        </div>
        <WatchZoneList zones={zonesForClient} editingId={editZone?.id} />
      </div>
    </div>
  );
}
