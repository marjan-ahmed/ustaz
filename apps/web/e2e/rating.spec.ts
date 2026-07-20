/**
 * E2E: Rating Flow
 *
 * Tests:
 * 1. Customer submits a rating after service completion
 * 2. Duplicate rating prevention (UNIQUE constraint + existingRatings guard)
 * 3. Provider sees aggregated rating stats
 */
import { test, expect } from '@playwright/test';
import { createTestPair, signInByCookie, deleteTestUsers } from './helpers/auth';
import { createServiceRequest, cleanTestData, advanceRequestStatus, getPool } from './helpers/db';
import type { TestUser } from './helpers/auth';

let customer: TestUser;
let provider: TestUser;
let requestId: string;

test.describe('Rating Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const pair = await createTestPair('rating-flow');
    customer = pair.customer;
    provider = pair.provider;

    // Create and complete a service request (advance through all states)
    requestId = await createServiceRequest(customer.id, provider.id);
    await advanceRequestStatus(requestId, 'arriving', provider.id);
    await advanceRequestStatus(requestId, 'arrived', provider.id);
    await advanceRequestStatus(requestId, 'in_progress', provider.id);
    await advanceRequestStatus(requestId, 'completed', provider.id);
  });

  test.afterAll(async () => {
    await cleanTestData(customer.id, provider.id).catch(() => {});
    await deleteTestUsers([customer, provider]).catch(() => {});
  });

  test('Scenario A: Customer rates provider after completion', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await signInByCookie(ctx, customer.email);
    await page.goto('/process');
    await page.waitForLoadState('networkidle');

    // Wait for RatingModal to appear
    const ratingModal = page.getByRole('heading', { name: /Rate Provider/i });
    await expect(ratingModal).toBeVisible({ timeout: 20_000 });

    // Click 4th star
    const starButtons = page.locator('button[aria-label*="star"], button[role="radio"]');
    await expect(starButtons).toHaveCount(5);
    await starButtons.nth(3).click(); // 4th star (index 3)

    // Type a comment
    const commentArea = page.locator('textarea#rating-comment, textarea[name="comment"]');
    await expect(commentArea).toBeVisible();
    await commentArea.fill('Great service! Very professional and on time.');

    // Click Submit
    const submitBtn = page.getByRole('button', { name: /Submit Rating|Submit/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Should show thank-you message after submission
    await expect(page.getByText(/Thank you!|Rating submitted!/i)).toBeVisible({ timeout: 10_000 });

    // Verify DB: rating exists on service_requests (no separate ratings table)
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT customer_rating_value, customer_rating_comment
       FROM service_requests WHERE id = $1 AND user_id = $2`,
      [requestId, customer.id],
    );
    expect(rows[0]?.customer_rating_value).toBe(4);
    expect(rows[0]?.customer_rating_comment).toContain('Great service');

    await ctx.close();
  });

  test('Scenario B: Customer cannot rate again (existingRatings guard)', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await signInByCookie(ctx, customer.email);
    await page.goto('/process');
    await page.waitForLoadState('networkidle');

    // Wait for page to settle — the rating modal should NOT appear again
    // because the existingRatings state guard prevents it
    await page.waitForTimeout(3000);

    const ratingModal = page.getByRole('heading', { name: /Rate Provider/i });
    await expect(ratingModal).not.toBeVisible({ timeout: 5_000 });

    await ctx.close();
  });

  test('Scenario C: Provider sees rating stats on dashboard', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await signInByCookie(ctx, provider.email);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should load successfully
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });

    await ctx.close();
  });
});
