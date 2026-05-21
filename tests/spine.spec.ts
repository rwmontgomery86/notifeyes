import { test, expect } from "@playwright/test";

/**
 * The spine flow (§6A, minus watch alerts which arrive in M3).
 *
 * Assumes the seeded dev DB:
 *   - owner@bayview-eye-care.dev (password: password123!)
 *   - maya.patel@notifeyes.dev (verified OD)
 *
 * Run:
 *   docker compose up -d
 *   npm run db:migrate && npm run db:seed
 *   npm run test:e2e
 */

const PASSWORD = "password123!";
const PRACTICE_EMAIL = "owner@bayview-eye-care.dev";
const OD_EMAIL = "maya.patel@notifeyes.dev";

test("practice posts a shift, OD applies, practice books — both land on the booking", async ({ browser }) => {
  // === Practice posts a shift =============================================
  const practiceCtx = await browser.newContext();
  const practicePage = await practiceCtx.newPage();
  await practicePage.goto("/login");
  await practicePage.getByLabel(/email/i).fill(PRACTICE_EMAIL);
  await practicePage.getByLabel(/password/i).fill(PASSWORD);
  await practicePage.getByRole("button", { name: /log in/i }).click();
  await expect(practicePage).toHaveURL(/\/p\/dashboard/);

  await practicePage.goto("/p/shifts/new");
  // Defaults are set — just submit
  await practicePage.getByRole("button", { name: /post shift/i }).click();
  await expect(practicePage).toHaveURL(/\/p\/shifts\/[0-9a-f-]+$/);
  const shiftAdminUrl = practicePage.url();
  const shiftId = shiftAdminUrl.split("/").pop()!;

  // === OD logs in and applies =============================================
  const odCtx = await browser.newContext();
  const odPage = await odCtx.newPage();
  await odPage.goto("/login");
  await odPage.getByLabel(/email/i).fill(OD_EMAIL);
  await odPage.getByLabel(/password/i).fill(PASSWORD);
  await odPage.getByRole("button", { name: /log in/i }).click();
  await expect(odPage).toHaveURL(/\/d\/shifts/);

  await odPage.goto(`/shifts/${shiftId}`);
  await odPage.getByRole("button", { name: /^apply$/i }).click();
  await odPage
    .getByPlaceholder(/available/i)
    .fill("Available — locking it in.");
  await odPage.getByRole("button", { name: /submit application/i }).click();
  await expect(odPage.getByText(/you've applied/i)).toBeVisible();

  // === Practice books the applicant =======================================
  await practicePage.goto(shiftAdminUrl);
  await expect(practicePage.getByText(/Dr\./).first()).toBeVisible();
  await practicePage.getByRole("link", { name: /book/i }).first().click();
  await expect(practicePage).toHaveURL(/\/book\//);
  await practicePage.getByLabel(/agree to the engagement/i).check();
  await practicePage.getByRole("button", { name: /confirm and book/i }).click();
  await expect(practicePage).toHaveURL(/\/bookings\/[0-9a-f-]+$/);
  await expect(practicePage.getByText(/booking confirmed/i)).toBeVisible();
});
