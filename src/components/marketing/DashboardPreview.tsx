export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-rule bg-paper-card shadow-[0_20px_50px_-20px_rgba(27,42,78,0.18)]">
      <div className="flex items-center gap-3.5 border-b border-rule bg-paper px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e8584c]" />
          <span className="h-2.5 w-2.5 rounded-full bg-gold" />
          <span className="h-2.5 w-2.5 rounded-full bg-sage" />
        </div>
        <div className="font-mono text-xs text-ink-3">
          app.notifeyes.com/p/dashboard
        </div>
      </div>

      <div className="grid min-h-[380px] grid-cols-[140px_1fr]">
        <aside className="border-r border-rule bg-paper p-3.5">
          <div className="mb-2 font-mono text-xs text-ink-3">Marina Eye Group</div>
          {[
            "Dashboard",
            "Open shifts",
            "Applicants",
            "Calendar",
            "Roster",
            "Messages",
            "Reviews",
            "Billing",
          ].map((item, i) => (
            <div
              key={item}
              className={`mb-0.5 rounded px-2 py-1.5 text-xs ${
                i === 0
                  ? "bg-rust-soft text-rust-2 font-medium"
                  : "text-ink-2"
              }`}
            >
              {item}
            </div>
          ))}
        </aside>

        <main className="p-[18px]">
          <div className="mb-3.5 flex items-start justify-between">
            <div>
              <h4 className="font-display text-xl text-ink">This week</h4>
              <div className="text-xs text-ink-3">Jun 02 — Jun 08</div>
            </div>
            <span className="rounded-full bg-rust px-3 py-1 text-[11px] font-medium text-white">
              + Post shift
            </span>
          </div>

          <div className="mb-3.5 grid grid-cols-7 gap-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-center text-xs text-ink-3">
                {d}
              </div>
            ))}
            {[2, 3, 4, 5, 6, 7, 8].map((day, i) => {
              const filled = i === 0 || i === 2;
              const open = i === 1 || i === 4;
              const bg = filled
                ? "bg-sage-soft border-[#a8d8af]"
                : open
                  ? "bg-rust-soft border-[#a8d5f0]"
                  : "bg-paper border-rule";
              return (
                <div
                  key={i}
                  className={`relative h-16 rounded border p-1 text-[10px] text-ink-2 ${bg}`}
                >
                  <div className="font-mono text-[10px] text-ink-3">{day}</div>
                  {filled && (
                    <div className="absolute bottom-1 left-1 right-1 rounded-sm bg-sage py-0.5 text-center text-[9px] font-semibold text-white">
                      Dr. Lin
                    </div>
                  )}
                  {open && (
                    <div className="absolute bottom-1 left-1 right-1 rounded-sm bg-rust py-0.5 text-center text-[9px] font-semibold text-white">
                      4 apps
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mb-1.5 font-mono text-xs text-ink-3">Activity</div>
          <div className="flex flex-col gap-1.5">
            {[
              ["8 min", "Dr. Lin applied to Wed Jun 04 shift"],
              ["1 hr", "Tue Jun 02 confirmed · Dr. Singh"],
              ["3 hr", "New shift posted · Fri Jun 06 half-day"],
            ].map(([t, msg], i) => (
              <div
                key={i}
                className={`grid grid-cols-[50px_1fr] py-1 text-xs ${
                  i === 2 ? "" : "border-b border-dashed border-rule"
                }`}
              >
                <span className="font-mono text-xs text-ink-3">{t}</span>
                <span className="text-ink-2">{msg}</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
