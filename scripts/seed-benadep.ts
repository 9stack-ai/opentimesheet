// One-off production seed for the Benadep project. Wipes all non-admin users and
// all project/timesheet data, then recreates 8 collaborator accounts and their
// approved time entries from a JSON payload (kept out of git — internal rates).
//
//   docker compose cp benadep-seed-data.json app:/tmp/benadep-seed-data.json
//   docker compose exec app pnpm exec tsx scripts/seed-benadep.ts
//
// Re-runnable: each run resets to a clean Benadep dataset (the admin is preserved).
import "dotenv/config";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type Member = { username: string; name: string; costRate: number };
type Entry = { username: string; date: string; hours: number; note: string };
type SeedData = { password: string; members: Member[]; entries: Entry[] };

const DATA_PATH = process.env.SEED_DATA ?? "/tmp/benadep-seed-data.json";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8")) as SeedData;
  if (!data.password || !data.members?.length || !data.entries?.length) {
    throw new Error(`Invalid seed data at ${DATA_PATH}`);
  }

  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  try {
    // The admin account is the only thing we keep; it also approves the entries.
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
    });
    if (!admin) throw new Error("No ADMIN user found — aborting to avoid lockout");

    // Wipe test data in FK-safe order (admin user is kept).
    await prisma.timeEntry.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.inviteToken.deleteMany({});
    const { count: deletedUsers } = await prisma.user.deleteMany({
      where: { role: { not: "ADMIN" } },
    });
    console.log(`[seed] Wiped project data + ${deletedUsers} non-admin user(s).`);

    // Client → Project → Task (one catch-all task; per-entry work goes in note).
    const client = await prisma.client.create({ data: { name: "Benadep" } });
    const project = await prisma.project.create({
      data: { name: "Benadep", clientId: client.id, status: "ACTIVE" },
    });
    const task = await prisma.task.create({
      data: { name: "Benadep", projectId: project.id, source: "LOCAL", status: "open" },
    });

    // Accounts: FREELANCER, active, shared temp password; assigned to the project.
    const passwordHash = await bcrypt.hash(data.password, 10);
    const userId = new Map<string, string>();
    const costRate = new Map<string, number>();
    for (const m of data.members) {
      const user = await prisma.user.create({
        data: {
          name: m.name,
          email: m.username, // username login: the unique key is the username
          role: "FREELANCER",
          status: "ACTIVE",
          passwordHash,
          defaultCostRate: m.costRate,
          defaultBillableRate: 0,
        },
      });
      userId.set(m.username, user.id);
      costRate.set(m.username, m.costRate);
      await prisma.assignment.create({
        data: { projectId: project.id, userId: user.id },
      });
    }
    console.log(`[seed] Created ${data.members.length} accounts + assignments.`);

    // Time entries: APPROVED, cost-rate snapshotted; skipped for Redmine push.
    const approvedAt = new Date();
    for (const e of data.entries) {
      const uid = userId.get(e.username);
      if (!uid) throw new Error(`Entry references unknown member: ${e.username}`);
      const [y, mo, d] = e.date.split("-").map(Number);
      await prisma.timeEntry.create({
        data: {
          userId: uid,
          taskId: task.id,
          date: new Date(Date.UTC(y, mo - 1, d)),
          hours: e.hours,
          note: e.note || null,
          status: "APPROVED",
          costRateSnapshot: costRate.get(e.username) ?? 0,
          billableRateSnapshot: 0,
          taxRateSnapshot: 0,
          employerCostRateSnapshot: 0,
          approvedById: admin.id,
          approvedAt,
          redminePushStatus: "skipped",
        },
      });
    }
    console.log(`[seed] Created ${data.entries.length} approved time entries.`);
    console.log("[seed] Done.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
