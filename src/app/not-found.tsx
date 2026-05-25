import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/Container";
import { MarketingButton } from "@/components/marketing/MarketingButton";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <SiteHeader />
      <main className="flex-1 py-20 grid place-items-center">
        <Container className="text-center">
          <div
            className="font-display text-[120px] md:text-[200px] italic leading-[0.9] text-rust"
          >
            4·0·4
          </div>
          <h1
            className="font-display mt-4 text-5xl md:text-[56px] font-medium leading-[1.05] text-ink"
          >
            This shift&apos;s{" "}
            <em
              className="italic text-sage"
            >
              already booked.
            </em>
          </h1>
          <p className="mx-auto mt-3.5 max-w-[460px] text-[19px] leading-[1.5] text-ink-2">
            We couldn&apos;t find that page. Either it was moved or the URL is
            mistyped. Here are some better doors.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <MarketingButton href="/" variant="primary" size="lg">
              Home →
            </MarketingButton>
            <MarketingButton href="/for-practices" size="lg">
              For Practices
            </MarketingButton>
            <MarketingButton href="/for-optometrists" size="lg">
              For ODs
            </MarketingButton>
            <MarketingButton href="/help" variant="ghost" size="lg">
              Help center
            </MarketingButton>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
