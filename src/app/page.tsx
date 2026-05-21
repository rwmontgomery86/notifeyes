import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          {session?.user ? (
            <Link
              href={dashboardForRole(session.user.role)}
              className="ne-btn-secondary"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="ne-btn-ghost">
                Log in
              </Link>
              <Link href="/signup" className="ne-btn">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mt-24 grid gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            Optometry staffing, on your terms.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            NotifEyes connects practices with vetted optometrists for fill-in
            shifts. Set a watch zone, get pinged the moment matching work
            appears, and apply in two taps.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/signup?role=od" className="ne-btn">
              I&apos;m an Optometrist
            </Link>
            <Link href="/signup?role=practice" className="ne-btn-secondary">
              I run a Practice
            </Link>
          </div>
        </div>

        <div className="ne-card space-y-4">
          <h3 className="font-semibold">How it works</h3>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-mono text-foreground">01</span>
              <span>
                <strong className="text-foreground">Draw a watch zone</strong>{" "}
                — circle or polygon, filter by rate and shift type.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-foreground">02</span>
              <span>
                <strong className="text-foreground">Get pinged in seconds</strong>{" "}
                when a matching shift posts in that zone.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-foreground">03</span>
              <span>
                <strong className="text-foreground">Apply, book, work</strong>{" "}
                — contract handled inline, payment authorized at booking.
              </span>
            </li>
          </ol>
        </div>
      </section>

      <footer className="mt-32 border-t pt-6 text-xs text-muted-foreground flex justify-between">
        <span>NotifEyes · V1 MVP · SF Bay launch metro</span>
        <span>
          {/* --TODO: legal review --- ToS + privacy URLs */}
          ToS · Privacy
        </span>
      </footer>
    </main>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2 font-semibold">
      <span
        aria-hidden
        className="inline-block h-5 w-5 rounded-full border-[2.5px] border-foreground"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, hsl(var(--primary)) 0 30%, transparent 30%)",
        }}
      />
      NotifEyes
    </div>
  );
}

function dashboardForRole(
  role?: "practice_owner" | "practice_scheduler" | "od" | "admin",
): string {
  if (role === "od") return "/d/shifts";
  if (role === "admin") return "/admin/verifications";
  return "/p/dashboard";
}
