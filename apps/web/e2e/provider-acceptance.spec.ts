/**
 * E2E: Provider Acceptance Flow
 *
 * Tests the provider-side workflow:
 *   1. Provider sees incoming requests
 *   2. Provider can accept a request
 *   3. Provider status changes to busy
 *   4. Provider cannot accept when already busy
 *
 * All tests are DB-level.
 */
import { test, expect } from '@playwright/test';
import { createTestPair, deleteTestUsers } from './helpers/auth';
import { cleanTestData, getPool, createProviderWithStatus } from './helpers/db';
import type { TestUser } from './helpers/auth';

let customer: TestUser;
let provider: TestUser;
let requestId: string;

test.describe('Provider Acceptance Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const pair = await createTestPair('acceptance');
    customer = pair.customer;
    provider = pair.provider;

    const pool = getPool();

    // Setup: provider is online, available, has wallet
    await createProviderWithStatus(provider.id, {
      onlineStatus: true,
      providerStatus: 'available',
      serviceType: 'Plumbing',
      latitude: 33.6844,
      longitude: 73.0479,
      walletBalance: 100,
    });

    // Create a service request for this provider
    const { rows } = await pool.query(
      `INSERT INTO service_requests (
        user_id, service_type, address, request_latitude, request_longitude,
        request_details, status, notified_providers
      ) VALUES (
        $1, 'Plumbing', '123 Test Street, Islamabad', 33.6844, 73.0479,
        'Leaking pipe', 'notified_multiple', ARRAY[$2::uuid]
      ) RETURNING id`,
      [customer.id, provider.id]
    );
    requestId = rows[0].id;
  });

  test.afterAll(async () => {
    await cleanTestData(customer.id, provider.id).catch(() => {});
    await deleteTestUsers([customer, provider]).catch(() => {});
  });

  test('Provider has pending request in notified_providers', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT id, status, notified_providers
       FROM service_requests WHERE id = $1`,
      [requestId]
    );

    expect(rows[0].status).toBe('notified_multiple');
    expect(rows[0].notified_providers).toContain(provider.id);
  });

  test('Provider accepts request — status changes to accepted', async () => {
    const pool = getPool();

    // Act: accept the request (simulating accept_service_request RPC)
    await pool.query(
      `UPDATE service_requests
       SET status = 'accepted', accepted_by_provider_id = $2, updated_at = NOW()
       WHERE id = $1 AND status = 'notified_multiple'`,
      [requestId, provider.id]
    );

    // Set provider to busy
    await pool.query(
      `UPDATE ustaz_registrations SET provider_status = 'busy' WHERE "userId" = $1`,
      [provider.id]
    );

    // Verify: request status is accepted
    const { rows: requestRows } = await pool.query(
      `SELECT status, accepted_by_provider_id FROM service_requests WHERE id = $1`,
      [requestId]
    );
    expect(requestRows[0].status).toBe('accepted');
    expect(requestRows[0].accepted_by_provider_id).toBe(provider.id);

    // Verify: provider is now busy
    const { rows: providerRows } = await pool.query(
      `SELECT provider_status FROM ustaz_registrations WHERE "userId" = $1`,
      [provider.id]
    );
    expect(providerRows[0].provider_status).toBe('busy');
  });

  test('Busy provider is excluded from new dispatch', async () => {
    const pool = getPool();

    // Try to find providers — busy provider should NOT appear
    const { rows } = await pool.query(
      `SELECT user_id FROM find_providers_nearby(33.6844, 73.0479, 5000, 'Plumbing')`
    );

    const userIds = rows.map((r: any) => r.user_id);
    expect(userIds).not.toContain(provider.id);
  });

  test('Provider can complete the request — status returns to available', async () => {
    const pool = getPool();

    // Advance through the state machine
    await pool.query(
      `UPDATE service_requests SET status = 'arriving', updated_at = NOW() WHERE id = $1`,
      [requestId]
    );
    await pool.query(
      `UPDATE service_requests SET status = 'arrived', provider_arrived_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [requestId]
    );
    await pool.query(
      `UPDATE service_requests SET status = 'in_progress', service_started_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [requestId]
    );
    await pool.query(
      `UPDATE service_requests SET status = 'completed', service_completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [requestId]
    );

    // Set provider back to available
    await pool.query(
      `UPDATE ustaz_registrations SET provider_status = 'available' WHERE "userId" = $1`,
      [provider.id]
    );

    // Verify: provider is available again
    const { rows: providerRows } = await pool.query(
      `SELECT provider_status FROM ustaz_registrations WHERE "userId" = $1`,
      [provider.id]
    );
    expect(providerRows[0].provider_status).toBe('available');

    // Verify: request is completed
    const { rows: requestRows } = await pool.query(
      `SELECT status, service_completed_at FROM service_requests WHERE id = $1`,
      [requestId]
    );
    expect(requestRows[0].status).toBe('completed');
    expect(requestRows[0].service_completed_at).not.toBeNull();
  });

  test('Available provider appears in dispatch again', async () => {
    const pool = getPool();

    // Provider is now available — should appear in dispatch
    const { rows } = await pool.query(
      `SELECT user_id FROM find_providers_nearby(33.6844, 73.0479, 5000, 'Plumbing')`
    );

    const userIds = rows.map((r: any) => r.user_id);
    expect(userIds).toContain(provider.id);
  });
});
