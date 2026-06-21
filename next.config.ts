import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native / driver-adapter DB packages must be loaded at runtime, not bundled by Next.
  serverExternalPackages: [
    "@prisma/adapter-pg",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
    "pg",
  ],
};

export default nextConfig;
