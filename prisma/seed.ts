import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Dev-only seed password so the auth flow is testable without the invite flow.
const DEV_PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@9stack.local" },
    update: {},
    create: { name: "Admin", email: "admin@9stack.local", role: "ADMIN", status: "ACTIVE", passwordHash },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@9stack.local" },
    update: {},
    create: { name: "Manager", email: "manager@9stack.local", role: "MANAGER", status: "ACTIVE", passwordHash },
  });

  const freelancerA = await prisma.user.upsert({
    where: { email: "freelancer.a@9stack.local" },
    update: {},
    create: {
      name: "Freelancer A",
      email: "freelancer.a@9stack.local",
      role: "FREELANCER",
      status: "ACTIVE",
      passwordHash,
      defaultCostRate: 150000, // 150k VND/hour
      defaultBillableRate: 300000, // 300k VND/hour
    },
  });

  const freelancerB = await prisma.user.upsert({
    where: { email: "freelancer.b@9stack.local" },
    update: {},
    create: {
      name: "Freelancer B",
      email: "freelancer.b@9stack.local",
      role: "FREELANCER",
      status: "ACTIVE",
      passwordHash,
      defaultCostRate: 120000,
      defaultBillableRate: 250000,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@9stack.local" },
    update: {},
    create: {
      name: "Nhân viên A",
      email: "employee@9stack.local",
      role: "EMPLOYEE",
      status: "ACTIVE",
      passwordHash,
      defaultCostRate: 100000,
      defaultBillableRate: 220000,
    },
  });

  const client = await prisma.client.upsert({
    where: { id: "seed-client-acme" },
    update: {},
    create: { id: "seed-client-acme", name: "Acme Co", contact: "ops@acme.example" },
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project-website" },
    update: {},
    create: { id: "seed-project-website", clientId: client.id, name: "Acme Website", status: "ACTIVE" },
  });

  await prisma.task.upsert({
    where: { id: "seed-task-design" },
    update: {},
    create: { id: "seed-task-design", projectId: project.id, name: "Design" },
  });
  await prisma.task.upsert({
    where: { id: "seed-task-build" },
    update: {},
    create: { id: "seed-task-build", projectId: project.id, name: "Build" },
  });

  await prisma.assignment.upsert({
    where: { projectId_userId: { projectId: project.id, userId: freelancerA.id } },
    update: {},
    create: { projectId: project.id, userId: freelancerA.id },
  });
  await prisma.assignment.upsert({
    where: { projectId_userId: { projectId: project.id, userId: freelancerB.id } },
    update: {},
    create: { projectId: project.id, userId: freelancerB.id },
  });
  await prisma.assignment.upsert({
    where: { projectId_userId: { projectId: project.id, userId: employee.id } },
    update: {},
    create: { projectId: project.id, userId: employee.id },
  });

  await prisma.fixedCost.upsert({
    where: { id: "seed-fixed-office" },
    update: {},
    create: {
      id: "seed-fixed-office",
      name: "Office rent",
      category: "Rent",
      monthlyAmount: 20000000, // 20M VND/month
      effectiveFrom: new Date("2026-01-01"),
    },
  });

  await prisma.expense.upsert({
    where: { id: "seed-expense-office-supplies" },
    update: {},
    create: {
      id: "seed-expense-office-supplies",
      projectId: project.id,
      category: "Văn phòng phẩm",
      kind: "REGULAR",
      amount: 1500000,
      date: new Date("2026-06-05"),
      loggedById: manager.id,
    },
  });
  await prisma.expense.upsert({
    where: { id: "seed-expense-equipment-repair" },
    update: {},
    create: {
      id: "seed-expense-equipment-repair",
      category: "Sửa thiết bị", // company-level, one-off
      kind: "IRREGULAR",
      amount: 5000000,
      date: new Date("2026-06-12"),
      loggedById: manager.id,
    },
  });

  console.log("Seed complete. Dev login password for all users:", DEV_PASSWORD);
  console.log("Users:", [admin.email, manager.email, employee.email, freelancerA.email, freelancerB.email]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
