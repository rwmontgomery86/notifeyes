import Image from "next/image";
import { MarketingButton } from "./MarketingButton";
import { MARKETING_MATCH_FEE_DISPLAY } from "@/lib/format";

export function HomeHero() {
  return (
    <section className="relative overflow-x-clip border-b border-rule bg-paper">
      <div className="max-w-wide mx-auto grid items-center gap-10 px-7 pt-8 pb-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-6 lg:pt-10">
        <div className="relative z-10">
          <h1 className="font-display max-w-[15ch] text-[40px] font-medium leading-[1.04] tracking-[-0.015em] sm:text-[48px] lg:text-[52px] xl:text-[62px]">
            <span className="block text-ink">Coverage when you need it.</span>
            <span className="block text-rust">Freedom when you want it.</span>
          </h1>
          <p className="mt-5 max-w-[560px] text-[17px] leading-[1.55] text-ink-2 lg:text-[19px]">
            License-verified ODs and local practices, matched in minutes. We
            handle the contract; the practice pays the OD directly.{" "}
            {MARKETING_MATCH_FEE_DISPLAY} flat per booked match — free for ODs,
            always.
          </p>
          <div className="mt-8 grid max-w-[640px] gap-4 sm:grid-cols-2">
            <AudienceCard audience="practice" />
            <AudienceCard audience="od" />
          </div>
        </div>

        <HeroVisual />
      </div>

      <div className="max-w-wide mx-auto px-7 pb-9">
        <HeroStats />
      </div>
    </section>
  );
}

function AudienceCard({ audience }: { audience: "practice" | "od" }) {
  const isPractice = audience === "practice";
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-rule bg-paper-card p-5 shadow-[0_1px_2px_rgba(27,42,78,0.05)]">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          isPractice ? "bg-rust-soft text-rust" : "bg-sage-soft text-sage"
        }`}
      >
        {isPractice ? (
          <UsersIcon className="h-5 w-5" />
        ) : (
          <UserIcon className="h-5 w-5" />
        )}
      </span>
      <div>
        <div className="font-display text-[17px] font-semibold text-ink">
          {isPractice ? "For practices" : "For optometrists"}
        </div>
        <p className="mt-1 text-sm leading-[1.5] text-ink-2">
          {isPractice
            ? "Fill shifts fast. Keep care moving."
            : "Choose shifts that fit your life."}
        </p>
      </div>
      <div className="mt-auto">
        <MarketingButton
          href={isPractice ? "/signup?role=practice" : "/signup?role=od"}
          variant={isPractice ? "primary" : "default"}
          size="md"
        >
          {isPractice ? "Post a shift" : "Find shifts"} →
        </MarketingButton>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-[min(86vw,420px)] lg:mx-0 lg:w-[min(44vw,640px)] lg:translate-x-[14%] xl:translate-x-[18%]"
    >
      {/* light-blue crescent band peeking out along the photo's lower-left */}
      <div className="absolute -bottom-[6%] -left-[7%] h-[104%] w-[104%] rounded-full bg-rust-soft" />

      <HeroOrbits className="absolute left-1/2 top-1/2 h-[136%] w-[136%] -translate-x-1/2 -translate-y-1/2" />

      <div className="relative aspect-square overflow-hidden rounded-full shadow-[0_24px_64px_rgba(27,42,78,0.18)]">
        <Image
          src="/hero-office.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1023px) 86vw, 44vw"
          className="object-cover"
        />
      </div>

      <ShiftNotificationCard className="absolute bottom-[4%] -left-2 z-10 w-[min(252px,72vw)] sm:left-[-6%] sm:w-[290px] lg:left-[-14%]" />
    </div>
  );
}

function HeroOrbits({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 600"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* thin arcs concentric with the photo circle (r≈220 in this space) */}
      <path
        d="M300 48 A252 252 0 0 0 82 426"
        stroke="var(--rust)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M445 551 A290 290 0 0 1 114 522"
        stroke="var(--rust)"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="174" cy="82" r="7" fill="var(--rust)" />
      <circle cx="52" cy="344" r="6" fill="var(--rust)" />
      <circle cx="445" cy="506" r="6" fill="var(--sage)" />
    </svg>
  );
}

function ShiftNotificationCard({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-rule bg-paper-card shadow-[0_16px_48px_rgba(27,42,78,0.22)] ${className ?? ""}`}
    >
      <div className="flex items-center gap-2 rounded-t-[11px] bg-ink px-4 py-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-rust" />
        <span className="text-[12px] font-semibold tracking-[0.02em] text-paper">
          New shift posted
        </span>
      </div>

      <div className="absolute -right-4 -top-5 flex h-12 w-12 items-center justify-center rounded-full bg-rust shadow-[0_4px_12px_rgba(30,155,227,0.45)]">
        <BellIcon className="h-5 w-5 text-white" />
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-paper-card bg-sage" />
      </div>

      <div className="p-4 pt-3">
        <div className="font-display text-[16px] font-semibold text-ink">
          Bayview Eye Care
        </div>

        <div className="mt-2.5 flex flex-col gap-1.5 text-[13px] text-ink-2">
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-ink-3" />
            Today · 8:00 AM – 5:00 PM
          </span>
          <span className="flex items-center gap-2">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-ink-3" />
            Geary Blvd · San Francisco, CA
          </span>
          <span className="flex items-center gap-2">
            <DollarIcon className="h-3.5 w-3.5 shrink-0 text-ink-3" />
            $95 / hr
          </span>
        </div>

        {/* product mock — spans, not buttons, so nothing here is focusable */}
        <div className="mt-3.5 grid gap-2">
          <span className="inline-flex items-center justify-center rounded-full bg-rust px-4 py-2 text-[13px] font-medium text-white">
            View shift
          </span>
          <span className="inline-flex items-center justify-center rounded-full border border-rule-strong px-4 py-[7px] text-[13px] font-medium text-ink-2">
            Pass
          </span>
        </div>
      </div>
    </div>
  );
}

function HeroStats() {
  const iconCls = "h-4 w-4 lg:h-5 lg:w-5";
  const stats = [
    {
      icon: <ZapIcon className={iconCls} />,
      n: "< 10s",
      l: "from shift post to first ping",
    },
    {
      icon: <ClockIcon className={iconCls} />,
      n: "8 min",
      l: "median first application",
    },
    {
      icon: <ShieldCheckIcon className={iconCls} />,
      n: "24 hr",
      l: "license verification SLA",
    },
    {
      icon: <DollarIcon className={iconCls} />,
      n: MARKETING_MATCH_FEE_DISPLAY,
      l: "per match · flat, no %",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-y-6 rounded-2xl border border-rule bg-paper-card px-2 py-6 shadow-[0_2px_8px_rgba(27,42,78,0.06)] lg:grid-cols-4 lg:gap-y-0 lg:divide-x lg:divide-rule lg:py-7">
      {stats.map((s) => (
        <div key={s.l} className="flex items-center gap-3 px-4 lg:gap-3.5 lg:px-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(30,155,227,0.35)] bg-rust-soft text-rust lg:h-11 lg:w-11">
            {s.icon}
          </span>
          <div>
            <div className="font-display whitespace-nowrap text-[24px] font-medium leading-none tracking-[-0.02em] text-ink lg:text-[30px]">
              {s.n}
            </div>
            <div className="mt-1 text-[12.5px] leading-snug text-ink-2">
              {s.l}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Inline icons — 24×24 stroke-current, same pattern as AppShellClient. */

function iconProps(className?: string) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    className,
  } as const;
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
