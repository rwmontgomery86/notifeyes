import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { practices } from "@/db/schema";
import { ShiftForm } from "./ShiftForm";

export const metadata = { title: "Post a shift · NotifEyes" };

export default async function PostShiftPage() {
  const session = await auth();
  if (!session?.user.practiceId) redirect("/p/dashboard");

  const [practice] = await db
    .select()
    .from(practices)
    .where(eq(practices.id, session.user.practiceId))
    .limit(1);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Post a shift</h1>
      <p className="mt-1 text-muted-foreground">
        Fill in the basics — once you click <em>Post</em>, NotifEyes pings every
        OD watching this area within seconds.
      </p>
      <ShiftForm practiceCity={practice?.city ?? null} />
    </div>
  );
}
