"use client";

import { useState } from "react";
import { AudienceToggle, type Audience } from "./AudienceToggle";
import { MarketingButton } from "./MarketingButton";
import { MechanicDiagram } from "./diagrams";
import { MARKETING_MATCH_FEE_DISPLAY } from "@/lib/format";

export function HomeHero({ initialRole = "practice" }: { initialRole?: Audience }) {
  const [role, setRole] = useState<Audience>(initialRole);
  const isPractice = role === "practice";

  return (
    <section className="relative min-h-[720px] overflow-hidden border-b border-rule">
      <div className="absolute inset-0">
        <MechanicDiagram />
      </div>
      <div
        className="absolute inset-0 flex flex-col justify-end"
        style={{
          background:
            "linear-gradient(0deg, rgba(244,246,250,0.96) 0%, rgba(244,246,250,0.75) 35%, rgba(244,246,250,0.2) 70%, transparent 95%)",
        }}
      >
        <div className="max-w-wide mx-auto w-full px-7 pb-14 pt-20">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust mb-4">
            By optometrists, for optometrists
          </div>
          <h1
            className="font-display max-w-[1080px] mb-5 text-[56px] md:text-[88px] lg:text-[96px] font-medium leading-[0.96] text-ink tracking-[-0.012em]"
          >
            {isPractice ? (
              <>
                Fill-in shifts,
                <br />
                <em
                  className="italic text-rust"
                >
                  on a platform.
                </em>
              </>
            ) : (
              <>
                Shifts that{" "}
                <em
                  className="italic text-sage"
                >
                  find
                </em>{" "}
                the optometrist.
              </>
            )}
          </h1>
          <p className="max-w-[620px] mb-7 text-[19px] leading-[1.5] text-ink-2">
            {isPractice
              ? "License-verified ODs in your zip apply within minutes of you posting. You pick. We handle the contract; you pay the OD directly. $10 per booked match."
              : "Draw the zones you'd work in. Set the rate you'd take. NotifEyes pings you when matching shifts go up. Free, forever."}
          </p>

          <div className="mb-5">
            <AudienceToggle value={role} onChange={setRole} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <MarketingButton
              href={isPractice ? "/signup?role=practice" : "/signup?role=od"}
              variant="primary"
              size="lg"
            >
              {isPractice ? "Post your first shift" : "Set up my watch zone"} →
            </MarketingButton>
            <MarketingButton
              href={isPractice ? "/for-practices" : "/for-optometrists"}
              size="lg"
            >
              Tour the {isPractice ? "dashboard" : "OD app"}
            </MarketingButton>
            <span className="ml-2 text-sm text-ink-3">
              {isPractice
                ? `$0 to post. ${MARKETING_MATCH_FEE_DISPLAY} only when you book.`
                : "Free for ODs. Always."}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
