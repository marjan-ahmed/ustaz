# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\web\e2e\wallet-topup.spec.ts >> Wallet Top-up Flow >> Provider has wallet with initial balance
- Location: apps\web\e2e\wallet-topup.spec.ts:44:7

# Error details

```
Error: supabaseUrl is required.
```

```
TypeError: Cannot read properties of undefined (reading 'id')
```

# Test source

```ts
  1   | /**
  2   |  * E2E: Wallet Top-up Flow
  3   |  *
  4   |  * Tests provider wallet operations:
  5   |  *   1. Provider has a wallet with initial balance
  6   |  *   2. Provider can initiate a top-up request
  7   |  *   3. Admin can approve the top-up
  8   |  *   4. Wallet balance increases
  9   |  *
  10  |  * All tests are DB-level.
  11  |  */
  12  | import { test, expect } from '@playwright/test';
  13  | import { createTestPair, deleteTestUsers } from './helpers/auth';
  14  | import { cleanTestData, getPool } from './helpers/db';
  15  | import type { TestUser } from './helpers/auth';
  16  | 
  17  | let customer: TestUser;
  18  | let provider: TestUser;
  19  | 
  20  | test.describe('Wallet Top-up Flow', () => {
  21  |   test.describe.configure({ mode: 'serial' });
  22  | 
  23  |   test.beforeAll(async () => {
  24  |     const pair = await createTestPair('wallet');
  25  |     customer = pair.customer;
  26  |     provider = pair.provider;
  27  | 
  28  |     const pool = getPool();
  29  | 
  30  |     // Create wallet with initial balance
  31  |     await pool.query(
  32  |       `INSERT INTO provider_wallets (provider_id, balance, total_earned, total_commission_paid)
  33  |        VALUES ($1, 100, 500, 50)
  34  |        ON CONFLICT (provider_id) DO UPDATE SET balance = 100, total_earned = 500, total_commission_paid = 50`,
  35  |       [provider.id]
  36  |     );
  37  |   });
  38  | 
  39  |   test.afterAll(async () => {
> 40  |     await cleanTestData(customer.id, provider.id).catch(() => {});
      |                                  ^ TypeError: Cannot read properties of undefined (reading 'id')
  41  |     await deleteTestUsers([customer, provider]).catch(() => {});
  42  |   });
  43  | 
  44  |   test('Provider has wallet with initial balance', async () => {
  45  |     const pool = getPool();
  46  | 
  47  |     const { rows } = await pool.query(
  48  |       `SELECT balance, total_earned, total_commission_paid
  49  |        FROM provider_wallets WHERE provider_id = $1`,
  50  |       [provider.id]
  51  |     );
  52  | 
  53  |     expect(rows.length).toBe(1);
  54  |     expect(rows[0].balance).toBe(100);
  55  |     expect(rows[0].total_earned).toBe(500);
  56  |     expect(rows[0].total_commission_paid).toBe(50);
  57  |   });
  58  | 
  59  |   test('Provider can initiate a top-up request', async () => {
  60  |     const pool = getPool();
  61  | 
  62  |     const { rows } = await pool.query(
  63  |       `INSERT INTO topup_requests (provider_id, amount_sent, transaction_id, receipt_url, status)
  64  |        VALUES ($1, 1000, 'TXN-TEST-001', 'https://example.com/receipt.jpg', 'pending')
  65  |        RETURNING id, status, amount_sent`,
  66  |       [provider.id]
  67  |     );
  68  | 
  69  |     expect(rows[0].status).toBe('pending');
  70  |     expect(rows[0].amount_sent).toBe(1000);
  71  |   });
  72  | 
  73  |   test('Pending top-up is visible in admin query', async () => {
  74  |     const pool = getPool();
  75  | 
  76  |     const { rows } = await pool.query(
  77  |       `SELECT t.id, t.status, t.amount_sent, u."firstName", u."lastName"
  78  |        FROM topup_requests t
  79  |        JOIN ustaz_registrations u ON u."userId" = t.provider_id
  80  |        WHERE t.status = 'pending'
  81  |        ORDER BY t.created_at DESC LIMIT 5`
  82  |     );
  83  | 
  84  |     expect(rows.length).toBeGreaterThanOrEqual(1);
  85  |     const topup = rows.find((r: any) => r.status === 'pending');
  86  |     expect(topup).toBeDefined();
  87  |   });
  88  | 
  89  |   test('Admin approves top-up — balance increases', async () => {
  90  |     const pool = getPool();
  91  | 
  92  |     // Get the pending top-up
  93  |     const { rows: topupRows } = await pool.query(
  94  |       `SELECT id FROM topup_requests WHERE provider_id = $1 AND status = 'pending'
  95  |        ORDER BY created_at DESC LIMIT 1`,
  96  |       [provider.id]
  97  |     );
  98  | 
  99  |     if (topupRows.length === 0) {
  100 |       console.log('No pending top-up found — skipping');
  101 |       return;
  102 |     }
  103 | 
  104 |     const topupId = topupRows[0].id;
  105 | 
  106 |     // Approve the top-up
  107 |     await pool.query(
  108 |       `UPDATE topup_requests SET status = 'approved', updated_at = NOW() WHERE id = $1`,
  109 |       [topupId]
  110 |     );
  111 | 
  112 |     // Credit the wallet
  113 |     await pool.query(
  114 |       `UPDATE provider_wallets SET balance = balance + 1000, updated_at = NOW()
  115 |        WHERE provider_id = $1`,
  116 |       [provider.id]
  117 |     );
  118 | 
  119 |     // Log the transaction
  120 |     await pool.query(
  121 |       `INSERT INTO wallet_transactions (provider_id, type, amount, balance_before, balance_after, description)
  122 |        SELECT $1, 'topup', 1000, balance - 1000, balance, 'Top-up approved'
  123 |        FROM provider_wallets WHERE provider_id = $1`,
  124 |       [provider.id]
  125 |     );
  126 | 
  127 |     // Verify: balance increased
  128 |     const { rows: walletRows } = await pool.query(
  129 |       `SELECT balance FROM provider_wallets WHERE provider_id = $1`,
  130 |       [provider.id]
  131 |     );
  132 |     expect(walletRows[0].balance).toBe(1100);
  133 | 
  134 |     // Verify: top-up status is approved
  135 |     const { rows: afterTopupRows } = await pool.query(
  136 |       `SELECT status FROM topup_requests WHERE id = $1`,
  137 |       [topupId]
  138 |     );
  139 |     expect(afterTopupRows[0].status).toBe('approved');
  140 |   });
```