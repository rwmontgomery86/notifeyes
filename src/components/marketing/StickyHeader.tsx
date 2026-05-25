"use client";

import { useEffect, useRef, useState } from "react";

export function StickyHeader({ children }: { children: React.ReactNode }) {
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-theme="dark"]'),
    );

    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 8);
      const headerBottom = header.getBoundingClientRect().bottom;
      const inDark = sections.some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= headerBottom && r.bottom >= headerBottom;
      });
      setDark(inDark);
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      data-dark={dark || undefined}
      className={`group sticky top-0 z-50 backdrop-blur transition-[background-color,box-shadow,border-color] duration-200 ${
        dark
          ? "bg-[rgb(27_42_78_/_0.88)]"
          : "bg-[rgb(244_246_250_/_0.94)]"
      } ${
        scrolled
          ? dark
            ? "border-b border-white/10 shadow-sm"
            : "border-b border-rule shadow-sm"
          : "border-b border-transparent"
      }`}
    >
      {children}
    </header>
  );
}
