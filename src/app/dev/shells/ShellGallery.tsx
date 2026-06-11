"use client";

import { useEffect, useState } from "react";
import s from "./shells.module.css";
import { DockedPill } from "./variants/DockedPill";
import { CrispRail } from "./variants/CrispRail";
import { FloatingPanel } from "./variants/FloatingPanel";
import type { ShellVariantProps } from "./variants/shared";

type VariantIndex = 0 | 1 | 2;
type Mode = "grid" | VariantIndex;

const VARIANTS: {
  name: string;
  blurb: string;
  Component: (props: ShellVariantProps) => React.JSX.Element;
}[] = [
  {
    name: "Docked pill",
    blurb: "The active item merges into the page with scooped corners. Top bar, friendliest rounding.",
    Component: DockedPill,
  },
  {
    name: "Crisp rail",
    blurb: "Slim and understated. A tinted indicator slides between rows. Badges stay in the rail.",
    Component: CrispRail,
  },
  {
    name: "Floating panel",
    blurb: "The sidebar floats as a rounded panel with a cyan glow. Solid cyan active pill.",
    Component: FloatingPanel,
  },
];

export function ShellGallery() {
  const [mode, setMode] = useState<Mode>("grid");
  // Per-variant active nav index, preserved while flipping between variants.
  const [actives, setActives] = useState<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "1" || e.key === "2" || e.key === "3") {
        setMode((Number(e.key) - 1) as VariantIndex);
      } else if (e.key === "Escape") {
        setMode("grid");
      } else if (mode !== "grid" && e.key === "ArrowRight") {
        setMode(((mode + 1) % 3) as VariantIndex);
      } else if (mode !== "grid" && e.key === "ArrowLeft") {
        setMode(((mode + 2) % 3) as VariantIndex);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  function setActiveFor(variant: VariantIndex, navIndex: number) {
    setActives((prev) => {
      const next: [number, number, number] = [...prev];
      next[variant] = navIndex;
      return next;
    });
  }

  if (mode !== "grid") {
    const { Component } = VARIANTS[mode];
    return (
      <div className="fixed inset-0 z-50 bg-paper">
        <Component
          active={actives[mode]}
          onNavClick={(n) => setActiveFor(mode, n)}
          interactive
        />

        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[rgba(27,42,78,0.92)] p-1.5 text-white shadow-xl backdrop-blur">
          <button
            type="button"
            onClick={() => setMode("grid")}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-[#9fb0d0] transition-colors hover:text-white"
          >
            ← All
          </button>
          <span className="h-4 w-px bg-[rgba(255,255,255,0.2)]" />
          <button
            type="button"
            onClick={() => setMode(((mode + 2) % 3) as VariantIndex)}
            aria-label="Previous variant"
            className="rounded-full px-2 py-1.5 text-xs text-[#9fb0d0] transition-colors hover:text-white"
          >
            ◀
          </button>
          {VARIANTS.map((v, i) => (
            <button
              key={v.name}
              type="button"
              onClick={() => setMode(i as VariantIndex)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                i === mode
                  ? "bg-rust text-white"
                  : "text-[#9fb0d0] hover:text-white"
              }`}
            >
              {i + 1} · {v.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMode(((mode + 1) % 3) as VariantIndex)}
            aria-label="Next variant"
            className="rounded-full px-2 py-1.5 text-xs text-[#9fb0d0] transition-colors hover:text-white"
          >
            ▶
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper px-8 py-10">
      <header className="max-w-wide">
        <h1 className="font-display text-2xl font-bold text-ink">
          Shell gallery · pick a direction
        </h1>
        <p className="mt-1 text-sm text-ink-2">
          Three candidate dashboard shells, same mock content. Click a card to
          go fullscreen, or press 1, 2, 3. Arrows flip between variants, Esc
          returns. Inside a variant, click the menu items to feel the active
          state.
        </p>
      </header>

      <div className="mt-8 flex gap-6 overflow-x-auto pb-4">
        {VARIANTS.map((v, i) => (
          <div key={v.name} className="shrink-0">
            <div className={s.previewBox}>
              <div className={s.previewScaler} aria-hidden>
                <v.Component
                  active={actives[i]}
                  onNavClick={() => {}}
                  interactive={false}
                />
              </div>
              <button
                type="button"
                onClick={() => setMode(i as VariantIndex)}
                className="absolute inset-0 z-10 cursor-zoom-in rounded-[inherit]"
                aria-label={`Open ${v.name} fullscreen`}
              />
            </div>
            <div className="mt-3 w-[420px]">
              <div className="text-sm font-semibold text-ink">
                V{i + 1} · {v.name}
              </div>
              <p className="mt-0.5 text-xs text-ink-2">{v.blurb}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
