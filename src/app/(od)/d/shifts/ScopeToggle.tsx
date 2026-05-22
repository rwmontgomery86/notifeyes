"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ScopeToggle({ licenseState }: { licenseState: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const wz = params.get("wz") === "1";

  function setWz(next: boolean) {
    const sp = new URLSearchParams(params);
    if (next) sp.set("wz", "1");
    else sp.delete("wz");
    const qs = sp.toString();
    router.push(qs ? `/d/shifts?${qs}` : "/d/shifts");
  }

  const stateLabel = licenseState ? `My state (${licenseState})` : "My state";

  return (
    <div
      role="tablist"
      aria-label="Shift scope"
      className="inline-flex items-center rounded-md border bg-background p-0.5 text-sm"
    >
      <button
        type="button"
        role="tab"
        aria-selected={!wz}
        onClick={() => setWz(false)}
        className={`px-3 py-1 rounded ${!wz ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        {stateLabel}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={wz}
        onClick={() => setWz(true)}
        className={`px-3 py-1 rounded ${wz ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        My watch zones
      </button>
    </div>
  );
}
