import { Chip } from "./Chip";

type ShiftCard = {
  clinic: string;
  when: string;
  rate: string;
  distance: string;
  match: boolean;
};

const SHIFTS: ShiftCard[] = [
  { clinic: "Marina Eye", when: "Tue Jun 02 · 9–5", rate: "$95/hr", distance: "2.1 mi", match: true },
  { clinic: "Glen Park Vision", when: "Fri Jun 05 · 9–1", rate: "$120/hr", distance: "0.8 mi", match: false },
  { clinic: "Inner Sunset OD", when: "Wed Jun 03 · 12–8", rate: "$110/hr", distance: "6.4 mi", match: false },
];

export function PhonePreview() {
  return (
    <div className="mx-auto w-[280px] rounded-[28px] bg-[#16223e] p-2 shadow-[0_30px_60px_-20px_rgba(27,42,78,0.25)]">
      <div className="relative h-[520px] overflow-hidden rounded-[22px] bg-paper-card px-4 py-5">
        <div className="mb-3.5 flex justify-between text-[11px] font-semibold text-ink">
          <span>9:41</span>
          <span>● ● ● ●</span>
        </div>

        <div className="mb-3.5 flex items-center justify-between">
          <h4 className="font-display text-[22px] text-ink">Open shifts</h4>
          <Chip variant="sage">3 in zone</Chip>
        </div>
        <div className="mb-2 font-mono text-xs text-ink-3">
          Watch zone · SF Mission + Soma
        </div>

        {SHIFTS.map((s, i) => (
          <div
            key={i}
            className={`mb-2 rounded-lg border p-3 ${
              s.match
                ? "bg-rust-soft border-[#a8d5f0]"
                : "bg-paper border-rule"
            }`}
          >
            {s.match && (
              <div className="mb-1.5 inline-flex">
                <Chip variant="accent" className="!text-[10px] !px-2 !py-0.5">
                  matched your zone · 8 min ago
                </Chip>
              </div>
            )}
            <div className="flex justify-between">
              <strong className="text-[13px] text-ink">{s.clinic}</strong>
              <span className="text-xs text-ink-3">{s.distance}</span>
            </div>
            <div className="text-xs text-ink-2">{s.when}</div>
            <div className="mt-1.5 flex items-center justify-between">
              <Chip variant="accent" className="!text-[11px]">
                {s.rate}
              </Chip>
              {s.match && (
                <span className="rounded-full bg-rust px-2.5 py-1 text-[11px] font-medium text-white">
                  Apply
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
