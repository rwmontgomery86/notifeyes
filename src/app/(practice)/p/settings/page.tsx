import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { practices, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { PracticeSettingsForm } from "./PracticeSettingsForm";

export const metadata = { title: "Practice settings · NotifEyes" };
export const dynamic = "force-dynamic";

export default async function PracticeSettingsPage() {
  const session = await auth();
  if (!session?.user.practiceId) redirect("/p/dashboard");
  const [p] = await db
    .select()
    .from(practices)
    .where(eq(practices.id, session.user.practiceId))
    .limit(1);
  if (!p) redirect("/p/dashboard");

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

  return (
    <div>
      <h1 className="text-2xl font-bold">Practice settings</h1>
      <p className="mt-1 text-muted-foreground">
        How ODs see your practice. Keep this current — listings with full
        details book faster.
      </p>
      <PracticeSettingsForm
        initial={{
          id: p.id,
          name: p.name,
          dba: p.dba,
          bio: p.bio,
          yearEstablished: p.yearEstablished,
          chairs: p.chairs,
          ehr: p.ehr,
          services: p.services,
          addressLine: p.addressLine,
          city: p.city,
          state: p.state,
          zip: p.zip,
          photos: p.photos,
          email: u?.email ?? "",
          phone: u?.phone ?? null,
          emailOptedIn: u?.emailOptedIn ?? false,
          smsOptedIn: u?.smsOptedIn ?? false,
          marketingOptedIn: u?.marketingOptedIn ?? false,
          hasLocation: p.location != null,
        }}
      />
    </div>
  );
}
