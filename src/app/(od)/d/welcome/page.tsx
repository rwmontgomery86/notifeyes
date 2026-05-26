import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { optometrists, users } from "@/db/schema";
import { hasAnyNotificationChannel } from "@/lib/notifications/optIn";

export const metadata = { title: "You're verified · NotifEyes" };
export const dynamic = "force-dynamic";

export default async function OdWelcomePage() {
  const session = await auth();
  if (!session?.user.odId) redirect("/login");

  const [me] = await db
    .select({
      verificationStatus: optometrists.verificationStatus,
      displayName: optometrists.displayName,
      name: optometrists.name,
    })
    .from(optometrists)
    .where(eq(optometrists.id, session.user.odId))
    .limit(1);

  if (!me || me.verificationStatus !== "verified") redirect("/d/profile");

  const [u] = await db
    .select({
      email: users.email,
      phone: users.phone,
      emailOptedIn: users.emailOptedIn,
      smsOptedIn: users.smsOptedIn,
      marketingOptedIn: users.marketingOptedIn,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  const needsOptIn = !u || !hasAnyNotificationChannel(u);

  const greetingName = me.displayName?.split(" ")[0] ?? me.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="ne-card">
        <div className="text-4xl">🎉</div>
        <h1 className="mt-2 text-3xl font-bold">
          You&apos;re verified, {greetingName}.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your license is approved. The apply button is now unlocked on every
          open shift, and your watch zones will start pinging you within seconds
          when matching shifts post.
        </p>

        <div className="mt-6 grid gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            What&apos;s next
          </h2>
          <ol className="grid gap-2 text-sm">
            {needsOptIn ? (
              <li className="flex gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-900">
                  !
                </span>
                <span>
                  <strong>Pick how we reach you</strong> — opt in to email or
                  SMS in your <Link href="/d/profile" className="underline">profile</Link>{" "}
                  before creating a watch zone, otherwise we can&apos;t notify
                  you.
                </span>
              </li>
            ) : null}
            <li className="flex gap-3">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                1
              </span>
              <span>
                <strong>Browse open shifts</strong> in your state and apply to
                anything that looks like a fit.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                2
              </span>
              <span>
                <strong>Set a watch zone</strong> — draw or ZIP+radius — so
                we&apos;ll alert you the moment a matching shift is posted.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                3
              </span>
              <span>
                Round out your <strong>profile</strong> — bio, EHRs,
                specialties — to boost your booking rate.
              </span>
            </li>
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/d/shifts" className="ne-btn">
            Browse open shifts
          </Link>
          <Link href="/d/watch" className="ne-btn-secondary">
            Set up a watch zone
          </Link>
          <Link href="/d/profile" className="ne-btn-ghost">
            Edit profile
          </Link>
        </div>
      </div>
    </div>
  );
}
