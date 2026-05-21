import Link from "next/link";

export function SignupChoice() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Create your NotifEyes account.</h1>
      <p className="mt-2 text-muted-foreground">
        Pick the side of the marketplace you&apos;re on. You can&apos;t switch
        later without contacting support.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          href="/signup?role=od"
          className="ne-card hover:border-primary transition-colors"
        >
          <div className="ne-pill bg-accent text-accent-foreground border-transparent">
            Optometrist
          </div>
          <h2 className="mt-3 text-xl font-semibold">I&apos;m an OD</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick shifts on your terms. Set a watch zone, get pinged when a
            matching shift posts. Weekly payouts.
          </p>
          <p className="mt-4 text-sm font-medium text-primary">
            Continue as OD →
          </p>
        </Link>
        <Link
          href="/signup?role=practice"
          className="ne-card hover:border-primary transition-colors"
        >
          <div className="ne-pill bg-accent text-accent-foreground border-transparent">
            Practice
          </div>
          <h2 className="mt-3 text-xl font-semibold">I run a practice</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Fill any chair fast with vetted, reviewed ODs. No agency markup.
          </p>
          <p className="mt-4 text-sm font-medium text-primary">
            Continue as practice →
          </p>
        </Link>
      </div>
    </div>
  );
}
