import { and, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { optometrists, users, watchZones } from "@/db/schema";
import { hasAnyNotificationChannel } from "@/lib/notifications/optIn";

export const metadata = { title: "Get started · NotifEyes" };
export const dynamic = "force-dynamic";

// The OD setup home. Usable from the moment of signup — through "verification
// pending" and after approval. Brand-new ODs land here (signup + /me route
// incomplete setups here); it doubles as the post-verification celebration.
export default async function OdWelcomePage() {
  const session = await auth();
  if (!session?.user.odId) redirect("/login");
  const odId = session.user.odId;

  const [me] = await db
    .select({
      verificationStatus: optometrists.verificationStatus,
      verifiedAt: optometrists.verifiedAt,
      displayName: optometrists.displayName,
      name: optometrists.name,
      licenseDocUrl: optometrists.licenseDocUrl,
    })
    .from(optometrists)
    .where(eq(optometrists.id, odId))
    .limit(1);
  if (!me) redirect("/d/profile");

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

  const [{ count: watchZoneCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(watchZones)
    .where(and(eq(watchZones.odId, odId), eq(watchZones.paused, false)));

  const isVerified = me.verificationStatus === "verified" && !!me.verifiedAt;
  const hasAlerts = !!u && hasAnyNotificationChannel(u);
  const hasLicenseDoc = !!me.licenseDocUrl;
  const hasWatchZone = watchZoneCount > 0;

  const greetingName = me.displayName?.split(" ")[0] ?? me.name.split(" ")[0];

  const steps: { done: boolean; title: string; body: React.ReactNode }[] = [
    {
      done: hasAlerts,
      title: hasAlerts ? "Alerts are on" : "Turn on alerts",
      body: hasAlerts ? (
        <>
          We&apos;ll email you the moment a matching shift posts.{" "}
          <Link href="/d/profile" className="underline">
            Manage how we reach you
          </Link>
          .
        </>
      ) : (
        <>
          Opt in to email or SMS in your{" "}
          <Link href="/d/profile" className="underline">
            profile
          </Link>{" "}
          so we can ping you when a shift matches.
        </>
      ),
    },
    {
      done: hasLicenseDoc,
      title: hasLicenseDoc ? "License uploaded" : "Upload your license",
      body: hasLicenseDoc ? (
        <>On file for the verification team.</>
      ) : (
        <>
          Add a photo or PDF of your license on your{" "}
          <Link href="/d/profile" className="underline">
            profile
          </Link>{" "}
          — it speeds up verification.
        </>
      ),
    },
    {
      done: isVerified,
      title: isVerified ? "License verified" : "Verification in progress",
      body: isVerified ? (
        <>The apply button is unlocked on every open shift.</>
      ) : (
        <>
          We&apos;re reviewing your license — usually within a day. You can set
          everything else up in the meantime.
        </>
      ),
    },
    {
      done: hasWatchZone,
      title: hasWatchZone ? "Watch zone set" : "Tell us where you want to work",
      body: hasWatchZone ? (
        <>
          You&apos;ll get pinged within seconds when a matching shift posts.{" "}
          <Link href="/d/watch" className="underline">
            Manage zones
          </Link>
          .
        </>
      ) : (
        <>
          <Link href="/d/watch" className="underline">
            Set a watch zone
          </Link>{" "}
          and we&apos;ll alert you the moment a matching shift is posted.
        </>
      ),
    },
  ];

  const allDone = steps.every((s) => s.done);

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="ne-card">
        <div className="text-4xl">{isVerified ? "🎉" : "👋"}</div>
        <h1 className="mt-2 text-3xl font-bold">
          {isVerified
            ? `You're verified, ${greetingName}.`
            : `Welcome, ${greetingName}. Let's get you set up.`}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isVerified
            ? "Your license is approved. The apply button is now unlocked on every open shift, and your watch zones will ping you within seconds when matching shifts post."
            : "You can do everything except apply while we verify your license. Knock these out now so you're ready the second you're approved."}
        </p>

        <div className="mt-6 grid gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {allDone ? "You're all set" : "Your setup checklist"}
          </h2>
          <ol className="grid gap-3 text-sm">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    step.done
                      ? "bg-green-100 text-green-900"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {step.done ? "✓" : i + 1}
                </span>
                <span>
                  <strong>{step.title}</strong>
                  <span className="block text-muted-foreground">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/d/shifts" className="ne-btn">
            Browse open shifts
          </Link>
          <Link href="/d/watch" className="ne-btn-secondary">
            {hasWatchZone ? "Manage watch zones" : "Set up a watch zone"}
          </Link>
          <Link href="/d/profile" className="ne-btn-ghost">
            Edit profile
          </Link>
        </div>
      </div>
    </div>
  );
}
