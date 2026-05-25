import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/Container";
import { Section } from "@/components/marketing/Section";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { PhonePreview } from "@/components/marketing/PhonePreview";
import {
  BroadcastDiagram,
  PhonePingDiagram,
  ZonePolygonDiagram,
} from "@/components/marketing/diagrams";

export const metadata: Metadata = {
  title: "For Optometrists — NotifEyes",
  description:
    "Draw the zones you would actually drive to. Set the rate you would actually take. Free, forever. NotifEyes pings you when matching shifts post.",
};

const TIMELINE: { day: string; t: string; a: string; d: string }[] = [
  {
    day: "Mon",
    t: "8:14 AM",
    a: "Ping",
    d: "Marina Eye Group · Tue 9–5 · $95/hr · 2.1 mi. Matches your Mission zone.",
  },
  {
    day: "Mon",
    t: "8:19 AM",
    a: "Apply",
    d: 'One tap. Added a note: "Avail. all morning."',
  },
  {
    day: "Mon",
    t: "11:42 AM",
    a: "Booked",
    d: "Practice picked you. Contract signed in-app. Calendar entry created.",
  },
  {
    day: "Fri",
    t: "6:08 PM",
    a: "Paid",
    d: "ACH initiated. $760 in your bank Monday. Review prompt in 2 hr.",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "What's it cost an OD?",
    a: "Zero. Forever. Practices pay $9.99 per match. ODs are always free, with no subscription and no payout cut.",
  },
  {
    q: "How fast do payouts hit my bank?",
    a: "ACH initiated 3 business days after shift completion. Visible on your payouts dashboard. V1 cohort uses manual ACH; V2 switches to Stripe Connect.",
  },
  {
    q: "Do I need malpractice insurance?",
    a: "Recommended. Some practices require it as a filter. Upload your cert once and we display it on your profile for the ones that ask.",
  },
  {
    q: "Can I block a practice?",
    a: "Yes. Both sides have a block list. They will never see your profile or appear in your feed once blocked.",
  },
  {
    q: "What about taxes / 1099?",
    a: "We collect W-9 at payout setup. 1099-NEC issued by Jan 31. Manual the first season; automated by V2.",
  },
  {
    q: "Will my home practice see I'm on NotifEyes?",
    a: "Your profile is opt-in public. Run dark if you want — only invitable, or only reachable via direct link.",
  },
];

