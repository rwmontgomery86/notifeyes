import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { optometrists } from "@/db/schema";
import { isUuid } from "@/lib/uuid";

export const dynamic = "force-dynamic";

export default async function OdPublicProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [od] = await db
    .select()
    .from(optometrists)
    .where(eq(optometrists.id, id))
    .limit(1);
  if (!od) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-muted-foreground">
        ← Back
      </Link>

      <header className="mt-6 ne-card flex items-start gap-5">
        {od.headshotUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={od.headshotUrl}
            alt={od.displayName ?? od.name}
            className="h-24 w-24 rounded-full object-cover border"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-secondary" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{od.displayName ?? od.name}</h1>
            {od.verificationStatus === "verified" ? (
              <span className="ne-pill border-green-500/40 bg-green-100/60 text-green-900">
                ✓ Verified OD
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            License {od.licenseState} #{od.licenseNumber}
          </p>
          {od.ratingCount > 0 && od.ratingAvg ? (
            <p className="mt-1 text-sm">
              <span className="font-medium">{od.ratingAvg.toFixed(1)} ★</span>{" "}
              <span className="text-muted-foreground">
                · {od.ratingCount} reviews · {od.shiftsCompleted} shifts completed
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              New on NotifEyes · {od.shiftsCompleted} shifts completed
            </p>
          )}
        </div>
      </header>

      {od.bio ? (
        <section className="mt-6 ne-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            About
          </h2>
          <p className="mt-2 text-sm whitespace-pre-wrap">{od.bio}</p>
        </section>
      ) : null}

      <section className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="ne-card">
          <h3 className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
            EHR experience
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {od.ehrExperience.length === 0 ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              od.ehrExperience.map((e) => (
                <span key={e} className="ne-pill border-border">
                  {e}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="ne-card">
          <h3 className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
            Specialties
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {od.specialties.length === 0 ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              od.specialties.map((e) => (
                <span key={e} className="ne-pill border-border">
                  {e}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 ne-card">
        <h3 className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
          Credentials
        </h3>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <CredRow label="License" present={!!od.licenseDocUrl} />
          <CredRow label="DEA" present={!!od.deaUrl} />
          <CredRow label="Malpractice" present={!!od.malpracticeUrl} />
          <CredRow label="CPR" present={!!od.cprUrl} />
          <CredRow label="NPI" present={!!od.npiNumber} />
          <CredRow label="ID verified" present={!!od.idVerifiedAt} />
        </ul>
      </section>
    </div>
  );
}

function CredRow({ label, present }: { label: string; present: boolean }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          present
            ? "text-green-900 ne-pill border-green-500/40 bg-green-100/60"
            : "text-muted-foreground ne-pill border-border"
        }
      >
        {present ? "On file" : "—"}
      </span>
    </li>
  );
}
