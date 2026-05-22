import type { ReactNode } from "react";

type Variant = "default" | "accent" | "sage" | "solid";

const VARIANT: Record<Variant, string> = {
  default: "bg-paper-card border border-rule text-ink-2",
  accent: "bg-rust-soft border border-[#a8d5f0] text-rust-2",
  sage: "bg-sage-soft border border-[#a8d8af] text-sage",
  solid: "bg-ink border border-ink text-paper-card",
};

export function Chip({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-xs leading-[1.5] ${VARIANT[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