export default function ForOptometristsPage() {
  return (
    <div className="bg-paper text-ink min-h-screen">
      <SiteHeader activeKey="ods" />

      {/* Hero */}
      <section
        className="border-b border-rule py-16"
        style={{
          background:
            "linear-gradient(180deg, var(--rust-soft) 0%, var(--paper) 100%)",
        }}
      >
        <div className="max-w-wide mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-14 items-center px-7">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              For Optometrists
            </div>
            <h1
              className="font-display mt-4 text-[56px] md:text-[84px] font-medium leading-[0.97] text-ink"
            >
              Your phone buzzes.
              <br />
              <em
                className="italic text-sage"
              >
                Tap to claim.
              </em>
            </h1>
            <p className="mt-5 max-w-[480px] text-[19px] leading-[1.5] text-ink-2">
              Draw the zones you would actually drive to. Set the rate you would
              actually take. We do the watching, you live your life. Free,
              forever.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <MarketingButton href="/signup?role=od" variant="primary" size="lg">
                Set up my watch zone →
              </MarketingButton>
              <MarketingButton href="/d/shifts" size="lg">
                See live shifts
              </MarketingButton>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-ink-2">
              <span>✓ Free for ODs · always</span>
              <span>✓ Weekly ACH payouts</span>
              <span>✓ 100% of the agreed rate</span>
            </div>
          </div>
          <PhonePreview />
        </div>
      </section>

      {/* Proof bar */}
      <section className="border-b border-rule bg-paper-2">
        <div className="max-w-wide mx-auto grid grid-cols-2 md:grid-cols-4 gap-7 px-7 py-8">
          {[
            { n: "$0", l: "OD fees · forever" },
            { n: "100%", l: "of the agreed rate · paid" },
            { n: "3 days", l: "ACH after shift completion" },
            { n: "< 10s", l: "from shift post to your phone" },
          ].map((s) => (
            <div key={s.l}>
              <div
                className="font-display text-5xl font-medium leading-[0.96] text-ink tracking-[-0.02em]"
              >
                {s.n}
              </div>
              <div className="mt-1 text-[13px] text-ink-2">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Watch zones deep dive */}
      <Section variant="dark">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center mb-12">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">
                The mechanic
              </div>
              <h2
                className="font-display mt-3.5 text-5xl md:text-[72px] font-medium leading-[1.05] text-[#f4f7fc]"
              >
                Watch{" "}
                <em
                  className="italic"
                >
                  zones.
                </em>
              </h2>
              <p className="mt-4 text-[19px] leading-[1.5] text-[#a8b3c6]">
                Three components: where, when, and how loud. Set them once. Pause
                when you go on vacation. Reopen when you want shifts back.
              </p>
              <p className="mt-3.5 text-sm leading-[1.6] text-[#a8b3c6]">
                The whole product hinges on this. You don&apos;t browse a job
                board — your phone buzzes when a real shift inside your real zone
                goes up. No more being last to know.
              </p>
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-card border border-white/10">
              <BroadcastDiagram />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                n: "01",
                t: "Draw the zones",
                d: "Polygon or circle. Multiple zones, each with its own filters and channels.",
                diagram: <ZonePolygonDiagram />,
              },
              {
                n: "02",
                t: "Filter your taste",
                d: "Days you would work. Minimum rate. Half-days only. EHRs you actually know.",
                diagram: (
                  <div className="flex h-full flex-col justify-center gap-2 bg-paper-card p-6">
                    {[
                      ["Days", "Tue · Thu · Sat"],
                      ["Min rate", "$95/hr"],
                      ["Shift types", "Fill-in · Half-day"],
                      ["EHR", "Crystal · Revolution"],
                    ].map(([k, v], i) => (
                      <div
                        key={k}
                        className={`flex justify-between py-1.5 text-[13px] ${
                          i === 3 ? "" : "border-b border-dashed border-rule"
                        }`}
                      >
                        <span className="font-mono text-xs text-ink-3">{k}</span>
                        <span className="font-medium text-ink">{v}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                n: "03",
                t: "Live your life",
                d: "We ping when something matches. Push, email, SMS — your call. Quiet hours configurable.",
                diagram: <PhonePingDiagram />,
              },
            ].map((step) => (
              <article
                key={step.n}
                className="overflow-hidden rounded-card border border-rule bg-paper-card text-ink"
              >
                <div className="h-[220px] border-b border-rule">{step.diagram}</div>
                <div className="p-6">
                  <div className="font-mono text-xs text-rust tracking-[0.04em]">
                    {step.n}
                  </div>
                  <h3 className="font-display mt-2 text-[22px] text-ink">
                    {step.t}
                  </h3>
                  <p className="mt-2 text-sm text-ink-2 leading-[1.6]">
                    {step.d}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* Week in your phone */}
      <Section variant="alt">
        <Container>
          <div className="mb-10 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              A week in your phone
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[60px] font-medium leading-[1.05] text-ink"
            >
              Mon to Mon,{" "}
              <em
                className="italic"
              >
                no scrolling required.
              </em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {TIMELINE.map((step) => (
              <article
                key={step.t}
                className="rounded-card border border-rule bg-paper-card p-5"
              >
                <div className="font-mono text-xs text-sage tracking-[0.04em]">
                  {step.day} · {step.t}
                </div>
                <h3 className="font-display mt-2 text-xl text-ink">{step.a}</h3>
                <p className="mt-2 text-sm text-ink-2 leading-[1.6]">{step.d}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* Quote */}
      <Section>
        <Container className="max-w-[820px]">
          <p
            className="font-display text-[36px] italic leading-[1.3] text-ink"
          >
            <span className="text-rust">&ldquo;</span>I was on the bus. My phone
            buzzed. Tuesday morning at a clinic 4 miles away. I tapped apply.
            Booked by the time I got off at my stop. Rent for the month.
            <span className="text-rust">&rdquo;</span>
          </p>
          <div className="mt-8 flex items-center gap-3.5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#a8d5f0] bg-rust-soft text-lg text-rust-2">
              [ph]
            </div>
            <div>
              <div className="font-semibold text-base text-ink">[Dr. Lorem Lin, OD]</div>
              <div className="text-sm text-ink-2">[7 years · Oakland]</div>
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section variant="alt">
        <Container className="max-w-[820px]">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
            Common questions
          </div>
          <h2
            className="font-display mt-3.5 mb-6 text-[56px] font-medium leading-[1.05] text-ink"
          >
            Things ODs ask first.
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
        </Container>
      </Section>

      {/* Final CTA */}
      <Section variant="dark">
        <Container className="text-center">
          <h2
            className="font-display mx-auto max-w-[900px] text-[64px] md:text-[80px] font-medium leading-[1.05] text-[#f4f7fc]"
          >
            Shifts that{" "}
            <em
              className="italic"
            >
              find you.
            </em>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <MarketingButton href="/signup?role=od" variant="primary" size="lg">
              Set up my watch zone →
            </MarketingButton>
            <MarketingButton
              href="/for-practices"
              size="lg"
              className="!border-[#efe6d2] !text-[#efe6d2] hover:!bg-[#efe6d2] hover:!text-ink"
            >
              I run a practice →
            </MarketingButton>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </div>
  );
}
