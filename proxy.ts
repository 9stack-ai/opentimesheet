import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next 16 proxy (formerly middleware): edge session check + role gating
// via authConfig.callbacks.authorized. auth() is next-auth's request handler.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|logo.svg).*)"],
};
