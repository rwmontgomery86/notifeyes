import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Run on every path except internal Next.js assets, uploads, and
    // static image / font files served from public/.
    "/((?!_next/static|_next/image|favicon.ico|api/uploadthing|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)).*)",
  ],
};
