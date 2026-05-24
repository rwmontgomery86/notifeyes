import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { optometrists, watchZones } from "@/db/schema";
import { capitalForState } from "@/lib/geo/state-capitals";
import { WatchZoneEditor } from "./WatchZoneEditor";
import { WatchZoneList } from "./WatchZoneList";

export const metadata = { title: "Watch zones · NotifEyes" };
export const dynamic = "force-dynamic";

export default async function WatchPage() {
  const session = await auth();
  const odId = session!.user.odId!;

  const [me] = await db
    .select({ licenseState: optometrists.licenseState })
    .from(optometrists)
    .where(eq(optometrists.id, odId))
    .limit(1);
  const capital = capitalForState(me?.licenseState);
  const initialCenter: [number, number] | undefined = capital
    ? [capital.lat, capital.lng]
    : undefined;

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
    timeStart: z.timeStart,
    timeEnd: z.timeEnd,
    minRateCents: z.minRateCents,
    shiftTypes: z.shiftTypes,
    notifyChannels: z.notifyChannels,
    paused: z.paused,
  }));

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

      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="ne-card p-0 overflow-hidden">
          <WatchZoneEditor initialCenter={initialCenter} />
        </div>
        <WatchZoneList zones={zonesForClient} />
      </div>
    </div>
  );
}
