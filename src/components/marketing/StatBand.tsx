import type { ReactNode } from "react";

export type Stat = {
  icon: ReactNode;
  n: string;
  l: string;
};

/* White rounded band of icon + big-number stats — the homepage hero pattern,
   shared so other marketing pages (pricing) stay visually identical. */
export function StatBand({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-y-6 rounded-2xl border border-rule bg-paper-card px-2 py-6 shadow-[0_2px_8px_rgba(27,42,78,0.06)] lg:grid-cols-4 lg:gap-y-0 lg:divide-x lg:divide-rule lg:py-7">
      {stats.map((s) => (
        <div key={s.l} className="flex items-center gap-3 px-4 lg:gap-3.5 lg:px-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(30,155,227,0.35)] bg-rust-soft text-rust lg:h-11 lg:w-11">
            {s.icon}
          </span>
          <div>
            <div className="font-display whitespace-nowrap text-[24px] font-medium leading-none tracking-[-0.02em] text-ink lg:text-[30px]">
              {s.n}
            </div>
            <div className="mt-1 text-[12.5px] leading-snug text-ink-2">
              {s.l}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
