"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteWatchZone, toggleWatchZonePaused } from "./actions";

type ZoneItem = {
  id: string;
  name: string;
  shape: "circle" | "polygon";
  geometryMeta:
    | { kind: "circle"; centerLat: number; centerLng: number; radiusMeters: number }
    | { kind: "polygon"; points: { lat: number; lng: number }[] };
  daysOfWeek: number[];
  timeStart: string | null;
  timeEnd: string | null;
  minRateCents: number;
  shiftTypes: string[];
  notifyChannels: ("push" | "email" | "sms")[];
  paused: boolean;
};

export function WatchZoneList({ zones }: { zones: ZoneItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle(zoneId: string, paused: boolean) {
    startTransition(async () => {
      await toggleWatchZonePaused(zoneId, !paused);
      router.refresh();
    });
  }

  function remove(zoneId: string) {
    if (!confirm("Delete this zone?")) return;
    startTransition(async () => {
      await deleteWatchZone(zoneId);
      router.refresh();
    });
  }

  if (zones.length === 0) {
    return (
      <div className="ne-card text-sm text-muted-foreground">
        No zones yet. Draw one on the map to start receiving alerts.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {zones.map((z) => (
        <li key={z.id} className="ne-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{z.name}</span>
                {z.paused ? (
                  <span className="ne-pill bg-amber-100/60 text-amber-900 border-amber-500/40">
                    Paused
                  </span>
                ) : (
                  <span className="ne-pill bg-green-100/60 text-green-900 border-green-500/40">
                    Active
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1 capitalize">
                {z.shape}
                {z.geometryMeta.kind === "circle"
                  ? ` · ~${(z.geometryMeta.radiusMeters / 1609.34).toFixed(1)} mi radius`
                  : ` · ${z.geometryMeta.points.length}-sided`}
                {" · min "}${(z.minRateCents / 100).toFixed(0)}/hr
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Channels: {z.notifyChannels.join(" · ")}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => toggle(z.id, z.paused)}
                disabled={pending}
                className="ne-btn-ghost h-7 px-2 text-xs"
              >
                {z.paused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={() => remove(z.id)}
                disabled={pending}
                className="ne-btn-ghost h-7 px-2 text-xs text-destructive"
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
