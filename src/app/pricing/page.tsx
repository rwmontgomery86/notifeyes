import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/Container";
import { Section } from "@/components/marketing/Section";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { Chip } from "@/components/marketing/Chip";
import { RoleBadge } from "@/components/marketing/RoleBadge";
import { CompareTable } from "@/components/marketing/CompareTable";
import { StatBand } from "@/components/marketing/StatBand";
import {
  CircleCheckIcon,
  ClockIcon,
  DollarIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@/components/marketing/icons";
import { MARKETING_MATCH_FEE_DISPLAY } from "@/lib/format";

export const metadata: Metadata = {
  title: "Pricing — NotifEyes",
  description:
    "Free for ODs, free to post. Practices pay a flat $10 per booked match — no agency percentage, no subscription, no surprise.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "How does the $10 get charged?",
    a: "A hold is placed on your saved card at booking, and it's captured only after you confirm the OD showed up for the shift. No show, no charge. The OD's wage is yours to pay directly — it never goes through us.",
  },
  {
    q: "What if we book and then cancel?",
    a: "No cancellation fee — the $10 hold is released and you pay nothing. Cancellations go on the cancelling side's reliability record (yours or the OD's), which both sides can see.",
  },
  {
    q: "Why not a percentage-of-shift model?",
    a: "Because a percentage rewards big shifts, not fast matches. A flat fee aligns us with what we actually ship — a working booking — regardless of dollar size.",
  },
  {
    q: "Will it always be $10?",
    a: "It is the V1 launch price, locked in for our V1 cohort. We may move new signups to $14.99 in V2. Existing accounts keep $10.",
  },
  {
    q: "Do you charge sales tax?",
    a: "Where required by state. Shown clearly at checkout, never hidden.",
  },
];

const FINE_PRINT: { t: string; icon: React.ReactNode; d: React.ReactNode }[] = [
  {
    t: 'What "per match" means',
    icon: <CircleCheckIcon className="h-5 w-5" />,
    d: "One charge per confirmed booking. Not per applicant, not per ping, not per minute on the platform. If you cancel before booking, no fee. If you cancel after, our cancellation policy kicks in (see Trust & safety).",
  },
  {
    t: "What we don't charge",
    icon: <DollarIcon className="h-5 w-5" />,
    d: (
      <ul className="m-0 mt-2 list-disc pl-4 text-sm leading-[1.6] text-ink-2">
        <li>No subscription</li>
        <li>No percentage of the shift total</li>
        <li>No fee per applicant viewed</li>
        <li>No fee for direct invites</li>
        <li>Nothing on the OD side, ever</li>
      </ul>
    ),
  },
  {
    t: "What the OD gets",
    icon: <UserIcon className="h-5 w-5" />,
    d: "100% of the shift rate the practice agreed to, paid directly by the practice. We never touch the wage. The practice pays the agreed rate to the OD plus our $10 match fee — the OD gets exactly what was promised.",
  },
  {
    t: "Future pricing",
    icon: <ClockIcon className="h-5 w-5" />,
    d: "We're locking in $10 for the V1 cohort. Premium tiers (unlimited urgent, API access, multi-location billing) may appear in V2 — opt-in only. ODs stay free.",
  },
];

