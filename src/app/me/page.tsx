import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { optometrists } from "@/db/schema";

/**
 * Role-routing redirect. Not a real page — clients (login form, "Dashboard"
 * links, post-signup) push to /me and we 307 them to the right surface.
 *
 *   od        → /d/welcome until verified (the setup home, usable while
 *               verification is pending), then /d/shifts
 *   admin     → /admin/verifications
 *   practice  → /p/dashboard  (default)
 *   no role   → /login
 */
export default async function MePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role === "od") {
    const verified = await odVerified(session.user.odId);
    redirect(verified ? "/d/shifts" : "/d/welcome");
  }
  if (role === "admin") redirect("/admin/verifications");
  redirect("/p/dashboard");
}

// Until an OD is verified they can't apply, so the browse page is a dead end —
// route them to the setup home instead. Once verified, /d/shifts is home (it
// already nudges watch-zone creation for those who haven't drawn one yet).
async function odVerified(
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
  return !!me && me.verificationStatus === "verified" && !!me.verifiedAt;
}
