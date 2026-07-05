import type { ReactNode } from "react";

/*
 * Realistic marketing device shell — dark bezel, dynamic island, status bar.
 * Decorative only: render product mocks inside with spans, never focusable
 * elements. `dark` flips the status bar glyphs for dark screen content.
 */
export function PhoneFrame({
  children,
  dark = false,
  className = "",
  screenClassName = "",
}: {
  children: ReactNode;
  dark?: boolean;
  className?: string;
  screenClassName?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative rounded-[46px] bg-[#111a2e] p-[10px] shadow-[0_36px_80px_-24px_rgba(27,42,78,0.5)] ${className}`}
    >
      {/* side buttons */}
      <span className="absolute -left-[2px] top-[104px] h-7 w-[3px] rounded-l-full bg-[#2a3550]" />
      <span className="absolute -left-[2px] top-[148px] h-11 w-[3px] rounded-l-full bg-[#2a3550]" />
      <span className="absolute -right-[2px] top-[124px] h-14 w-[3px] rounded-r-full bg-[#2a3550]" />

      <div
        className={`relative flex h-full flex-col overflow-hidden rounded-[37px] ${screenClassName || "bg-paper-card"}`}
      >
        <StatusBar dark={dark} />
        {children}
      </div>
    </div>
  );
}

function StatusBar({ dark }: { dark: boolean }) {
  const tone = dark ? "text-white" : "text-ink";
  return (
    <div className={`relative flex items-center justify-between px-6 pb-1 pt-3 ${tone}`}>
      <span className="text-[13px] font-semibold tracking-[0.01em]">9:41</span>

      {/* dynamic island */}
      <span className="absolute left-1/2 top-[10px] h-[24px] w-[80px] -translate-x-1/2 rounded-full bg-[#111a2e]" />

      <span className="flex items-center gap-1.5">
        {/* signal */}
        <svg viewBox="0 0 16 12" className="h-[11px] w-[15px]" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="0.75" />
          <rect x="4.3" y="5.5" width="3" height="6.5" rx="0.75" />
          <rect x="8.6" y="3" width="3" height="9" rx="0.75" />
          <rect x="12.9" y="0.5" width="3" height="11.5" rx="0.75" />
        </svg>
        {/* wifi */}
        <svg
          viewBox="0 0 24 24"
          className="h-[12px] w-[14px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
        {/* battery */}
        <svg viewBox="0 0 27 12" className="h-[11px] w-[25px]">
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="11"
            rx="3"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.4"
          />
          <rect x="2.5" y="2.5" width="15" height="7" rx="1.5" fill="currentColor" />
          <path d="M24.5 4v4a2.2 2.2 0 0 0 0-4z" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </span>
    </div>
  );
}
