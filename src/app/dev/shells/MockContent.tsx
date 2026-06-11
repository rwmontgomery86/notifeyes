import { ContourArt } from "@/components/ContourArt";

/**
 * Static, representative OD-dashboard content shared by all three shell
 * variants so the comparison is purely about the shell. No data, no links.
 */

const STATS: { label: string; value: string; tint?: string }[] = [
  { label: "Open shifts near you", value: "12" },
  { label: "Active watch zones", value: "3" },
  { label: "Applications pending", value: "2", tint: "text-gold" },
  { label: "Paid out in June", value: "$2,340", tint: "text-sage" },
];

const SHIFTS: { practice: string; where: string; when: string; rate: string }[] = [
  {
    practice: "Bayview Eye Care",
    where: "San Francisco",
    when: "Fri, Jun 13 · 9:00a to 5:00p",
    rate: "$640/day",
  },
  {
    practice: "Marina Eye Group",
    where: "Oakland",
    when: "Mon, Jun 16 · half day",
    rate: "$340/day",
  },
  {
    practice: "Golden Gate Optometry",
    where: "Daly City",
    when: "Sat, Jun 21 · 10:00a to 4:00p",
    rate: "$590/day",
  },
];

export function MockContent({
  radius = "rounded-lg",
  dense = false,
}: {
  /** Card rounding: rounded-lg for crisp variants, rounded-xl for friendly ones. */
  radius?: "rounded-lg" | "rounded-xl";
  dense?: boolean;
}) {
  const card = `${radius} border border-rule bg-paper-card`;
  return (
    <div className={dense ? "p-6" : "p-8"}>
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">
          Good morning, Dr. Patel
        </h1>
        <p className="mt-1 text-sm text-ink-2">
          Thursday, June 11 · 12 open shifts in your area
        </p>
      </header>

      <div className={`mt-6 grid grid-cols-4 ${dense ? "gap-3" : "gap-4"}`}>
        {STATS.map((s) => (
          <div key={s.label} className={`${card} px-4 py-3.5`}>
            <div className={`text-xl font-semibold ${s.tint ?? "text-ink"}`}>
              {s.value}
            </div>
            <div className="mt-0.5 text-xs text-ink-2">{s.label}</div>
          </div>
        ))}
      </div>

      <div className={`mt-6 grid grid-cols-[3fr_2fr] ${dense ? "gap-3" : "gap-4"}`}>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-3">
            Shifts for you
          </h2>
          <div className="mt-2 flex flex-col gap-2.5">
            {SHIFTS.map((sh) => (
              <div
                key={sh.practice}
                className={`${card} flex items-center justify-between gap-4 px-4 py-3.5`}
              >
                <div>
                  <div className="text-sm font-semibold text-ink">
                    {sh.practice}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-2">
                    {sh.where} · {sh.when}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-ink">{sh.rate}</div>
                  <span className="rounded-full bg-rust px-3.5 py-1.5 text-xs font-medium text-white">
                    Apply
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-3">
            Your watch zones
          </h2>
          <div
            className={`relative mt-2 h-[228px] overflow-hidden ${radius} border border-rule bg-paper-2`}
          >
            <ContourArt
              className="absolute inset-0 text-ink-3"
              opacity={0.5}
            />
            <div className="absolute bottom-3 left-3 rounded-full bg-paper-card px-3 py-1 text-xs font-medium text-ink-2 shadow-sm">
              SF Bay · 50 mi radius
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
