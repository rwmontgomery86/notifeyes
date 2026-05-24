import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "default" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-rust text-white border border-rust hover:bg-rust-2 hover:border-rust-2",
  default:
    "bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper-card",
  ghost:
    "bg-transparent text-ink-2 border border-rule-strong hover:bg-paper-2 hover:text-ink hover:border-ink",
};

const SIZE: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-[18px] py-[10px] text-sm",
  lg: "px-[22px] py-[13px] text-[15px]",
};

type Props = {
  variant?: Variant;
  size?: Size;
  href?: string;
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function MarketingButton({
  variant = "default",
  size = "md",
  href,
  children,
  className = "",
  ...rest
}: Props) {
  const classes = `inline-flex items-center gap-1.5 rounded-full font-medium font-sans transition-colors ${VARIANT[variant]} ${SIZE[size]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
