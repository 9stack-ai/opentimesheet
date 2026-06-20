import { test, expect, type Page } from "@playwright/test";

const PASSWORD = "password123";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
}

async function signOut(page: Page, userName: string) {
  // User menu lives in the sidebar footer (NavUser dropdown).
  await page.getByRole("button", { name: new RegExp(userName) }).click();
  await page.getByText("Đăng xuất").click();
  await page.waitForURL("/login");
}

// Exercises the value chain on seeded data (freelancer.a assigned to "Acme Website",
// cost 150k, billable 300k). NOT idempotent — run against a freshly migrated + seeded DB.
test("luồng tiền: ghi công → gửi duyệt → duyệt → chi trả", async ({ page }) => {
  // Freelancer logs 2h and submits the period.
  await login(page, "freelancer.a@9stack.local");
  await page.goto("/timesheet");
  await page.getByPlaceholder("Số giờ").fill("2");
  await page.getByRole("button", { name: "Ghi công" }).click();
  await expect(page.getByText("Nháp").first()).toBeVisible();
  await page.getByRole("button", { name: /Gửi duyệt/ }).click();
  await signOut(page, "Freelancer A");

  // Manager approves (snapshots the rates).
  await login(page, "manager@9stack.local");
  await page.goto("/manager/approvals");
  await expect(page.getByText("Freelancer A").first()).toBeVisible();
  await page.getByRole("button", { name: "Duyệt mục đã chọn" }).click();

  // Payout report reflects the approved time (cost-rate based).
  await page.goto("/manager/reports/payout");
  const row = page.getByRole("row", { name: /Freelancer A/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText("₫");
});
