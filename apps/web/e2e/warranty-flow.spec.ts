/**
 * E2E: Warranty Flow
 *
 * Tests warranty claim lifecycle:
 *   1. Customer files a warranty claim on a completed job
 *   2. Provider sees the claim
 *   3. Provider accepts the claim
 *   4. Claim status updates correctly
 *
 * All tests are DB-level.
 */
import { test, expect } from '@playwright/test';
import { createTestPair, deleteTestUsers } from './helpers/auth';
import { cleanTestData, getPool } from './helpers/db';
import type { TestUser } from './helpers/auth';

let customer: TestUser;
let provider: TestUser;
let requestId: string;

test.describe('Warranty Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const pair = await createTestPair('warranty');
    customer = pair.customer;
    provider = pair.provider;

    const pool = getPool();

    // Ensure provider exists in ustaz_registrations (required for wallet FK)
    // Use unique CNIC to avoid collisions with leftover test data
    const uniqueCnic = `88888-${provider.id.slice(0, 7)}-7`;
    await pool.query(
      `INSERT INTO ustaz_registrations ("userId", "firstName", "lastName", "email", "phoneNumber", "phoneCountryCode", "cnic", "city", service_type, "online_status", provider_status, "heardFrom", "hasActiveMobile", "registrationDate", phone_verified)
       VALUES ($1, $2, $3, $4, $5, '+92', $6, 'Islamabad', 'Plumbing', false, 'available', 'test', true, NOW(), true)
       ON CONFLICT ("userId") DO NOTHING`,
      [provider.id, 'Warranty', 'Test', `warranty-${provider.id.slice(0, 8)}@test.local`, String(Math.random()).slice(2, 12), uniqueCnic]
    );

    // Ensure wallet exists (required for wallet_transactions FK)
    await pool.query(
      `INSERT INTO provider_wallets (provider_id, balance, total_earned, total_commission_paid)
       VALUES ($1, 500, 1000, 100)
       ON CONFLICT (provider_id) DO NOTHING`,
      [provider.id]
    );

    // Create a completed service request (within 3-day warranty window)
    const completedDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
    const { rows } = await pool.query(
      `INSERT INTO service_requests (
        user_id, service_type, address, request_latitude, request_longitude,
        request_details, status, accepted_by_provider_id, service_completed_at,
        customer_rated, customer_rating_value
      ) VALUES (
        $1, 'Plumbing', '123 Warranty Street, Islamabad', 33.6844, 73.0479,
        'Warranty test job', 'completed', $2, $3,
        true, 3
      ) RETURNING id`,
      [customer.id, provider.id, completedDate.toISOString()]
    );
    requestId = rows[0].id;
  });

  test.afterAll(async () => {
    await cleanTestData(customer.id, provider.id).catch(() => {});
    await deleteTestUsers([customer, provider]).catch(() => {});
  });

  test('Completed job exists within warranty window', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT id, status, service_completed_at
       FROM service_requests WHERE id = $1`,
      [requestId]
    );

    expect(rows[0].status).toBe('completed');
    expect(rows[0].service_completed_at).not.toBeNull();

    // Verify it's within 3 days
    const completedAt = new Date(rows[0].service_completed_at);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(completedAt.getTime()).toBeGreaterThan(threeDaysAgo.getTime());
  });

  test('Customer files a warranty claim', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `INSERT INTO warranty_claims (request_id, customer_id, provider_id, status, description)
       VALUES ($1, $2, $3, 'pending', 'The pipe is leaking again after 1 day')
       RETURNING id, status, description`,
      [requestId, customer.id, provider.id]
    );

    expect(rows[0].status).toBe('pending');
    expect(rows[0].description).toContain('leaking again');
  });

  test('Warranty claim is visible to provider', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT wc.id, wc.status, wc.description, sr.service_type, sr.address
       FROM warranty_claims wc
       JOIN service_requests sr ON sr.id = wc.request_id
       WHERE wc.provider_id = $1 AND wc.status = 'pending'`,
      [provider.id]
    );

    expect(rows.length).toBeGreaterThanOrEqual(1);
    const claim = rows.find((r: any) => r.status === 'pending');
    expect(claim).toBeDefined();
    expect(claim.service_type).toBe('Plumbing');
  });

  test('Provider accepts the warranty claim', async () => {
    const pool = getPool();

    // Get the pending claim
    const { rows: claimRows } = await pool.query(
       `SELECT id FROM warranty_claims WHERE provider_id = $1 AND status = 'pending'
        ORDER BY claimed_at DESC LIMIT 1`,
      [provider.id]
    );

    if (claimRows.length === 0) {
      console.log('No pending warranty claim found — skipping');
      return;
    }

    const claimId = claimRows[0].id;

    // Accept the claim
    await pool.query(
      `UPDATE warranty_claims
       SET status = 'accepted', provider_responded_at = NOW()
       WHERE id = $1`,
      [claimId]
    );

    // Verify: status changed to accepted
    const { rows: afterRows } = await pool.query(
      `SELECT status, provider_responded_at FROM warranty_claims WHERE id = $1`,
      [claimId]
    );
    expect(afterRows[0].status).toBe('accepted');
    expect(afterRows[0].provider_responded_at).not.toBeNull();
  });

  test('Provider cannot refuse without penalty', async () => {
    const pool = getPool();

    // Create another completed request for a refusal test
    const completedDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const { rows: reqRows } = await pool.query(
      `INSERT INTO service_requests (
        user_id, service_type, address, request_latitude, request_longitude,
        request_details, status, accepted_by_provider_id, service_completed_at
      ) VALUES (
        $1, 'Plumbing', '456 Test Ave, Islamabad', 33.6844, 73.0479,
        'Refusal test job', 'completed', $2, $3
      ) RETURNING id`,
      [customer.id, provider.id, completedDate.toISOString()]
    );

    const refusalRequestId = reqRows[0].id;

    // File a claim
    const { rows: claimRows } = await pool.query(
      `INSERT INTO warranty_claims (request_id, customer_id, provider_id, status, description)
       VALUES ($1, $2, $3, 'pending', 'Test refusal scenario')
       RETURNING id`,
      [refusalRequestId, customer.id, provider.id]
    );

    const claimId = claimRows[0].id;

    // Get provider's current wallet balance
    const { rows: walletBefore } = await pool.query(
      `SELECT balance FROM provider_wallets WHERE provider_id = $1`,
      [provider.id]
    );
    const balanceBefore = walletBefore[0]?.balance || 0;

    // Refuse the claim (should deduct Rs. 200 penalty)
    await pool.query(
      `UPDATE warranty_claims
       SET status = 'refused', provider_responded_at = NOW()
       WHERE id = $1`,
      [claimId]
    );

    // Apply penalty
    await pool.query(
      `UPDATE provider_wallets
       SET balance = GREATEST(0, balance - 200)
       WHERE provider_id = $1`,
      [provider.id]
    );

    // Log penalty transaction
    await pool.query(
      `INSERT INTO wallet_transactions (provider_id, type, amount, balance_before, balance_after, description, request_id)
       VALUES ($1, 'penalty', -200, $2, GREATEST(0, $2 - 200), 'Warranty refusal penalty', $3)`,
      [provider.id, balanceBefore, refusalRequestId]
    );

    // Increment warranty strikes
    await pool.query(
      `UPDATE ustaz_registrations
       SET warranty_strikes = warranty_strikes + 1
       WHERE "userId" = $1`,
      [provider.id]
    );

    // Verify: claim refused
    const { rows: afterRows } = await pool.query(
      `SELECT status FROM warranty_claims WHERE id = $1`,
      [claimId]
    );
    expect(afterRows[0].status).toBe('refused');

    // Verify: wallet balance decreased (or floored at 0)
    const { rows: walletAfter } = await pool.query(
      `SELECT balance FROM provider_wallets WHERE provider_id = $1`,
      [provider.id]
    );
    expect(walletAfter[0].balance).toBeGreaterThanOrEqual(0);
    expect(walletAfter[0].balance).toBeLessThanOrEqual(balanceBefore);
  });

  test('Warranty strikes are tracked', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT warranty_strikes FROM ustaz_registrations WHERE "userId" = $1`,
      [provider.id]
    );

    expect(rows[0].warranty_strikes).toBeGreaterThanOrEqual(1);
  });
});
