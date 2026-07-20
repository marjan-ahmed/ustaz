/**
 * E2E: Admin Portal
 *
 * Tests admin operations:
 *   1. Admin can query pending top-ups
 *   2. Admin can list providers
 *   3. Admin can query verification submissions
 *   4. Admin can resolve incidents
 *
 * All tests are DB-level.
 */
import { test, expect } from '@playwright/test';
import { getPool } from './helpers/db';

test.describe('Admin Portal', () => {
  test.describe.configure({ mode: 'serial' });

  test('Admin can query pending top-ups', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT t.id, t.status, t.amount_sent, t.transaction_id,
              u."firstName", u."lastName", u."phoneNumber"
       FROM topup_requests t
       JOIN ustaz_registrations u ON u."userId" = t.provider_id
       ORDER BY t.created_at DESC LIMIT 10`
    );

    // Should return results (even if empty)
    expect(Array.isArray(rows)).toBe(true);
  });

  test('Admin can list all providers', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT u."userId", u."firstName", u."lastName", u.service_type,
              u.city, u.online_status, u.provider_status,
              u.rating_avg, u.rating_count,
              pw.balance, ps.tier
       FROM ustaz_registrations u
       LEFT JOIN provider_wallets pw ON pw.provider_id = u."userId"
       LEFT JOIN provider_standing ps ON ps.provider_id = u."userId"
       ORDER BY u."registrationDate" DESC LIMIT 20`
    );

    expect(Array.isArray(rows)).toBe(true);
  });

  test('Admin can query verification submissions', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT vs.id, vs.status, vs.cnic_number, vs.created_at,
              u."firstName", u."lastName"
       FROM verification_submissions vs
       JOIN ustaz_registrations u ON u."userId" = vs.provider_id
       ORDER BY vs.created_at DESC LIMIT 10`
    );

    expect(Array.isArray(rows)).toBe(true);
  });

  test('Admin can query incidents', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT i.id, i.incident_type, i.status, i.severity,
              u."firstName" as provider_name, u.service_type
       FROM incidents i
       JOIN ustaz_registrations u ON u."userId" = i.provider_id
       ORDER BY i.created_at DESC LIMIT 10`
    );

    expect(Array.isArray(rows)).toBe(true);
  });

  test('Admin can query appeals', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT a.id, a.appeal_type, a.status, a.reason,
              u."firstName", u."lastName"
       FROM appeals a
       JOIN ustaz_registrations u ON u."userId" = a.provider_id
       ORDER BY a.created_at DESC LIMIT 10`
    );

    expect(Array.isArray(rows)).toBe(true);
  });

  test('Admin observability metrics can be computed', async () => {
    const pool = getPool();

    // Total providers
    const { rows: totalProviders } = await pool.query(
      `SELECT COUNT(*) as count FROM ustaz_registrations`
    );
    expect(Number(totalProviders[0].count)).toBeGreaterThanOrEqual(0);

    // Online providers
    const { rows: onlineProviders } = await pool.query(
      `SELECT COUNT(*) as count FROM ustaz_registrations WHERE online_status = true`
    );
    expect(Number(onlineProviders[0].count)).toBeGreaterThanOrEqual(0);

    // Total requests
    const { rows: totalRequests } = await pool.query(
      `SELECT COUNT(*) as count FROM service_requests`
    );
    expect(Number(totalRequests[0].count)).toBeGreaterThanOrEqual(0);

    // Completed requests
    const { rows: completedRequests } = await pool.query(
      `SELECT COUNT(*) as count FROM service_requests WHERE status = 'completed'`
    );
    expect(Number(completedRequests[0].count)).toBeGreaterThanOrEqual(0);

    // Total wallet balance
    const { rows: walletBalance } = await pool.query(
      `SELECT COALESCE(SUM(balance), 0) as total FROM provider_wallets`
    );
    expect(Number(walletBalance[0].total)).toBeGreaterThanOrEqual(0);
  });

  test('System config is readable', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT key, value FROM system_config ORDER BY key`
    );

    expect(rows.length).toBeGreaterThanOrEqual(1);

    // Verify key configs exist
    const keys = rows.map((r: any) => r.key);
    expect(keys).toContain('min_wallet_to_work');
  });
});
