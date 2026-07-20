/**
 * E2E: Dispatch Integrity — Busy Provider Exclusion
 *
 * Tests that providers with provider_status = 'busy' (mid-job) are NOT
 * included in dispatch results from find_providers_nearby.
 *
 * BUG: find_providers_nearby only checks online_status, not provider_status.
 * A busy provider still receives new job notifications.
 *
 * TDD: These tests MUST fail before the fix, proving the bug exists.
 */
import { test, expect } from '@playwright/test';
import { createTestPair, signInByCookie, deleteTestUsers } from './helpers/auth';
import {
  createServiceRequest,
  cleanTestData,
  getPool,
  createProviderWithStatus,
  cleanupDispatchTest,
} from './helpers/db';
import type { TestUser } from './helpers/auth';

let customer: TestUser;
let provider: TestUser;

test.describe('Dispatch Integrity: Busy Provider Exclusion', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const pair = await createTestPair('dispatch');
    customer = pair.customer;
    provider = pair.provider;
  });

  test.afterAll(async () => {
    await cleanupDispatchTest(provider.id).catch(() => {});
    await cleanTestData(customer.id, provider.id).catch(() => {});
    await deleteTestUsers([customer, provider]).catch(() => {});
  });

  test('Busy provider must NOT appear in find_providers_nearby results', async () => {
    const pool = getPool();

    // Setup: provider is online, has wallet balance, but provider_status = 'busy'
    await createProviderWithStatus(provider.id, {
      onlineStatus: true,
      providerStatus: 'busy',
      serviceType: 'Plumbing',
      latitude: 33.6844,
      longitude: 73.0479,
      walletBalance: 100,
    });

    // Act: call find_providers_nearby at the same location
    const { rows } = await pool.query(
      `SELECT user_id FROM find_providers_nearby(33.6844, 73.0479, 5000, 'Plumbing')`
    );

    // ASSERT: Busy provider must NOT be in the results
    // This will FAIL before the fix (proving the bug), and PASS after
    const userIds = rows.map((r: any) => r.user_id);
    expect(userIds).not.toContain(provider.id);
  });

  test('Regression: create_service_request_with_notifications excludes busy providers', async () => {
    const pool = getPool();

    // Setup: provider is online, has wallet, but busy
    await createProviderWithStatus(provider.id, {
      onlineStatus: true,
      providerStatus: 'busy',
      serviceType: 'Plumbing',
      latitude: 33.6844,
      longitude: 73.0479,
      walletBalance: 100,
    });

    // Verify: create_service_request_with_notifications checks provider_status = 'available'
    // by reading the function definition and confirming the WHERE clause
    const { rows: funcRows } = await pool.query(
      `SELECT pg_get_functiondef(p.oid) as definition
       FROM pg_proc p
       JOIN pg_namespace n ON p.pronamespace = n.oid
       WHERE n.nspname = 'public'
       AND p.proname = 'create_service_request_with_notifications'`
    );

    const definition = funcRows[0]?.definition || '';
    // The function should check provider_status = 'available' in its nearby CTE
    expect(definition).toContain("'available'");
    expect(definition).toContain('provider_status');
  });

  test('Stuck busy provider with stale accepted request must be excluded', async () => {
    const pool = getPool();

    // Setup: provider is online, has wallet, but busy with a stale request
    await createProviderWithStatus(provider.id, {
      onlineStatus: true,
      providerStatus: 'busy',
      serviceType: 'Plumbing',
      latitude: 33.6844,
      longitude: 73.0479,
      walletBalance: 100,
    });

    // Create a request that is stuck in 'accepted' status
    const requestId = await createServiceRequest(customer.id, provider.id);

    // Verify provider is busy
    const { rows: beforeRows } = await pool.query(
      `SELECT provider_status FROM ustaz_registrations WHERE "userId" = $1`,
      [provider.id]
    );
    expect(beforeRows[0].provider_status).toBe('busy');

    // Stale the request (set created_at to 45 minutes ago)
    await pool.query(
      `UPDATE service_requests SET created_at = NOW() - INTERVAL '45 minutes' WHERE id = $1`,
      [requestId]
    );

    // Act: try to find providers — busy provider should be excluded
    const { rows: dispatchRows } = await pool.query(
      `SELECT user_id FROM find_providers_nearby(33.6844, 73.0479, 5000, 'Plumbing')`
    );
    const dispatchedIds = dispatchRows.map((r: any) => r.user_id);

    // ASSERT: Busy provider must NOT be dispatched
    // Before fix: this FAILS (bug exists)
    // After fix + release_stuck_providers: this PASSES
    expect(dispatchedIds).not.toContain(provider.id);
  });
});
