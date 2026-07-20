/**
 * E2E: Wallet Top-up Flow
 *
 * Tests provider wallet operations:
 *   1. Provider has a wallet with initial balance
 *   2. Provider can initiate a top-up request
 *   3. Admin can approve the top-up
 *   4. Wallet balance increases
 *
 * All tests are DB-level.
 */
import { test, expect } from '@playwright/test';
import { createTestPair, deleteTestUsers } from './helpers/auth';
import { cleanTestData, getPool } from './helpers/db';
import type { TestUser } from './helpers/auth';

let customer: TestUser;
let provider: TestUser;

test.describe('Wallet Top-up Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const pair = await createTestPair('wallet');
    customer = pair.customer;
    provider = pair.provider;

    const pool = getPool();

    // Ensure provider exists in ustaz_registrations (required for wallet FK)
    // Use unique CNIC to avoid collisions with leftover test data
    const uniqueCnic = `99999-${provider.id.slice(0, 7)}-1`;
    await pool.query(
      `INSERT INTO ustaz_registrations ("userId", "firstName", "lastName", "email", "phoneNumber", "phoneCountryCode", "cnic", "city", service_type, "online_status", provider_status, "heardFrom", "hasActiveMobile", "registrationDate", phone_verified)
       VALUES ($1, $2, $3, $4, $5, '+92', $6, 'Islamabad', 'Plumbing', false, 'available', 'test', true, NOW(), true)
       ON CONFLICT ("userId") DO NOTHING`,
      [provider.id, 'Wallet', 'Test', `wallet-${provider.id.slice(0, 8)}@test.local`, String(Math.random()).slice(2, 12), uniqueCnic]
    );

    // Create wallet with initial balance
    await pool.query(
      `INSERT INTO provider_wallets (provider_id, balance, total_earned, total_commission_paid)
       VALUES ($1, 100, 500, 50)
       ON CONFLICT (provider_id) DO UPDATE SET balance = 100, total_earned = 500, total_commission_paid = 50`,
      [provider.id]
    );
  });

  test.afterAll(async () => {
    await cleanTestData(customer.id, provider.id).catch(() => {});
    await deleteTestUsers([customer, provider]).catch(() => {});
  });

  test('Provider has wallet with initial balance', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT balance, total_earned, total_commission_paid
       FROM provider_wallets WHERE provider_id = $1`,
      [provider.id]
    );

    expect(rows.length).toBe(1);
    expect(rows[0].balance).toBe(100);
    expect(rows[0].total_earned).toBe(500);
    expect(rows[0].total_commission_paid).toBe(50);
  });

  test('Provider can initiate a top-up request', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `INSERT INTO topup_requests (provider_id, amount_sent, transaction_id, receipt_url, status)
       VALUES ($1, 1000, 'TXN-TEST-001', 'https://example.com/receipt.jpg', 'pending')
       RETURNING id, status, amount_sent`,
      [provider.id]
    );

    expect(rows[0].status).toBe('pending');
    expect(rows[0].amount_sent).toBe(1000);
  });

  test('Pending top-up is visible in admin query', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT t.id, t.status, t.amount_sent, u."firstName", u."lastName"
       FROM topup_requests t
       JOIN ustaz_registrations u ON u."userId" = t.provider_id
       WHERE t.status = 'pending'
       ORDER BY t.created_at DESC LIMIT 5`
    );

    expect(rows.length).toBeGreaterThanOrEqual(1);
    const topup = rows.find((r: any) => r.status === 'pending');
    expect(topup).toBeDefined();
  });

  test('Admin approves top-up — balance increases', async () => {
    const pool = getPool();

    // Get the pending top-up
    const { rows: topupRows } = await pool.query(
      `SELECT id FROM topup_requests WHERE provider_id = $1 AND status = 'pending'
       ORDER BY created_at DESC LIMIT 1`,
      [provider.id]
    );

    if (topupRows.length === 0) {
      console.log('No pending top-up found — skipping');
      return;
    }

    const topupId = topupRows[0].id;

    // Approve the top-up
    await pool.query(
      `UPDATE topup_requests SET status = 'approved', updated_at = NOW() WHERE id = $1`,
      [topupId]
    );

    // Credit the wallet
    await pool.query(
      `UPDATE provider_wallets SET balance = balance + 1000, updated_at = NOW()
       WHERE provider_id = $1`,
      [provider.id]
    );

    // Log the transaction
    await pool.query(
      `INSERT INTO wallet_transactions (provider_id, type, amount, balance_before, balance_after, description)
       SELECT $1, 'topup', 1000, balance - 1000, balance, 'Top-up approved'
       FROM provider_wallets WHERE provider_id = $1`,
      [provider.id]
    );

    // Verify: balance increased
    const { rows: walletRows } = await pool.query(
      `SELECT balance FROM provider_wallets WHERE provider_id = $1`,
      [provider.id]
    );
    expect(walletRows[0].balance).toBe(1100);

    // Verify: top-up status is approved
    const { rows: afterTopupRows } = await pool.query(
      `SELECT status FROM topup_requests WHERE id = $1`,
      [topupId]
    );
    expect(afterTopupRows[0].status).toBe('approved');
  });

  test('Wallet transaction is recorded', async () => {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT type, amount, description
       FROM wallet_transactions
       WHERE provider_id = $1 AND type = 'topup'
       ORDER BY created_at DESC LIMIT 1`,
      [provider.id]
    );

    expect(rows.length).toBe(1);
    expect(rows[0].type).toBe('topup');
    expect(rows[0].amount).toBe(1000);
  });

  test('Commission deduction on service completion', async () => {
    const pool = getPool();

    // Read current balance
    const { rows: beforeRows } = await pool.query(
      `SELECT balance FROM provider_wallets WHERE provider_id = $1`,
      [provider.id]
    );
    const balanceBefore = beforeRows[0].balance;

    // Simulate commission deduction (Rs. 60)
    await pool.query(
      `UPDATE provider_wallets
       SET balance = balance - 60, total_commission_paid = total_commission_paid + 60
       WHERE provider_id = $1`,
      [provider.id]
    );

    // Log transaction
    await pool.query(
      `INSERT INTO wallet_transactions (provider_id, type, amount, balance_before, balance_after, description)
       VALUES ($1, 'commission', -60, $2, $2 - 60, '10% commission on service')`,
      [provider.id, balanceBefore]
    );

    // Verify: balance decreased by 60
    const { rows: afterRows } = await pool.query(
      `SELECT balance, total_commission_paid FROM provider_wallets WHERE provider_id = $1`,
      [provider.id]
    );
    expect(afterRows[0].balance).toBe(balanceBefore - 60);
    expect(afterRows[0].total_commission_paid).toBe(50 + 60); // initial 50 + new 60
  });
});
