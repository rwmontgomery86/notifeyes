"use client";

import s from "../shells.module.css";
import { ContourArt } from "@/components/ContourArt";
import { MockContent } from "../MockContent";
import { NAV_ITEMS, type ShellVariantProps } from "./shared";

// Indicator travel per nav row. MUST equal the button box: h-9 (36px) plus
// mb-1 (4px). The .slider height in shells.module.css is the matching 36px.
const STEP = 40;

/**
 * V2 "Crisp rail". The Linear-leaning direction: slim navy rail, tight type,
 * and a single tinted indicator that slides between rows on selection. No
 * top bar; unread badges live in the rail like the current app.
 */
export function CrispRail({ active, onNavClick, interactive }: ShellVariantProps) {
  return (
    <div className="flex h-full bg-paper font-sans">
      <aside className="relative flex w-[190px] shrink-0 flex-col bg-paper-deep text-white">
        <div className="flex items-center gap-2 px-4 pb-3 pt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/notifeyes-mark.png" alt="" className="h-6 w-6" />
          <span className="text-[13px] font-semibold">
            Notif<span className="text-rust">Eyes</span>
          </span>
        </div>

        <nav className="relative mt-2 flex-1 px-2">
          <span
            aria-hidden
            className={s.slider}
            style={{ transform: `translateY(${active * STEP}px)` }}
          />
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavClick(i)}
              tabIndex={interactive ? 0 : -1}
              className={`relative z-10 mb-1 flex h-9 w-full items-center justify-between rounded-md px-3 text-[13px] transition-colors duration-150 ${
                i === active
                  ? "font-medium text-white"
                  : "text-[#9fb0d0] hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              {item.badge ? (
                <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rust px-1 text-[10px] font-semibold leading-none text-white">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <ContourArt
          className="absolute inset-x-0 bottom-0 h-36 text-white"
          opacity={0.04}
        />
        <div className="relative z-10 px-4 py-4 text-xs">
          <div className="font-medium text-white">Dr. Maya Patel</div>
          <div className="mt-0.5 text-[#9fb0d0]">Optometrist · Sign out</div>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <MockContent radius="rounded-lg" dense />
      </main>
    </div>
  );
}
