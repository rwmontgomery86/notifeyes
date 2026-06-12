import Image from "next/image";
import { MarketingButton } from "./MarketingButton";
import {
  BellIcon,
  CalendarIcon,
  ClockIcon,
  DollarIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersIcon,
  ZapIcon,
} from "./icons";
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
