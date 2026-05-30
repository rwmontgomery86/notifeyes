import { eq } from "drizzle-orm";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/env";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Google OAuth is opt-in: only wired when both credentials are present.
const googleId = env.AUTH_GOOGLE_ID;
const googleSecret = env.AUTH_GOOGLE_SECRET;
const googleProviders =
  googleId && googleSecret
    ? [Google({ clientId: googleId, clientSecret: googleSecret })]
    : [];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(input) {
        const parsed = credentialsSchema.safeParse(input);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          role: user.role,
          practiceId: user.practiceId ?? null,
          odId: user.odId ?? null,
        };
      },
    }),
    ...googleProviders,
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Google logs in EXISTING accounts only — matched by verified email.
      // New users go through the OD/practice signup flow (which collects
      // role-specific onboarding data); we never auto-provision an account.
      if (account?.provider === "google") {
        const email = profile?.email?.toLowerCase();
        const verified = (profile as { email_verified?: boolean } | undefined)
          ?.email_verified;
        if (!email || verified !== true) return false;
        const [row] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        return Boolean(row);
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // On sign-in, `user` is set (from authorize() for credentials, or the
      // provider profile for OAuth).
      if (user) {
        const u = user as typeof user & {
          role?: string;
          practiceId?: string | null;
          odId?: string | null;
        };
        if (u.role) {
          // Credentials path — our fields are already on the user object.
          token.role = u.role;
          token.practiceId = u.practiceId ?? null;
          token.odId = u.odId ?? null;
          token.userId = u.id;
        } else if (account?.provider === "google" && user.email) {
          // OAuth path — map the verified Google email to our users row so the
          // session carries our id/role, not the Google subject id.
          const [row] = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email.toLowerCase()))
            .limit(1);
          if (row) {
            token.role = row.role;
            token.practiceId = row.practiceId ?? null;
            token.odId = row.odId ?? null;
            token.userId = row.id;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.userId as string) ?? "";
        session.user.role = token.role as
          | "practice_owner"
          | "practice_scheduler"
          | "od"
          | "admin"
          | undefined;
        session.user.practiceId = (token.practiceId as string | null) ?? null;
        session.user.odId = (token.odId as string | null) ?? null;
      }
      return session;
    },
    async authorized({ auth: session, request }) {
      const url = request.nextUrl;
      const isLoggedIn = Boolean(session?.user);
      const path = url.pathname;

      // Protected routes — everything else (incl. marketing, 404s, profile
      // pages) is public by default. Inverted gate: deny by exception.
      const protectedPrefixes = [
        "/me",
        "/p/",
        "/d/",
        "/admin/",
        "/bookings/",
        "/messages",
        "/notifications",
        "/reviews/",
      ];
      const protectedApiPrefixes = ["/api/notifications", "/api/upload"];
      const needsAuth =
        protectedPrefixes.some((p) => path.startsWith(p)) ||
        protectedApiPrefixes.some((p) => path.startsWith(p));

      if (!needsAuth) return true;

      if (!isLoggedIn) {
        const callbackUrl = encodeURIComponent(path + url.search);
        return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, url));
      }

      const role = session?.user?.role;

      // Role gates
      if (path.startsWith("/p/") && !(role === "practice_owner" || role === "practice_scheduler" || role === "admin")) {
        return Response.redirect(new URL("/d/shifts", url));
      }
      if (path.startsWith("/d/") && !(role === "od" || role === "admin")) {
        return Response.redirect(new URL("/p/dashboard", url));
      }
      if (path.startsWith("/admin/") && role !== "admin") {
        return Response.redirect(new URL("/", url));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
