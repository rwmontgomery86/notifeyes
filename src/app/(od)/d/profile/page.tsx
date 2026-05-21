import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { optometrists } from "@/db/schema";
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
        }}
      />
    </div>
  );
}
