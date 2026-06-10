import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/Container";
import { Section } from "@/components/marketing/Section";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { Chip } from "@/components/marketing/Chip";
import { RoleBadge } from "@/components/marketing/RoleBadge";
import { CompareTable } from "@/components/marketing/CompareTable";
import {
  MARKETING_MATCH_FEE_DISPLAY,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Pricing — NotifEyes",
  description:
    "Free for ODs, free to post. Practices pay a flat $10 per booked match — no agency percentage, no subscription, no surprise.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "How does the $10 get charged?",
    a: "Authorized at booking on your stored card or ACH. Captured at shift completion. Refunded automatically if the shift is cancelled more than 7 days out.",
  },
  {
    q: "What if we book and then cancel?",
    a: "See the tiered cancellation schedule in Trust & safety. The $10 match fee is non-refundable past 48 hours before the shift. OD cancellation fees are separate.",
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

export default function PricingPage() {
  return (
    <div className="bg-paper text-ink min-h-screen">
      <SiteHeader activeKey="pricing" />

      {/* Hero */}
      <section className="border-b border-rule py-16 text-center">
        <Container>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
            Pricing
          </div>
          <h1
            className="font-display mx-auto mt-3.5 max-w-3xl text-[64px] md:text-[96px] font-medium leading-[0.95] text-ink"
          >
            Free for ODs.
            <br />
            Free to post.
            <br />
            <em
              className="italic text-sage"
            >
              {MARKETING_MATCH_FEE_DISPLAY} to book.
            </em>
          </h1>
          <p className="lead mx-auto mt-6 max-w-[540px] text-[19px] leading-[1.5] text-ink-2">
            One flat per-match fee on the practice side. No agency percentage, no
            subscription, no surprise line items.
          </p>
        </Container>
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
                "Weekly ACH payouts",
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
                "Payment authorization + capture",
                "OD payout handled by us",
                "Cancellation enforcement",
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
            <h2
              className="font-display mt-3.5 text-[56px] font-medium leading-[1.05] text-ink"
            >
              Things we want you{" "}
              <em
                className="italic"
              >
                to actually read.
              </em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                t: 'What "per match" means',
                d: "One charge per confirmed booking. Not per applicant, not per ping, not per minute on the platform. If you cancel before booking, no fee. If you cancel after, our cancellation policy kicks in (see Trust & safety).",
              },
              {
                t: "What we don't charge",
                d: (
                  <ul className="m-0 mt-2 list-disc pl-4 text-sm text-ink-2">
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
                d: "100% of the shift rate the practice agreed to. We don't shave the OD payout. The practice pays the agreed rate plus our $10 match fee — the OD gets exactly what was promised.",
              },
              {
                t: "Future pricing",
                d: "We're locking in $10 for the V1 cohort. Premium tiers (unlimited urgent, API access, multi-location billing) may appear in V2 — opt-in only. ODs stay free.",
              },
            ].map((card) => (
              <article
                key={card.t}
                className="rounded-card border border-rule bg-paper-card p-6"
              >
                <h3 className="font-display text-lg font-semibold text-ink">
                  {card.t}
                </h3>
                {typeof card.d === "string" ? (
                  <p className="mt-2 text-sm text-ink-2 leading-[1.6]">{card.d}</p>
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
            <h2
              className="font-display mt-3.5 text-[56px] font-medium leading-[1.05] text-ink"
            >
              How $10 stacks up.
            </h2>
          </div>
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
                label: "OD payout",
                cells: [
                  { text: "Cash · favor" },
                  { text: "~70–78% of rate" },
                  { text: "100% of agreed rate", tone: "yes" },
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
        </Container>
      </Section>

      {/* FAQ */}
      <Section variant="alt">
        <Container>
          <div className="max-w-[820px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Pricing FAQs
            </div>
            <h2
              className="font-display mt-3.5 mb-6 text-5xl font-medium leading-[1.05] text-ink"
            >
              The stuff we get asked.
            </h2>
            <div className="flex flex-col">
              {FAQS.map((f, i) => (
                <details
                  key={f.q}
                  className="border-b border-rule py-5 [&_summary::-webkit-details-marker]:hidden"
                  open={i === 0}
                >
                  <summary
                    className="flex cursor-pointer items-center justify-between font-display text-[22px] font-medium text-ink"
                  >
                    <span>{f.q}</span>
                    <span className="font-mono text-sm text-ink-3">—</span>
                  </summary>
                  <p className="mt-3 text-base leading-[1.6] text-ink-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Final CTA — dark band */}
      <Section variant="dark">
        <Container className="text-center">
          <h2
            className="font-display mx-auto max-w-[900px] text-[64px] md:text-[80px] font-medium leading-[1.05] text-[#f4f7fc]"
          >
            One marketplace.{" "}
            <em
              className="italic"
            >
              Two doors.
            </em>
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
      className={`relative rounded-card border p-6 ${
        accent ? "bg-rust-soft border-[#a8d5f0]" : "bg-paper-card border-rule"
      }`}
    >
      {accent && (
        <div className="absolute -top-3 right-5">
          <Chip variant="solid">Day-one price · locked</Chip>
        </div>
      )}
      <RoleBadge role={role} />
      <h3
        className="font-display mt-3.5 text-[72px] font-medium leading-[1] text-ink"
      >
        {whole}
        {cents && (
          <>
            <span className="text-[44px]">.{cents}</span>
          </>
        )}
      </h3>
      <div className={`text-xs ${accent ? "text-rust-2" : "text-ink-3"}`}>
        {priceFootnote}
      </div>
      <hr className="my-5 border-t border-rule" />
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm text-ink-2">
        {bullets.map((b, i) => (
          <li key={b} className="grid grid-cols-[14px_1fr] gap-2">
            <span className={i === 0 && accent ? "text-ink-3" : "text-sage"}>
              {i === 0 && accent ? "→" : "✓"}
            </span>
            <span className={accent ? "text-ink" : ""}>{b}</span>
          </li>
        ))}
      </ul>
      {cta && (
        <div className="mt-6">
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
