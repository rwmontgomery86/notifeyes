import type { ReactNode } from "react";

/*
 * Realistic marketing laptop shell — dark bezel, camera dot, base deck.
 * Decorative only, like PhoneFrame: render product mocks inside with
 * spans, never focusable elements.
 */
export function LaptopFrame({
  children,
  className = "",
  screenClassName = "",
}: {
  children: ReactNode;
  className?: string;
  screenClassName?: string;
}) {
  return (
    <div aria-hidden="true" className={`relative ${className}`}>
      {/* screen bezel */}
      <div className="relative rounded-[18px] rounded-b-none bg-[#111a2e] px-[10px] pb-[10px] pt-[16px] shadow-[0_36px_80px_-24px_rgba(27,42,78,0.5)]">
        {/* camera dot */}
        <span className="absolute left-1/2 top-[7px] h-[4px] w-[4px] -translate-x-1/2 rounded-full bg-[#2a3550]" />
        <div
          className={`relative overflow-hidden rounded-[8px] ${screenClassName || "bg-paper-card"}`}
        >
          {children}
        </div>
      </div>
      {/* base deck */}
      <div className="relative mx-[-4%] h-[16px] rounded-b-[14px] bg-[#233150]">
        <span className="absolute inset-x-0 top-0 h-[3px] bg-[#2a3550]" />
        {/* thumb scoop */}
        <span className="absolute left-1/2 top-0 h-[6px] w-[76px] -translate-x-1/2 rounded-b-[8px] bg-[#111a2e]" />
      </div>
    </div>
  );
}
