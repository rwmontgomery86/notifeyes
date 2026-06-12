import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { MarketingButton } from "./MarketingButton";
import { StickyHeader } from "./StickyHeader";

type NavKey = "home" | "practices" | "ods" | "how" | "pricing";

const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "practices", label: "For Practices", href: "/for-practices" },
  { key: "ods", label: "For Optometrists", href: "/for-optometrists" },
  { key: "how", label: "How it works", href: "/how-it-works" },
  { key: "pricing", label: "Pricing", href: "/pricing" },
];

function dashboardForRole(
  role?: "practice_owner" | "practice_scheduler" | "od" | "admin",
): string {
  if (role === "od") return "/d/shifts";
  if (role === "admin") return "/admin/verifications";
  return "/p/dashboard";
}

export async function SiteHeader({ activeKey }: { activeKey?: NavKey }) {
  const session = await auth();
  const signedIn = !!session?.user;
  return (
    <StickyHeader>
      <div className="max-w-wide mx-auto flex items-center gap-9 px-7 py-[18px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-[22px] font-semibold leading-none tracking-[-0.012em] text-ink no-underline transition-colors group-data-[dark]:text-paper"
        >
          <Image
            src="/notifeyes-mark.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain shrink-0"
          />
          Notif<span className="text-rust">Eyes</span>
        </Link>
        <nav className="hidden md:flex gap-6 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`no-underline transition-colors ${
                activeKey === item.key
                  ? "text-ink font-medium group-data-[dark]:text-paper"
                  : "text-ink-2 hover:text-ink group-data-[dark]:text-[#a8b3c6] group-data-[dark]:hover:text-paper"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
        <div className="flex items-center gap-4 text-sm">
          {signedIn ? (
            <MarketingButton
              href={dashboardForRole(session.user.role)}
              variant="primary"
              size="sm"
            >
              Dashboard →
            </MarketingButton>
          ) : (
            <>
              <MarketingButton
                href="/login"
                variant="default"
                size="sm"
                className="hidden sm:inline-flex group-data-[dark]:!border-paper group-data-[dark]:!text-paper group-data-[dark]:hover:!bg-paper group-data-[dark]:hover:!text-ink"
              >
                Log in
              </MarketingButton>
              <MarketingButton href="/signup" variant="primary" size="sm">
                Sign up — free
              </MarketingButton>
            </>
          )}
        </div>
      </div>
    </StickyHeader>
  );
}
