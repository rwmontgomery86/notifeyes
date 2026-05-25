"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { odPracticeBlocks } from "@/db/schema";
import { requireOd } from "@/lib/auth/guards";

export async function blockPractice(practiceId: string) {
  const session = await requireOd();
  await db
    .insert(odPracticeBlocks)
    .values({ odId: session.user.odId!, practiceId })
    .onConflictDoNothing();
  return { ok: true as const };
}

export async function unblockPractice(practiceId: string) {
  const session = await requireOd();
  await db
    .delete(odPracticeBlocks)
    .where(
      and(
        eq(odPracticeBlocks.odId, session.user.odId!),
        eq(odPracticeBlocks.practiceId, practiceId),
      ),
    );
  return { ok: true as const };
}
