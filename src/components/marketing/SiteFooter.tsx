import Link from "next/link";
import Image from "next/image";
import { MarketingButton } from "./MarketingButton";

const COLS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "For Practices", href: "/for-practices" },
      { label: "For Optometrists", href: "/for-optometrists" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Help", href: "/help" },
      { label: "Contact", href: "mailto:hello@notifeyes.local" },
    ],
  },
  {
    heading: "Trust",
    links: [
      { label: "Trust & safety", href: "/trust-safety" },
      { label: "Verification", href: "/trust-safety#verification" },
      { label: "Cancellation policy", href: "/trust-safety#cancellation" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Cookies", href: "/legal/cookies" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-paper-deep px-7 py-14 text-[#a8b3c6]">
      <div className="max-w-container mx-auto grid grid-cols-1 md:grid-cols-5 gap-7">
        <div className="md:col-span-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-display text-[22px] font-semibold leading-none tracking-[-0.012em] text-[#f4f7fc] no-underline"
            style={{ fontVariationSettings: '"SOFT" 30' }}
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
          <p className="mt-3 max-w-[280px] text-[13px] text-[#9aa6bd]">
            The optometry staffing back-channel — finally with infrastructure.
          </p>
          <div className="mt-4">
            <MarketingButton href="/signup" variant="primary" size="md">
              Sign up — free →
            </MarketingButton>
          </div>
        </div>

        {COLS.map((col) => (
          <div key={col.heading}>
            <h5 className="m-0 mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#f4f7fc]">
              {col.heading}
            </h5>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#a8b3c6] no-underline hover:text-[#f4f7fc]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-container mx-auto mt-9 flex justify-between border-t border-[#2a3a5e] pt-[18px] text-xs text-[#6e7990]">
        <span>© 2026 NotifEyes Inc.</span>
        <span>Made for practitioners, by practitioners.</span>
      </div>
    </footer>
  );
}
