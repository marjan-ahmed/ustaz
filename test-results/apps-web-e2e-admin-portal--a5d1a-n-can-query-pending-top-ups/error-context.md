# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\web\e2e\admin-portal.spec.ts >> Admin Portal >> Admin can query pending top-ups
- Location: apps\web\e2e\admin-portal.spec.ts:18:7

# Error details

```
AggregateError: 
```

# Test source

```ts
  1   | /**
  2   |  * E2E: Admin Portal
  3   |  *
  4   |  * Tests admin operations:
  5   |  *   1. Admin can query pending top-ups
  6   |  *   2. Admin can list providers
  7   |  *   3. Admin can query verification submissions
  8   |  *   4. Admin can resolve incidents
  9   |  *
  10  |  * All tests are DB-level.
  11  |  */
  12  | import { test, expect } from '@playwright/test';
  13  | import { getPool } from './helpers/db';
  14  | 
  15  | test.describe('Admin Portal', () => {
  16  |   test.describe.configure({ mode: 'serial' });
  17  | 
  18  |   test('Admin can query pending top-ups', async () => {
  19  |     const pool = getPool();
  20  | 
> 21  |     const { rows } = await pool.query(
      |                      ^ AggregateError: 
  22  |       `SELECT t.id, t.status, t.amount_sent, t.transaction_id,
  23  |               u."firstName", u."lastName", u."phoneNumber"
  24  |        FROM topup_requests t
  25  |        JOIN ustaz_registrations u ON u."userId" = t.provider_id
  26  |        ORDER BY t.created_at DESC LIMIT 10`
  27  |     );
  28  | 
  29  |     // Should return results (even if empty)
  30  |     expect(Array.isArray(rows)).toBe(true);
  31  |   });
  32  | 
  33  |   test('Admin can list all providers', async () => {
  34  |     const pool = getPool();
  35  | 
  36  |     const { rows } = await pool.query(
  37  |       `SELECT u."userId", u."firstName", u."lastName", u.service_type,
  38  |               u.city, u.online_status, u.provider_status,
  39  |               u.rating_avg, u.rating_count,
  40  |               pw.balance, ps.tier
  41  |        FROM ustaz_registrations u
  42  |        LEFT JOIN provider_wallets pw ON pw.provider_id = u."userId"
  43  |        LEFT JOIN provider_standing ps ON ps.provider_id = u."userId"
  44  |        ORDER BY u."registrationDate" DESC LIMIT 20`
  45  |     );
  46  | 
  47  |     expect(Array.isArray(rows)).toBe(true);
  48  |   });
  49  | 
  50  |   test('Admin can query verification submissions', async () => {
  51  |     const pool = getPool();
  52  | 
  53  |     const { rows } = await pool.query(
  54  |       `SELECT vs.id, vs.status, vs.cnic_number, vs.created_at,
  55  |               u."firstName", u."lastName"
  56  |        FROM verification_submissions vs
  57  |        JOIN ustaz_registrations u ON u."userId" = vs.provider_id
  58  |        ORDER BY vs.created_at DESC LIMIT 10`
  59  |     );
  60  | 
  61  |     expect(Array.isArray(rows)).toBe(true);
  62  |   });
  63  | 
  64  |   test('Admin can query incidents', async () => {
  65  |     const pool = getPool();
  66  | 
  67  |     const { rows } = await pool.query(
  68  |       `SELECT i.id, i.incident_type, i.status, i.severity,
  69  |               u."firstName" as provider_name, u.service_type
  70  |        FROM incidents i
  71  |        JOIN ustaz_registrations u ON u."userId" = i.provider_id
  72  |        ORDER BY i.created_at DESC LIMIT 10`
  73  |     );
  74  | 
  75  |     expect(Array.isArray(rows)).toBe(true);
  76  |   });
  77  | 
  78  |   test('Admin can query appeals', async () => {
  79  |     const pool = getPool();
  80  | 
  81  |     const { rows } = await pool.query(
  82  |       `SELECT a.id, a.appeal_type, a.status, a.reason,
  83  |               u."firstName", u."lastName"
  84  |        FROM appeals a
  85  |        JOIN ustaz_registrations u ON u."userId" = a.provider_id
  86  |        ORDER BY a.created_at DESC LIMIT 10`
  87  |     );
  88  | 
  89  |     expect(Array.isArray(rows)).toBe(true);
  90  |   });
  91  | 
  92  |   test('Admin observability metrics can be computed', async () => {
  93  |     const pool = getPool();
  94  | 
  95  |     // Total providers
  96  |     const { rows: totalProviders } = await pool.query(
  97  |       `SELECT COUNT(*) as count FROM ustaz_registrations`
  98  |     );
  99  |     expect(Number(totalProviders[0].count)).toBeGreaterThanOrEqual(0);
  100 | 
  101 |     // Online providers
  102 |     const { rows: onlineProviders } = await pool.query(
  103 |       `SELECT COUNT(*) as count FROM ustaz_registrations WHERE online_status = true`
  104 |     );
  105 |     expect(Number(onlineProviders[0].count)).toBeGreaterThanOrEqual(0);
  106 | 
  107 |     // Total requests
  108 |     const { rows: totalRequests } = await pool.query(
  109 |       `SELECT COUNT(*) as count FROM service_requests`
  110 |     );
  111 |     expect(Number(totalRequests[0].count)).toBeGreaterThanOrEqual(0);
  112 | 
  113 |     // Completed requests
  114 |     const { rows: completedRequests } = await pool.query(
  115 |       `SELECT COUNT(*) as count FROM service_requests WHERE status = 'completed'`
  116 |     );
  117 |     expect(Number(completedRequests[0].count)).toBeGreaterThanOrEqual(0);
  118 | 
  119 |     // Total wallet balance
  120 |     const { rows: walletBalance } = await pool.query(
  121 |       `SELECT COALESCE(SUM(balance), 0) as total FROM provider_wallets`
```