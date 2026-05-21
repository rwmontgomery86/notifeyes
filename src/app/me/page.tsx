import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Role-routing redirect. Not a real page — clients (login form, "Dashboard"
 * links, post-signup) push to /me and we 307 them to the right surface.
 *
 *   od        → /d/shifts
 *   admin     → /admin/verifications
 *   practice  → /p/dashboard  (default)
 *   no role   → /login
 */
export default async function MePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role === "od") redirect("/d/shifts");
  if (role === "admin") redirect("/admin/verifications");
  redirect("/p/dashboard");
}
