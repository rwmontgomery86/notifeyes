import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { Channel } from "./types";

export interface OptInState {
  email: string | null;
  phone: string | null;
  emailOptedIn: boolean;
  smsOptedIn: boolean;
  marketingOptedIn: boolean;
}

export function hasAnyNotificationChannel(state: OptInState): boolean {
  const hasEmail = state.emailOptedIn && !!state.email;
  const hasSms = state.smsOptedIn && !!state.phone;
  return hasEmail || hasSms;
}

export function filterChannelsByOptIn(
  channels: Channel[],
  state: OptInState,
): Channel[] {
  return channels.filter((ch) => {
    if (ch === "email") return state.emailOptedIn && !!state.email;
    if (ch === "sms") return state.smsOptedIn && !!state.phone;
    return true;
  });
}

export async function getOptInState(userId: string): Promise<OptInState | null> {
  const [row] = await db
    .select({
      email: users.email,
      phone: users.phone,
      emailOptedIn: users.emailOptedIn,
      smsOptedIn: users.smsOptedIn,
      marketingOptedIn: users.marketingOptedIn,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}
