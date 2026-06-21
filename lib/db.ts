import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Dev uses SQLite (file: URL); production uses PostgreSQL (postgres:// URL).
// The adapter is chosen at runtime from the DATABASE_URL scheme so the same
// build runs in both environments without changing application code.
const isPostgres = url.startsWith("postgres://") || url.startsWith("postgresql://");
const adapter = isPostgres
  ? new PrismaPg({ connectionString: url })
  : new PrismaBetterSqlite3({ url });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