export default function PricingPage() {
  return (
    <div className="bg-paper text-ink min-h-screen">
      <SiteHeader activeKey="pricing" />

      {/* Hero — split layout on a soft blue wash, echoing the homepage hero */}
      <section className="relative overflow-x-clip bg-gradient-to-b from-rust-soft via-[#eaf3fb] to-paper">
        <div className="max-w-wide mx-auto grid items-center gap-10 px-7 pt-12 pb-4 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-8 lg:pt-16">
          <div className="relative z-10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Pricing
            </div>
            <h1 className="font-display mt-3.5 max-w-[14ch] text-[44px] font-medium leading-[1.04] tracking-[-0.015em] sm:text-[56px] xl:text-[64px]">
              <span className="block text-ink">Free for ODs.</span>
              <span className="block text-ink">Free to post.</span>
              <em className="block italic text-sage">
                {MARKETING_MATCH_FEE_DISPLAY} to book.
              </em>
            </h1>
            <p className="mt-6 max-w-[520px] text-[17px] leading-[1.55] text-ink-2 lg:text-[19px]">
              One flat per-match fee on the practice side. No agency
              percentage, no subscription, no surprise line items.
            </p>
          </div>

          <PricingHeroVisual />
        </div>

        <div className="max-w-wide mx-auto px-7 pb-10 pt-6">
          <StatBand
            stats={[
              {
                icon: <UserIcon className="h-4 w-4 lg:h-5 lg:w-5" />,
                n: "$0",
                l: "for ODs — always, forever",
              },
              {
                icon: <DollarIcon className="h-4 w-4 lg:h-5 lg:w-5" />,
                n: MARKETING_MATCH_FEE_DISPLAY,
                l: "flat per booked match · no %",
              },
              {
                icon: <ShieldCheckIcon className="h-4 w-4 lg:h-5 lg:w-5" />,
                n: "24 hr",
                l: "license verification SLA",
              },
              {
                icon: <CircleCheckIcon className="h-4 w-4 lg:h-5 lg:w-5" />,
                n: "No show?",
                l: "no charge — hold released",
              },
            ]}
          />
        </div>
      </section>

      {/* Pricing cards */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <PricingCard
              role="od"
              label="Optometrists"
              price="$0"
              priceFootnote="always · forever"
              bullets={[
                "Profile + license verification",
                "Unlimited watch zones",
                "Apply to any open shift",
                "Direct invites from practices",
                "Full rate, paid to you directly",
                "Blind reviews",
                "In-app messaging",
              ]}
              cta={{ href: "/signup?role=od", label: "Create OD profile", variant: "primary" }}
            />
            <PricingCard
              role="practice"
              label="Practice · posting"
              price="$0"
              priceFootnote="no charge until you book"
              bullets={[
                "Unlimited shift posts",
                "Browse + favorite ODs",
                "Watch-zone broadcast",
                "Applicant pipeline",
                "Team seats (owner + schedulers)",
                "In-app messaging",
                "Cancel before booking · no fee",
              ]}
              cta={{ href: "/signup?role=practice", label: "Sign up free", variant: "default" }}
            />
            <PricingCard
              role="practice"
              accent
              label="Per booked shift"
              price={MARKETING_MATCH_FEE_DISPLAY}
              priceFootnote="flat · same-day & urgent included"
              bullets={[
                "Everything in free, plus:",
                "Booking + e-signed contract",
                "Fee captured only after the OD shows",
                "You pay the OD directly — no markup",
                "Reliability records on cancellations",
                "Dispute support",
                "24-hr verification SLA on ODs",
              ]}
            />
          </div>
        </Container>
      </Section>

      {/* Fine print */}
      <Section variant="alt">
        <Container>
          <div className="mb-8 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              The fine print
            </div>
            <h2 className="font-display mt-3.5 text-[40px] md:text-[56px] font-medium leading-[1.05] text-ink">
              Things we want you <em className="italic">to actually read.</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FINE_PRINT.map((card) => (
              <article
                key={card.t}
                className="rounded-2xl border border-rule bg-paper-card p-6 shadow-[0_1px_2px_rgba(27,42,78,0.05)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(30,155,227,0.35)] bg-rust-soft text-rust">
                  {card.icon}
                </span>
                <h3 className="font-display mt-4 text-lg font-semibold text-ink">
                  {card.t}
                </h3>
                {typeof card.d === "string" ? (
                  <p className="mt-2 text-sm text-ink-2 leading-[1.6]">
                    {card.d}
                  </p>
                ) : (
                  card.d
                )}
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* Compare table */}
      <Section>
        <Container>
          <div className="mb-8 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Vs. the alternatives
            </div>
            <h2 className="font-display mt-3.5 text-[40px] md:text-[56px] font-medium leading-[1.05] text-ink">
              How $10 stacks up.
            </h2>
          </div>
          <div className="rounded-2xl border border-rule bg-paper-card p-2 shadow-[0_1px_2px_rgba(27,42,78,0.05)] sm:p-4">
            <CompareTable
              columns={["Group text", "Staffing agency", "NotifEyes"]}
              highlightIndex={2}
              rows={[
                {
                  label: "Cost to practice",
                  cells: [
                    { text: "Free · social capital" },
                    { text: "15–22% markup" },
                    { text: `${MARKETING_MATCH_FEE_DISPLAY} flat`, tone: "yes" },
                  ],
                },
                {
                  label: "OD pay",
                  cells: [
                    { text: "Cash · favor" },
                    { text: "~70–78% of rate" },
                    { text: "100% of agreed rate, direct", tone: "yes" },
                  ],
                },
                {
                  label: "Subscription",
                  cells: [
                    { text: "—" },
                    { text: "Often, plus per-placement" },
                    { text: "None", tone: "yes" },
                  ],
                },
                {
                  label: "License verified",
                  cells: [
                    { text: "Trust-based", tone: "no" },
                    { text: "Yes", tone: "yes" },
                    { text: "Yes · automated", tone: "yes" },
                  ],
                },
                {
                  label: "Written contract",
                  cells: [
                    { text: "No", tone: "no" },
                    { text: "Yes", tone: "yes" },
                    { text: "Click-through · auto", tone: "yes" },
                  ],
                },
                {
                  label: "Refund if cancelled early",
                  cells: [
                    { text: "—" },
                    { text: "Variable" },
                    { text: "Full · > 7 days out", tone: "yes" },
                  ],
                },
              ]}
            />
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section variant="alt">
        <Container>
          <div className="max-w-[820px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Pricing FAQs
            </div>
            <h2 className="font-display mt-3.5 mb-6 text-[40px] md:text-5xl font-medium leading-[1.05] text-ink">
              The stuff we get asked.
            </h2>
            <div className="flex flex-col">
              {FAQS.map((f, i) => (
                <details
                  key={f.q}
                  className="group border-b border-rule py-5 [&_summary::-webkit-details-marker]:hidden"
                  open={i === 0}
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-[20px] md:text-[22px] font-medium text-ink">
                    <span>{f.q}</span>
                    <span
                      aria-hidden
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(30,155,227,0.35)] bg-rust-soft text-base leading-none text-rust transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-[680px] text-base leading-[1.6] text-ink-2">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Final CTA — dark band */}
      <Section variant="dark">
        <Container className="text-center">
          <h2 className="font-display mx-auto max-w-[900px] text-[44px] sm:text-[64px] md:text-[80px] font-medium leading-[1.05] text-[#f4f7fc]">
            One marketplace. <em className="italic">Two doors.</em>
          </h2>
          <p className="lead mx-auto mt-4 max-w-[540px] text-[19px] leading-[1.5] text-[#a8b3c6]">
            Two-minute sign up. ODs always free. Practices pay only when they book.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <MarketingButton href="/signup?role=practice" variant="primary" size="lg">
              I&apos;m a practice →
            </MarketingButton>
            <MarketingButton
              href="/signup?role=od"
              size="lg"
              className="!border-[#efe6d2] !text-[#efe6d2] hover:!bg-[#efe6d2] hover:!text-ink"
            >
              I&apos;m an optometrist →
            </MarketingButton>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </div>
  );
}

/* Line-art illustration ring (generated asset) + the real logo mark composited
   at its empty center + thin orbit arcs, echoing the homepage HeroOrbits. */
function PricingHeroVisual() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-[min(86vw,460px)] lg:mx-0 lg:w-full lg:max-w-[620px]"
    >
      <PricingOrbits className="absolute left-1/2 top-1/2 h-[118%] w-[112%] -translate-x-1/2 -translate-y-1/2" />

      <Image
        src="/pricing-hero-lineart.png"
        alt=""
        width={1536}
        height={1024}
        priority
        sizes="(max-width: 1023px) 86vw, 44vw"
        className="relative h-auto w-full mix-blend-multiply"
      />

      {/* the real mark, centered in the illustration's empty ring */}
      <div className="absolute left-[50%] top-[45%] flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(30,155,227,0.5)] bg-white shadow-[0_12px_32px_rgba(27,42,78,0.16)] lg:h-24 lg:w-24">
        <Image
          src="/notifeyes-mark.png"
          alt=""
          width={56}
          height={56}
          className="h-12 w-12 object-contain lg:h-14 lg:w-14"
        />
        <span className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-sage lg:h-4 lg:w-4" />
      </div>

      <BookingConfirmedCard className="absolute bottom-[2%] left-[30%] z-10 w-[min(250px,64vw)]" />
    </div>
  );
}

function PricingOrbits({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 420" fill="none" aria-hidden="true" className={className}>
      <path
        d="M300 30 A230 175 0 0 0 62 250"
        stroke="var(--rust)"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M470 386 A255 195 0 0 1 150 380"
        stroke="var(--rust)"
        strokeWidth="1.5"
        strokeOpacity="0.25"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="152" cy="52" r="6" fill="var(--rust)" />
      <circle cx="40" cy="290" r="5" fill="var(--rust)" />
      <circle cx="510" cy="350" r="5" fill="var(--sage)" />
    </svg>
  );
}

/* Product-moment mini-card overlapping the illustration — sibling of the
   homepage hero's "New shift posted" card. */
function BookingConfirmedCard({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-rule bg-paper-card p-3.5 shadow-[0_16px_48px_rgba(27,42,78,0.22)] ${className ?? ""}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sage">
          <CircleCheckIcon className="h-[18px] w-[18px]" />
        </span>
        <div>
          <div className="font-display text-[14px] font-semibold leading-tight text-ink">
            Booking confirmed
          </div>
          <div className="mt-0.5 text-[12px] leading-snug text-ink-2">
            {MARKETING_MATCH_FEE_DISPLAY} match fee — captured after the OD
            shows
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  role,
  label,
  price,
  priceFootnote,
  bullets,
  cta,
  accent = false,
}: {
  role: "practice" | "od";
  label: string;
  price: string;
  priceFootnote: string;
  bullets: string[];
  cta?: { href: string; label: string; variant: "primary" | "default" };
  accent?: boolean;
}) {
  // Split the price into dollars + cents for the smaller-cents treatment
  const [whole, cents] = price.includes(".")
    ? [price.slice(0, price.indexOf(".")), price.slice(price.indexOf(".") + 1)]
    : [price, null];
  return (
    <article
      className={`relative flex flex-col rounded-2xl border p-6 lg:p-7 ${
        accent
          ? "bg-rust-soft border-[#a8d5f0] shadow-[0_8px_24px_rgba(30,155,227,0.16)]"
          : "bg-paper-card border-rule shadow-[0_1px_2px_rgba(27,42,78,0.05)]"
      }`}
    >
      {accent && (
        <div className="absolute -top-3 right-5">
          <Chip variant="solid">Day-one price · locked</Chip>
        </div>
      )}
      <div>
        <RoleBadge role={role} />
      </div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
        {label}
      </div>
      <h3 className="font-display mt-2 text-[72px] font-medium leading-[1] text-ink">
        {whole}
        {cents && <span className="text-[44px]">.{cents}</span>}
      </h3>
      <div className={`text-xs ${accent ? "text-rust-2" : "text-ink-3"}`}>
        {priceFootnote}
      </div>
      <hr className="my-5 border-t border-rule" />
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm text-ink-2">
        {bullets.map((b, i) => (
          <li key={b} className="grid grid-cols-[18px_1fr] gap-2">
            {i === 0 && accent ? (
              <span className="text-ink-3">→</span>
            ) : (
              <CircleCheckIcon className="mt-[3px] h-3.5 w-3.5 text-sage" />
            )}
            <span className={accent ? "text-ink" : ""}>{b}</span>
          </li>
        ))}
      </ul>
      {cta && (
        <div className="mt-6 pt-0 lg:mt-auto lg:pt-6">
          <MarketingButton
            href={cta.href}
            variant={cta.variant}
            size="md"
            className="w-full justify-center"
          >
            {cta.label} →
          </MarketingButton>
        </div>
      )}
    </article>
  );
}
