import { eq } from "drizzle-orm";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

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
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, `user` is the object returned from authorize()
      if (user) {
        // user has our extended fields when fresh from authorize
        const u = user as typeof user & {
          role?: string;
          practiceId?: string | null;
          odId?: string | null;
        };
        token.role = u.role;
        token.practiceId = u.practiceId ?? null;
        token.odId = u.odId ?? null;
        token.userId = u.id;
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

      // Public routes
      const publicPrefixes = [
        "/",
        "/login",
        "/signup",
        "/api/auth",
        "/_next",
        "/favicon.ico",
      ];
      const publicExact = new Set(["/"]);
      if (publicExact.has(path)) return true;
      if (publicPrefixes.some((p) => p !== "/" && path.startsWith(p))) return true;
      // Public shift / OD / practice detail
      if (
        path.startsWith("/shifts/") ||
        path.startsWith("/ods/") ||
        path.startsWith("/practices/")
      ) {
        return true;
      }

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
