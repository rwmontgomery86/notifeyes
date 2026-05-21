import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "practice_owner" | "practice_scheduler" | "od" | "admin";
      practiceId?: string | null;
      odId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "practice_owner" | "practice_scheduler" | "od" | "admin";
    practiceId?: string | null;
    odId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "practice_owner" | "practice_scheduler" | "od" | "admin";
    practiceId?: string | null;
    odId?: string | null;
    userId?: string;
  }
}
