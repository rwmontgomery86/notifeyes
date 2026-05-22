import type { ReactNode } from "react";

type Variant = "default" | "alt" | "dark" | "green";

const VARIANT_BG: Record<Variant, string> = {
  default: "bg-paper text-ink",
  alt: "bg-paper-2 text-ink",
  dark: "bg-paper-deep text-[#e9eef7]",
  green: "bg-sage-soft text-ink",
};

export function Section({
  variant = "default",
  tight = false,
  children,
  className = "",
  id,
}: {
  variant?: Variant;
  tight?: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`${VARIANT_BG[variant]} ${tight ? "py-14" : "py-20"} ${className}`}
    >
      {children}
    </section>
  );
}
