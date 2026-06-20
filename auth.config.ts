import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/roles";
import { atLeastManager } from "@/lib/roles";

// Edge-safe config (no Prisma / bcrypt). Shared by middleware and the node auth.ts.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // Credentials provider is added in auth.ts (needs the node runtime)
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as Role) ?? "FREELANCER";
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      if (pathname === "/login" || pathname.startsWith("/set-password")) {
        return true;
      }
      if (!isLoggedIn) return false; // -> redirect to /login

      if (pathname.startsWith("/admin")) return role === "ADMIN";
      if (pathname.startsWith("/manager")) return atLeastManager(role);
      return true;
    },
  },
} satisfies NextAuthConfig;
