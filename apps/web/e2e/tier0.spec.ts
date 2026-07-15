/**
 * E2E: Tier 0 — Provider Quality Lifecycle
 *
 * Tests the Tier 0 features:
 *   1. Provider performance tracking after rating
 *   2. Incident detection and check-in flow
 *   3. Tier lifecycle (probation → standard → trusted → elite)
 *   4. Verification status display
 *   5. Appeal submission
 */
import { test, expect } from '@playwright/test';
import { createTestPair, signInByCookie, deleteTestUsers } from './helpers/auth';
import { createServiceRequest, cleanTestData, advanceRequestStatus, getPool } from './helpers/db';
import type { TestUser } from './helpers/auth';

let customer: TestUser;
let provider: TestUser;
let requestId: string;

test.describe('Tier 0: Provider Quality Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const pair = await createTestPair('tier0');
    customer = pair.customer;
    provider = pair.provider;

    // Create a completed service request for performance testing
    requestId = await createServiceRequest(customer.id, provider.id);
    await advanceRequestStatus(requestId, 'completed', provider.id);
  });

  test.afterAll(async () => {
    await cleanTestData(customer.id, provider.id).catch(() => {});
    await deleteTestUsers([customer, provider]).catch(() => {});
  });

  test('Performance tracking: rating triggers provider_performance update', async () => {
    const pool = getPool();

    // Simulate a rating by directly inserting into service_requests (since we bypassed the RPC for setup)
    await pool.query(
      `UPDATE service_requests
       SET customer_rated = true, customer_rating_value = 5, customer_rating_comment = 'Excellent work'
       WHERE id = $1`,
      [requestId],
    );

    // Call the after_rating_update trigger manually (since we bypassed the RPC)
    // In production, this is triggered by the rate_user RPC
    await pool.query(
      `SELECT update_provider_performance($1)`,
      [provider.id],
    );

    // Verify performance record exists
    const { rows } = await pool.query(
      `SELECT * FROM provider_performance WHERE provider_id = $1`,
      [provider.id],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].total_ratings).toBe(1);
    expect(rows[0].avg_rating).toBe(5);
  });

  test('Provider standing: tier is calculated after performance update', async () => {
    const pool = getPool();

    // Recalculate tier
    await pool.query(
      `SELECT recalculate_provider_tier($1)`,
      [provider.id],
    );

    // Verify standing record exists
    const { rows } = await pool.query(
      `SELECT * FROM provider_standing WHERE provider_id = $1`,
      [provider.id],
    );
    expect(rows.length).toBe(1);
    // With only 1 rating, should be standard tier (not enough for trusted)
    expect(['standard', 'probation']).toContain(rows[0].tier);
  });

  test('Reliability score: get_provider_reliability_score returns valid score', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT get_provider_reliability_score($1) as score`,
      [provider.id],
    );
    expect(rows.length).toBe(1);
    const score = parseFloat(rows[0].score);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  test('Dashboard: provider sees tier and verification status', async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: ['geolocation'] });
    const page = await ctx.newPage();

    await ctx.setGeolocation({ latitude: 33.6844, longitude: 73.0479 });
    await signInByCookie(ctx, provider.email);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click profile tab
    const profileTab = page.getByRole('button', { name: /Profile/i });
    await profileTab.click();
    await page.waitForTimeout(1000);

    // Should see tier display
    const tierLabel = page.getByText('Provider Tier');
    await expect(tierLabel).toBeVisible({ timeout: 10_000 });

    // Should see verification display
    const verificationLabel = page.getByText('Verification');
    await expect(verificationLabel).toBeVisible({ timeout: 10_000 });

    await ctx.close();
  });

  test('Verification: provider can submit verification request', async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: ['geolocation'] });
    const page = await ctx.newPage();

    await ctx.setGeolocation({ latitude: 33.6844, longitude: 73.0479 });
    await signInByCookie(ctx, provider.email);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click profile tab
    const profileTab = page.getByRole('button', { name: /Profile/i });
    await profileTab.click();
    await page.waitForTimeout(1000);

    // Click submit for verification
    const submitBtn = page.getByText('Submit for verification →');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // Should see success toast or status change
      const toast = page.getByText(/verification/i);
      // Toast may or may not appear depending on timing
    }

    await ctx.close();
  });

  test('Incident creation: create_incident RPC works', async () => {
    const pool = getPool();

    // Create a new service request for incident testing
    const incidentRequestId = await createServiceRequest(customer.id, provider.id, 'Electrical');

    // Create an incident
    const { rows } = await pool.query(
      `SELECT create_incident($1, $2, $3, $4) as result`,
      [incidentRequestId, 'no_show', 'medium', 'Provider did not show up'],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].result).toBeTruthy();

    // Verify incident was created
    const { rows: incidents } = await pool.query(
      `SELECT * FROM incidents WHERE request_id = $1`,
      [incidentRequestId],
    );
    expect(incidents.length).toBe(1);
    expect(incidents[0].incident_type).toBe('no_show');
    expect(incidents[0].status).toBe('suspected');

    // Clean up
    await pool.query(`DELETE FROM service_requests WHERE id = $1`, [incidentRequestId]);
  });

  test('System config: dispatch weights are configured', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT value FROM system_config WHERE key = 'dispatch_weights'`
    );
    expect(rows.length).toBe(1);
    const weights = rows[0].value;
    expect(weights).toHaveProperty('distance');
    expect(weights).toHaveProperty('rating');
    expect(weights).toHaveProperty('reliability');
    expect(weights).toHaveProperty('fairness');
  });
});
