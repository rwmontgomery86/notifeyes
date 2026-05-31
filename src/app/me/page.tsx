import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { optometrists, watchZones } from "@/db/schema";

/**
 * Role-routing redirect. Not a real page — clients (login form, "Dashboard"
 * links, post-signup) push to /me and we 307 them to the right surface.
 *
 *   od        → /d/welcome while setup is incomplete (unverified or no active
 *               watch zone), otherwise /d/shifts
 *   admin     → /admin/verifications
 *   practice  → /p/dashboard  (default)
 *   no role   → /login
 */
export default async function MePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role === "od") {
    const done = await odSetupComplete(session.user.odId);
    redirect(done ? "/d/shifts" : "/d/welcome");
  }
  if (role === "admin") redirect("/admin/verifications");
  redirect("/p/dashboard");
}

// An OD's setup is "complete" once they're verified AND have at least one
// active watch zone — until then, route them to the setup home rather than
// the dead-end browse page.
async function odSetupComplete(
  odId: string | null | undefined,
): Promise<boolean> {
  if (!odId) return false;
  const [me] = await db
    .select({
      verificationStatus: optometrists.verificationStatus,
      verifiedAt: optometrists.verifiedAt,
    })
    .from(optometrists)
    .where(eq(optometrists.id, odId))
    .limit(1);
  if (!me || me.verificationStatus !== "verified" || !me.verifiedAt) {
    return false;
  }
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(watchZones)
    .where(and(eq(watchZones.odId, odId), eq(watchZones.paused, false)));
  return count > 0;
}
