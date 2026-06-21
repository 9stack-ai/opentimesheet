// Production-safe first-admin bootstrap. Creates an ADMIN user from environment
// variables if it does not already exist. Never overwrites an existing account,
// and never uses the dev seed password. Run once on deploy (via docker-entrypoint).
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    console.log("[bootstrap-admin] ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping.");
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`[bootstrap-admin] Admin ${email} already exists — leaving unchanged.`);
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name, email, role: "ADMIN", status: "ACTIVE", passwordHash },
    });
    console.log(`[bootstrap-admin] Created admin ${email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
