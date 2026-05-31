/**
 * E2E: Full State Machine Lifecycle
 *
 * Tests the provider-side workflow:
 *   accepted → arriving → arrived → in_progress → completed
 *
 * Each step opens a fresh browser context and verifies the UI responds
 * correctly to the current request status from the DB.
 *
 * IMPORTANT: Tests run serially and share DB state. Each step reads the
 * request status left by the previous step — do NOT call
 * advanceRequestStatus redundantly between steps.
 */
import { test, expect } from '@playwright/test';
import { createTestPair, signInByCookie, deleteTestUsers } from './helpers/auth';
import { createServiceRequest, cleanTestData, advanceRequestStatus, getPool } from './helpers/db';
import type { TestUser } from './helpers/auth';

let customer: TestUser;
let provider: TestUser;
let requestId: string;

test.describe('State Machine Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const pair = await createTestPair('sm-lifecycle');
    customer = pair.customer;
    provider = pair.provider;

    // Create a service request pre-accepted (status = 'accepted')
    requestId = await createServiceRequest(customer.id, provider.id);

    // Do NOT advance here — Step 1 will do the first transition via UI
  });

  test.afterAll(async () => {
    await cleanTestData(customer.id, provider.id).catch(() => {});
    await deleteTestUsers([customer, provider]).catch(() => {});
  });

  test('Step 1: Provider clicks "I\'m on my way" → arriving', async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: ['geolocation'] });
    const page = await ctx.newPage();

    await ctx.setGeolocation({ latitude: 33.6844, longitude: 73.0479 });
    await signInByCookie(ctx, provider.email);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // ArrivalWorkflow should show "I'm on my way" button (en_route step)
    const onMyWayBtn = page.getByRole('button', { name: /I'm on my way/i });
    await expect(onMyWayBtn).toBeVisible({ timeout: 15_000 });
    await onMyWayBtn.click();

    // Toast should confirm
    await expect(page.getByText(/Marked as arriving/i)).toBeVisible({ timeout: 10_000 });

    await ctx.close();
  });

  test('Step 2: Provider clicks "I\'ve arrived" → arrived + timestamp populated', async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: ['geolocation'] });
    const page = await ctx.newPage();

    await ctx.setGeolocation({ latitude: 33.6844, longitude: 73.0479 });
    await signInByCookie(ctx, provider.email);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // ArrivalWorkflow should show "I've arrived" button (still en_route step)
    const arrivedBtn = page.getByRole('button', { name: /I've arrived/i });
    await expect(arrivedBtn).toBeVisible({ timeout: 15_000 });
    await arrivedBtn.click();

    await expect(page.getByText(/You have arrived!/i)).toBeVisible({ timeout: 10_000 });

    // Verify DB: provider_arrived_at should be populated
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT provider_arrived_at FROM service_requests WHERE id = $1`,
      [requestId],
    );
    expect(rows[0]?.provider_arrived_at).not.toBeNull();

    await ctx.close();
  });

  test('Step 3: Provider clicks "Start Service" → in_progress + timer starts', async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: ['geolocation'] });
    const page = await ctx.newPage();

    await ctx.setGeolocation({ latitude: 33.6844, longitude: 73.0479 });
    await signInByCookie(ctx, provider.email);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // ArrivalWorkflow should show "Start Service" button (arrived step)
    const startBtn = page.getByRole('button', { name: /Start Service/i });
    await expect(startBtn).toBeVisible({ timeout: 15_000 });
    await startBtn.click();

    await expect(page.getByText(/Service started!/i)).toBeVisible({ timeout: 10_000 });

    // Verify DB: service_started_at populated
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT service_started_at FROM service_requests WHERE id = $1`,
      [requestId],
    );
    expect(rows[0]?.service_started_at).not.toBeNull();

    // ServiceTimer should be visible
    await expect(page.getByText(/Service Duration|Elapsed time/i)).toBeVisible({ timeout: 5_000 });

    await ctx.close();
  });

  test('Step 4: Provider clicks "Complete Service" → completed + provider status = available', async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: ['geolocation'] });
    const page = await ctx.newPage();

    await ctx.setGeolocation({ latitude: 33.6844, longitude: 73.0479 });
    await signInByCookie(ctx, provider.email);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const completeBtn = page.getByRole('button', { name: /Complete Service/i });
    await expect(completeBtn).toBeVisible({ timeout: 15_000 });
    await completeBtn.click();

    await expect(page.getByText(/Service completed!/i)).toBeVisible({ timeout: 10_000 });

    // Verify DB: service_completed_at populated, provider_status = 'available'
    const pool = getPool();
    const { rows: srRows } = await pool.query(
      `SELECT service_completed_at FROM service_requests WHERE id = $1`,
      [requestId],
    );
    expect(srRows[0]?.service_completed_at).not.toBeNull();

    const { rows: regRows } = await pool.query(
      `SELECT provider_status FROM ustaz_registrations WHERE userId = $1`,
      [provider.id],
    );
    expect(regRows[0]?.provider_status).toBe('available');

    await ctx.close();
  });
});
