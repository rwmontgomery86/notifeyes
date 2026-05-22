import type { ReactNode } from "react";

export function Container({
  children,
  wide = false,
  className = "",
}: {
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`${wide ? "max-w-wide" : "max-w-container"} mx-auto px-7 ${className}`}
    >
      {children}
    </div>
  );
}
