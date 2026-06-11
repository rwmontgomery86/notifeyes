"use client";

import { ContourArt } from "@/components/ContourArt";
import { MockContent } from "../MockContent";
import { NAV_ITEMS, type ShellVariantProps } from "./shared";

/**
 * V3 "Floating panel". The boldest direction: the sidebar is a big-radius
 * navy panel floating inset from the viewport edge with a soft shadow and a
 * cyan glow rising from its base. Active item is a solid cyan pill. Top bar
 * floats as its own card.
 */
export function FloatingPanel({ active, onNavClick, interactive }: ShellVariantProps) {
  return (
    <div className="flex h-full gap-4 bg-paper p-4 font-sans">
      <aside className="relative flex w-[232px] shrink-0 flex-col overflow-hidden rounded-[20px] bg-paper-deep text-white shadow-[0_24px_60px_-24px_rgba(27,42,78,0.45)]">
        <div className="flex items-center gap-2.5 px-5 pb-4 pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/notifeyes-mark.png" alt="" className="h-7 w-7" />
          <span className="text-sm font-semibold">
            Notif<span className="text-rust">Eyes</span>
          </span>
        </div>

        <nav className="mt-2 flex flex-1 flex-col gap-1.5 px-3">
          {NAV_ITEMS.map((item, i) => {
            const isActive = i === active;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavClick(i)}
                tabIndex={interactive ? 0 : -1}
                className={`flex h-10 items-center justify-between rounded-full px-4 text-sm transition-[background-color,color,transform] duration-150 active:scale-[0.98] ${
                  isActive
                    ? "bg-rust font-medium text-white shadow-[0_8px_20px_-8px_rgba(30,155,227,0.7)]"
                    : "text-[#9fb0d0] hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span
                    className={`ml-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold leading-none ${
                      isActive ? "bg-white text-rust-2" : "bg-rust text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Cyan glow rising from the panel base, clipped by the rounded panel. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-1/2 h-48 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(30,155,227,0.32),transparent)] blur-2xl"
        />
        <ContourArt
          className="absolute inset-x-0 bottom-0 h-44 text-white"
          opacity={0.12}
        />
        <div className="relative z-10 flex items-center gap-3 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,255,255,0.12)] text-xs font-semibold text-white">
            MP
          </span>
          <div className="text-xs">
            <div className="font-medium text-white">Dr. Maya Patel</div>
            <div className="text-[#9fb0d0]">Optometrist</div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex h-14 shrink-0 items-center gap-4 rounded-2xl border border-rule bg-paper-card px-5">
          <div className="flex items-center gap-2.5 text-sm text-ink-3">
            <SearchIcon />
            <span>Search shifts, practices…</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-paper text-ink-2">
              <BellIcon />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rust" />
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rust-soft text-xs font-semibold text-rust-2">
              MP
            </span>
          </div>
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto rounded-2xl">
          <MockContent radius="rounded-xl" />
        </main>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 9a6 6 0 0 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9" />
      <path d="M10.3 20a2 2 0 0 0 3.4 0" />
    </svg>
  );
}
