"use client";

import { useState } from "react";

export type HelpCategory = {
  h: string;
  qs: { q: string; a: string }[];
};

export function HelpClient({ categories }: { categories: HelpCategory[] }) {
  const [active, setActive] = useState(0);
  const current = categories[active]!;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">
      <aside>
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-rust">
          Topics
        </div>
        <nav className="flex flex-col gap-0.5">
          {categories.map((c, i) => (
            <button
              key={c.h}
              onClick={() => setActive(i)}
              className={`rounded text-left px-3 py-2 text-sm transition-colors ${
                i === active
                  ? "bg-rust-soft text-rust-2 font-medium"
                  : "text-ink-2 hover:text-ink hover:bg-paper-2"
              }`}
            >
              {c.h}
            </button>
          ))}
        </nav>
        <hr className="my-7 border-t border-rule" />
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-rust">
          Resources
        </div>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm text-ink-2">
          <li>Onboarding videos</li>
          <li>Policies</li>
          <li className="flex items-center gap-1.5">
            API docs
            <span className="rounded-full border border-[#a8d8af] bg-sage-soft px-2 py-0.5 text-[10px] text-sage">
              soon
            </span>
          </li>
          <li>System status</li>
        </ul>
      </aside>

      <div>
        <h2
          className="font-display border-b border-ink pb-2.5 mb-2 text-[40px] font-medium text-ink"
        >
          {current.h}
        </h2>
        <div className="flex flex-col">
          {current.qs.map((f, i) => (
            <details
              key={f.q}
              className="border-b border-rule py-5 [&_summary::-webkit-details-marker]:hidden"
              open={i === 0}
            >
              <summary
                className="flex cursor-pointer items-center justify-between font-display text-[22px] font-medium text-ink"
              >
                <span>{f.q}</span>
                <span className="font-mono text-sm text-ink-3">—</span>
              </summary>
              <p className="mt-3 text-base leading-[1.6] text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
