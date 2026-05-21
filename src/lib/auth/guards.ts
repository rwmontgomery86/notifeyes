import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { optometrists } from "@/db/schema";
import { auth } from "./index";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function requirePractice() {
  const session = await requireSession();
  const role = session.user.role;
  if (role !== "practice_owner" && role !== "practice_scheduler" && role !== "admin") {
    throw new Error("Forbidden: practice account required");
  }
  if (!session.user.practiceId && role !== "admin") {
    throw new Error("No practice associated with this user");
  }
  return session;
}

export async function requireOd() {
  const session = await requireSession();
  const role = session.user.role;
  if (role !== "od" && role !== "admin") {
    throw new Error("Forbidden: OD account required");
  }
  if (!session.user.odId && role !== "admin") {
    throw new Error("No OD profile associated with this user");
  }
  return session;
}

export async function requireVerifiedOd() {
  const session = await requireOd();
  if (session.user.role === "admin") return session;
  const odId = session.user.odId!;
  const [od] = await db
    .select({ status: optometrists.verificationStatus, verifiedAt: optometrists.verifiedAt })
    .from(optometrists)
    .where(eq(optometrists.id, odId))
    .limit(1);
  if (!od || od.status !== "verified" || !od.verifiedAt) {
    throw new Error("Forbidden: OD verification required before applying");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    throw new Error("Forbidden: admin required");
  }
  return session;
}
