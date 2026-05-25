import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { odPracticeBlocks, optometrists, practices, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { OdProfileEditor } from "./OdProfileEditor";

export const metadata = { title: "My profile · NotifEyes" };
export const dynamic = "force-dynamic";

export default async function OdProfilePage() {
  const session = await auth();
  if (!session?.user.odId) redirect("/d/shifts");
  const [me] = await db
    .select()
    .from(optometrists)
    .where(eq(optometrists.id, session.user.odId))
    .limit(1);
  if (!me) redirect("/d/shifts");

  const [u] = await db
    .select({
      email: users.email,
      phone: users.phone,
      emailOptedIn: users.emailOptedIn,
      smsOptedIn: users.smsOptedIn,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const blocked = await db
    .select({
      practiceId: odPracticeBlocks.practiceId,
      practiceName: practices.name,
      blockedAt: odPracticeBlocks.blockedAt,
    })
    .from(odPracticeBlocks)
    .innerJoin(practices, eq(practices.id, odPracticeBlocks.practiceId))
    .where(eq(odPracticeBlocks.odId, session.user.odId))
    .orderBy(desc(odPracticeBlocks.blockedAt));

  return (
    <div>
      <h1 className="text-2xl font-bold">My profile</h1>
      <p className="mt-1 text-muted-foreground">
        How practices see you. The richer this is, the better your booking rate.
      </p>
      <OdProfileEditor
        initial={{
          id: me.id,
          name: me.name,
          displayName: me.displayName,
          headshotUrl: me.headshotUrl,
          bio: me.bio,
          travelRadiusMi: me.travelRadiusMi,
          licenseState: me.licenseState,
          licenseNumber: me.licenseNumber,
          licenseDocUrl: me.licenseDocUrl,
          deaUrl: me.deaUrl,
          malpracticeUrl: me.malpracticeUrl,
          cprUrl: me.cprUrl,
          npiNumber: me.npiNumber,
          ehrExperience: me.ehrExperience,
          specialties: me.specialties,
          verificationStatus: me.verificationStatus,
          verifiedAt: me.verifiedAt?.toISOString() ?? null,
          verificationNotes: me.verificationNotes,
          email: u?.email ?? "",
          phone: u?.phone ?? null,
          emailOptedIn: u?.emailOptedIn ?? false,
          smsOptedIn: u?.smsOptedIn ?? false,
        }}
        blocked={blocked.map((b) => ({
          practiceId: b.practiceId,
          practiceName: b.practiceName,
        }))}
      />
    </div>
  );
}
