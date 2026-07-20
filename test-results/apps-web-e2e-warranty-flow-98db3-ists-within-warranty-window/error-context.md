# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\web\e2e\warranty-flow.spec.ts >> Warranty Flow >> Completed job exists within warranty window
- Location: apps\web\e2e\warranty-flow.spec.ts:53:7

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
  2   |  * E2E: Warranty Flow
  3   |  *
  4   |  * Tests warranty claim lifecycle:
  5   |  *   1. Customer files a warranty claim on a completed job
  6   |  *   2. Provider sees the claim
  7   |  *   3. Provider accepts the claim
  8   |  *   4. Claim status updates correctly
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
  19  | let requestId: string;
  20  | 
  21  | test.describe('Warranty Flow', () => {
  22  |   test.describe.configure({ mode: 'serial' });
  23  | 
  24  |   test.beforeAll(async () => {
  25  |     const pair = await createTestPair('warranty');
  26  |     customer = pair.customer;
  27  |     provider = pair.provider;
  28  | 
  29  |     const pool = getPool();
  30  | 
  31  |     // Create a completed service request (within 3-day warranty window)
  32  |     const completedDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
  33  |     const { rows } = await pool.query(
  34  |       `INSERT INTO service_requests (
  35  |         user_id, service_type, address, request_latitude, request_longitude,
  36  |         request_details, status, accepted_by_provider_id, service_completed_at,
  37  |         customer_rated, customer_rating_value
  38  |       ) VALUES (
  39  |         $1, 'Plumbing', '123 Warranty Street, Islamabad', 33.6844, 73.0479,
  40  |         'Warranty test job', 'completed', $2, $3,
  41  |         true, 3
  42  |       ) RETURNING id`,
  43  |       [customer.id, provider.id, completedDate.toISOString()]
  44  |     );
  45  |     requestId = rows[0].id;
  46  |   });
  47  | 
  48  |   test.afterAll(async () => {
> 49  |     await cleanTestData(customer.id, provider.id).catch(() => {});
      |                                  ^ TypeError: Cannot read properties of undefined (reading 'id')
  50  |     await deleteTestUsers([customer, provider]).catch(() => {});
  51  |   });
  52  | 
  53  |   test('Completed job exists within warranty window', async () => {
  54  |     const pool = getPool();
  55  | 
  56  |     const { rows } = await pool.query(
  57  |       `SELECT id, status, service_completed_at
  58  |        FROM service_requests WHERE id = $1`,
  59  |       [requestId]
  60  |     );
  61  | 
  62  |     expect(rows[0].status).toBe('completed');
  63  |     expect(rows[0].service_completed_at).not.toBeNull();
  64  | 
  65  |     // Verify it's within 3 days
  66  |     const completedAt = new Date(rows[0].service_completed_at);
  67  |     const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  68  |     expect(completedAt.getTime()).toBeGreaterThan(threeDaysAgo.getTime());
  69  |   });
  70  | 
  71  |   test('Customer files a warranty claim', async () => {
  72  |     const pool = getPool();
  73  | 
  74  |     const { rows } = await pool.query(
  75  |       `INSERT INTO warranty_claims (request_id, customer_id, provider_id, status, description)
  76  |        VALUES ($1, $2, $3, 'pending', 'The pipe is leaking again after 1 day')
  77  |        RETURNING id, status, description`,
  78  |       [requestId, customer.id, provider.id]
  79  |     );
  80  | 
  81  |     expect(rows[0].status).toBe('pending');
  82  |     expect(rows[0].description).toContain('leaking again');
  83  |   });
  84  | 
  85  |   test('Warranty claim is visible to provider', async () => {
  86  |     const pool = getPool();
  87  | 
  88  |     const { rows } = await pool.query(
  89  |       `SELECT wc.id, wc.status, wc.description, sr.service_type, sr.address
  90  |        FROM warranty_claims wc
  91  |        JOIN service_requests sr ON sr.id = wc.request_id
  92  |        WHERE wc.provider_id = $1 AND wc.status = 'pending'`,
  93  |       [provider.id]
  94  |     );
  95  | 
  96  |     expect(rows.length).toBeGreaterThanOrEqual(1);
  97  |     const claim = rows.find((r: any) => r.status === 'pending');
  98  |     expect(claim).toBeDefined();
  99  |     expect(claim.service_type).toBe('Plumbing');
  100 |   });
  101 | 
  102 |   test('Provider accepts the warranty claim', async () => {
  103 |     const pool = getPool();
  104 | 
  105 |     // Get the pending claim
  106 |     const { rows: claimRows } = await pool.query(
  107 |       `SELECT id FROM warranty_claims WHERE provider_id = $1 AND status = 'pending'
  108 |        ORDER BY created_at DESC LIMIT 1`,
  109 |       [provider.id]
  110 |     );
  111 | 
  112 |     if (claimRows.length === 0) {
  113 |       console.log('No pending warranty claim found — skipping');
  114 |       return;
  115 |     }
  116 | 
  117 |     const claimId = claimRows[0].id;
  118 | 
  119 |     // Accept the claim
  120 |     await pool.query(
  121 |       `UPDATE warranty_claims
  122 |        SET status = 'accepted', provider_responded_at = NOW()
  123 |        WHERE id = $1`,
  124 |       [claimId]
  125 |     );
  126 | 
  127 |     // Verify: status changed to accepted
  128 |     const { rows: afterRows } = await pool.query(
  129 |       `SELECT status, provider_responded_at FROM warranty_claims WHERE id = $1`,
  130 |       [claimId]
  131 |     );
  132 |     expect(afterRows[0].status).toBe('accepted');
  133 |     expect(afterRows[0].provider_responded_at).not.toBeNull();
  134 |   });
  135 | 
  136 |   test('Provider cannot refuse without penalty', async () => {
  137 |     const pool = getPool();
  138 | 
  139 |     // Create another completed request for a refusal test
  140 |     const completedDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
  141 |     const { rows: reqRows } = await pool.query(
  142 |       `INSERT INTO service_requests (
  143 |         user_id, service_type, address, request_latitude, request_longitude,
  144 |         request_details, status, accepted_by_provider_id, service_completed_at
  145 |       ) VALUES (
  146 |         $1, 'Plumbing', '456 Test Ave, Islamabad', 33.6844, 73.0479,
  147 |         'Refusal test job', 'completed', $2, $3
  148 |       ) RETURNING id`,
  149 |       [customer.id, provider.id, completedDate.toISOString()]
```