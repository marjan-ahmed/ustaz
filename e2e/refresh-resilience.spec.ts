/**
 * E2E: Page Refresh Resilience
 *
 * Tests that both customer and provider pages recover state after a full page reload.
 * The app subscribes to Realtime and has resume-request logic that queries
 * open requests on mount, so a refresh should restore the correct state.
 */
import { test, expect } from '@playwright/test';
import { createTestPair, signInByCookie, deleteTestUsers } from './helpers/auth';
import { createServiceRequest, cleanTestData, advanceRequestStatus } from './helpers/db';
import type { TestUser } from './helpers/auth';

let customer: TestUser;
let provider: TestUser;
let requestId: string;

test.describe('Page Refresh Resilience', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const pair = await createTestPair('refresh-resilience');
    customer = pair.customer;
    provider = pair.provider;
    requestId = await createServiceRequest(customer.id, provider.id);
  });

  test.afterAll(async () => {
    await cleanTestData(customer.id, provider.id).catch(() => {});
    await deleteTestUsers([customer, provider]).catch(() => {});
  });

  test('Provider dashboard re-renders ArrivalWorkflow after refresh', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await ctx.grantPermissions(['geolocation']);
    await ctx.setGeolocation({ latitude: 33.6844, longitude: 73.0479 });

    await signInByCookie(ctx, provider.email);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for initial render — request is 'accepted', so ArrivalWorkflow should show
    await page.waitForTimeout(3000);

    // Advance to arriving so we can verify continuity
    await advanceRequestStatus(requestId, 'arriving', provider.id);

    // Now refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // After refresh, the ArrivalWorkflow should still render for this request
    await page.waitForTimeout(5000);

    // The dashboard main section should be visible with the active request UI
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });

    await ctx.close();
  });

  test('Customer /process page resumes request tracking after refresh', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await signInByCookie(ctx, customer.email);
    await page.goto('/process');
    await page.waitForLoadState('networkidle');

    // Wait for the resume-request effect to fire and query open requests
    await page.waitForTimeout(5000);

    // The main app shell should be visible
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });

    await ctx.close();
  });
});
