import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/Container";
import { Section } from "@/components/marketing/Section";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Chip } from "@/components/marketing/Chip";
import { HelpClient, type HelpCategory } from "./HelpClient";

export const metadata: Metadata = {
  title: "Help center — NotifEyes",
  description:
    "Answers for practices, optometrists, payments, and trust. Email support@notifeyes.com for anything we missed.",
};

const CATEGORIES: HelpCategory[] = [
  {
    h: "For practices",
    qs: [
      { q: "How do I post my first shift?", a: 'From your dashboard, click "+ Post shift". Five fields, then publish. The watch broadcast goes out within 10 seconds of publish.' },
      { q: "Can my scheduler post for me?", a: "Yes. Add them as a Scheduler seat in Settings → Team. They can post and book but cannot see or change payment / billing." },
      { q: "What if no one applies?", a: "We auto-bump the shift after 4 hours and widen the watch radius. You can also send direct invites to favorites." },
      { q: "How are ODs vetted?", a: "License, ID, NPI verified before they can apply. DEA + malpractice optional, shown on profile if uploaded." },
      { q: "Cancellation fees?", a: "None — cancelling costs nothing through the platform. It goes on the cancelling side's reliability record instead. See Trust & safety." },
    ],
  },
  {
    h: "For optometrists",
    qs: [
      { q: "How long does license verification take?", a: "Target less than 24 hours. Auto-verify if your state board has an API; manual fallback otherwise." },
      { q: "What's a watch zone, really?", a: "A saved search. Geometry + filters + notification channels. We ping you when a shift matches all of it." },
      { q: "When do I get paid?", a: "The practice pays you directly — full rate, however you two agree (check, direct deposit, Venmo, Zelle). Your payouts dashboard tracks what each practice owes and when it was marked paid." },
      { q: "What if I need to cancel a shift?", a: "Cancel from the booking. No platform fee — but the cancellation goes on your reliability record, and the later it is, the more it weighs. See Trust & safety." },
      { q: "Will my home practice see I am on NotifEyes?", a: "Your profile is opt-in public. Run dark — only invitable, or only reachable via direct link." },
    ],
  },
  {
    h: "Payments",
    qs: [
      { q: "How does the practice pay?", a: "Two parts: the OD's wage is paid by the practice directly (NotifEyes never holds it), and our flat $10 match fee goes on the practice's saved card — held at booking, captured only after the practice confirms the OD showed up." },
      { q: "Does NotifEyes take a cut of the OD's rate?", a: "No. ODs get 100% of the agreed rate, paid straight from the practice. The $10 match fee is on the practice side." },
      { q: "Tax docs?", a: "The practice pays the OD directly, so any 1099-NEC comes from the practice — not NotifEyes. Automated tax docs are planned with Stripe Connect in V2." },
    ],
  },
  {
    h: "Trust + safety",
    qs: [
      { q: "How do you handle no-shows?", a: "Practice reports it from the booking. The match fee is never captured — the practice pays nothing — and backup ODs are surfaced. The OD gets a flag; 3 flags triggers suspension review." },
      { q: "Can I block someone?", a: "Yes. Both sides have a block list. They will never see you, and will not appear in your feed once blocked." },
      { q: "Reviews — are they public?", a: "Yes, after both sides submit (or 7 days). Private feedback also collected, visible only to us for moderation." },
    ],
  },
];

const SEARCH_CHIPS = [
  "Posting a shift",
  "Watch zones",
  "Payouts",
  "License verification",
  "Cancellations",
  "Reviews",
];

export default function HelpPage() {
  return (
    <div className="bg-paper text-ink min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-rule py-14">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-9 items-end">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
                Help center
              </div>
              <h1
                className="font-display mt-3.5 text-5xl md:text-[72px] font-medium leading-[0.97] text-ink"
              >
                How can{" "}
                <em
                  className="italic"
                >
                  we help?
                </em>
              </h1>
              <form
                action="mailto:support@notifeyes.com"
                className="mt-6 flex max-w-[540px] gap-2.5"
                aria-label="Search the help center"
              >
                <input
                  type="search"
                  name="search"
                  placeholder="Search the help center — try “watch zone”, “payout”"
                  className="ne-input flex-1 !h-12 text-[15px]"
                />
                <button
                  type="submit"
                  className="rounded-full bg-rust px-[18px] text-sm font-medium text-white hover:bg-rust-2"
                >
                  Search
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                {SEARCH_CHIPS.map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </div>
            </div>
            <article className="rounded-card border border-[#a8d8af] bg-sage-soft p-5">
              <Chip variant="sage" className="!text-[11px]">
                ● Live
              </Chip>
              <h4 className="font-display mt-2 text-lg text-ink">Still stuck?</h4>
              <p className="mt-1.5 text-sm text-ink-2 leading-[1.6]">
                Email <span className="font-mono">support@notifeyes.com</span>.
                1-business-day reply target. Urgent shift issues — in-app chat.
              </p>
              <a
                href="mailto:support@notifeyes.com"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sage px-3 py-1.5 text-[13px] font-medium text-sage hover:bg-sage hover:text-white transition-colors"
              >
                Email support
              </a>
            </article>
          </div>
        </Container>
      </section>

      {/* Topics + content */}
      <Section>
        <Container>
          <HelpClient categories={CATEGORIES} />
        </Container>
      </Section>

      <FinalCTA />
      <SiteFooter />
    </div>
  );
}
