/**
 * E2E: Cancellation Flow
 *
 * Tests:
 * 1. Customer cancels a request from the /process page
 * 2. Provider no-show cancellation via RPC (DB-level test)
 * 3. Provider status reset after cancellation
 */
import { test, expect } from '@playwright/test';
import { createTestPair, signInByCookie, deleteTestUsers } from './helpers/auth';
import { createServiceRequest, cleanTestData, advanceRequestStatus, getPool } from './helpers/db';
import type { TestUser } from './helpers/auth';

let customer: TestUser;
let provider: TestUser;
let requestId: string;

test.describe('Cancellation Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const pair = await createTestPair('cancel-flow');
    customer = pair.customer;
    provider = pair.provider;
  });

  test.afterAll(async () => {
    await cleanTestData(customer.id, provider.id).catch(() => {});
    await deleteTestUsers([customer, provider]).catch(() => {});
  });

  test('Scenario A: Customer cancels request from /process page', async ({ browser }) => {
    // Create a fresh request for this test
    requestId = await createServiceRequest(customer.id, provider.id);

    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await signInByCookie(ctx, customer.email);
    await page.goto('/process');
    await page.waitForLoadState('networkidle');

    // Wait for the cancel button to appear
    const cancelBtn = page.getByRole('button', { name: /cancel|cancel request/i });
    await expect(cancelBtn).toBeVisible({ timeout: 15_000 });

    // Click cancel
    await cancelBtn.click();

    // Should see cancellation confirmation
    await expect(page.getByText(/cancelled|cancelled successfully/i)).toBeVisible({ timeout: 10_000 });

    // Verify DB: request status is cancelled
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT status FROM service_requests WHERE id = $1`,
      [requestId],
    );
    expect(rows[0]?.status).toBe('cancelled');

    await ctx.close();
  });

  test('Scenario B: Provider no-show cancellation via DB (RPC path test)', async () => {
    // Create a new request that will reach 'arrived' state
    const noShowRequestId = await createServiceRequest(customer.id, provider.id);
    await advanceRequestStatus(noShowRequestId, 'arriving', provider.id);
    await advanceRequestStatus(noShowRequestId, 'arrived', provider.id);

    // Cancel via DB (simulating 15-min no-show)
    const result = await advanceRequestStatus(noShowRequestId, 'cancelled', provider.id, customer.id);
    expect(result.success).toBe(true);

    // Verify DB: request cancelled, provider available
    const pool = getPool();
    const { rows: srRows } = await pool.query(
      `SELECT status FROM service_requests WHERE id = $1`,
      [noShowRequestId],
    );
    expect(srRows[0]?.status).toBe('cancelled');

    const { rows: regRows } = await pool.query(
      `SELECT provider_status FROM ustaz_registrations WHERE userId = $1`,
      [provider.id],
    );
    expect(regRows[0]?.provider_status).toBe('available');

    // Clean up this request
    await pool.query(`DELETE FROM service_requests WHERE id = $1`, [noShowRequestId]);
  });
});
