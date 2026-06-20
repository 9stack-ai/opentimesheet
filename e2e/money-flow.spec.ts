import { test, expect, type Page } from "@playwright/test";

const PASSWORD = "password123";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
}

// Exercises the full value chain on seeded data (freelancer.a assigned to "Acme Website",
// cost rate 150k, billable 300k). NOTE: not idempotent — logging adds hours each run, so
// run it against a freshly migrated + seeded database.
test("money flow: log → submit → approve → payout", async ({ page }) => {
  // Freelancer logs 2h and submits the period.
  await login(page, "freelancer.a@9stack.local");
  await page.goto("/timesheet");
  await page.getByPlaceholder("Hours").fill("2");
  await page.getByRole("button", { name: "Log time" }).click();
  await expect(page.getByText("DRAFT").first()).toBeVisible();
  await page.getByRole("button", { name: /Submit .* for approval/ }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("/login");

  // Manager approves the submitted entry (snapshots the rates).
  await login(page, "manager@9stack.local");
  await page.goto("/manager/approvals");
  await expect(page.getByRole("heading", { name: "Freelancer A" })).toBeVisible();
  await page.getByRole("button", { name: "Approve selected" }).click();

  // Payout report reflects the approved time (cost-rate based).
  await page.goto("/manager/reports/payout");
  const row = page.getByRole("row", { name: /Freelancer A/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText("₫"); // has a VND payout figure
});
