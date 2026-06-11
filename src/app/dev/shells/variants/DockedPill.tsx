"use client";

import s from "../shells.module.css";
import { ContourArt } from "@/components/ContourArt";
import { MockContent } from "../MockContent";
import { NAV_ITEMS, type ShellVariantProps } from "./shared";

/**
 * V1 "Docked pill". The screenshot-faithful direction: deep navy sidebar,
 * and the active nav item is a paper-colored pill that merges into the
 * content area with scooped inverted corners. Top bar with search, bell,
 * avatar. Friendliest card rounding.
 */
export function DockedPill({ active, onNavClick, interactive }: ShellVariantProps) {
  return (
    <div className="flex h-full bg-paper font-sans">
      <aside className="relative flex w-[240px] shrink-0 flex-col bg-paper-deep text-white">
        <div className="flex items-center gap-2.5 px-6 pb-4 pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/notifeyes-mark.png" alt="" className="h-7 w-7" />
          <span className="text-sm font-semibold">
            Notif<span className="text-rust">Eyes</span>
          </span>
        </div>

        <nav className="mt-3 flex flex-1 flex-col gap-1 pl-3">
          {NAV_ITEMS.map((item, i) => {
            const isActive = i === active;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavClick(i)}
                tabIndex={interactive ? 0 : -1}
                className={`flex h-10 items-center justify-between px-4 text-sm ${
                  s.dockItem
                } ${isActive ? s.dockActive : "text-[#9fb0d0] hover:text-white"}`}
              >
                <span className={isActive ? "font-medium" : undefined}>
                  {item.label}
                </span>
                {item.badge ? (
                  <span className="ml-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rust px-1.5 text-[10px] font-semibold leading-none text-white">
                    {item.badge}
                  </span>
                ) : null}
                {isActive ? (
                  <>
                    <span aria-hidden className={s.scoopTop} />
                    <span aria-hidden className={s.scoopBottom} />
                  </>
                ) : null}
              </button>
            );
          })}
        </nav>

        <ContourArt
          className="absolute inset-x-0 bottom-0 h-44 text-white"
          opacity={0.1}
        />
        <div className="relative z-10 flex items-center gap-3 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rust text-xs font-semibold text-white">
            MP
          </span>
          <div className="text-xs">
            <div className="font-medium text-white">Dr. Maya Patel</div>
            <div className="text-[#9fb0d0]">Optometrist</div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 shrink-0 items-center gap-4 px-8">
          {/* Decorative search: a div, not an input, so the gallery's number
              keys never fight a focused field. */}
          <div className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-full border border-rule bg-paper-card px-4 text-sm text-ink-3">
            <SearchIcon />
            <span>Search shifts, practices…</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-rule bg-paper-card text-ink-2">
              <BellIcon />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rust" />
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rust-soft text-xs font-semibold text-rust-2">
              MP
            </span>
          </div>
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto">
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
