# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\web\e2e\provider-acceptance.spec.ts >> Provider Acceptance Flow >> Provider has pending request in notified_providers
- Location: apps\web\e2e\provider-acceptance.spec.ts:60:7

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
  2   |  * E2E: Provider Acceptance Flow
  3   |  *
  4   |  * Tests the provider-side workflow:
  5   |  *   1. Provider sees incoming requests
  6   |  *   2. Provider can accept a request
  7   |  *   3. Provider status changes to busy
  8   |  *   4. Provider cannot accept when already busy
  9   |  *
  10  |  * All tests are DB-level.
  11  |  */
  12  | import { test, expect } from '@playwright/test';
  13  | import { createTestPair, deleteTestUsers } from './helpers/auth';
  14  | import { cleanTestData, getPool, createProviderWithStatus } from './helpers/db';
  15  | import type { TestUser } from './helpers/auth';
  16  | 
  17  | let customer: TestUser;
  18  | let provider: TestUser;
  19  | let requestId: string;
  20  | 
  21  | test.describe('Provider Acceptance Flow', () => {
  22  |   test.describe.configure({ mode: 'serial' });
  23  | 
  24  |   test.beforeAll(async () => {
  25  |     const pair = await createTestPair('acceptance');
  26  |     customer = pair.customer;
  27  |     provider = pair.provider;
  28  | 
  29  |     const pool = getPool();
  30  | 
  31  |     // Setup: provider is online, available, has wallet
  32  |     await createProviderWithStatus(provider.id, {
  33  |       onlineStatus: true,
  34  |       providerStatus: 'available',
  35  |       serviceType: 'Plumbing',
  36  |       latitude: 33.6844,
  37  |       longitude: 73.0479,
  38  |       walletBalance: 100,
  39  |     });
  40  | 
  41  |     // Create a service request for this provider
  42  |     const { rows } = await pool.query(
  43  |       `INSERT INTO service_requests (
  44  |         user_id, service_type, address, request_latitude, request_longitude,
  45  |         request_details, status, notified_providers
  46  |       ) VALUES (
  47  |         $1, 'Plumbing', '123 Test Street, Islamabad', 33.6844, 73.0479,
  48  |         'Leaking pipe', 'notified_multiple', ARRAY[$2::uuid]
  49  |       ) RETURNING id`,
  50  |       [customer.id, provider.id]
  51  |     );
  52  |     requestId = rows[0].id;
  53  |   });
  54  | 
  55  |   test.afterAll(async () => {
> 56  |     await cleanTestData(customer.id, provider.id).catch(() => {});
      |                                  ^ TypeError: Cannot read properties of undefined (reading 'id')
  57  |     await deleteTestUsers([customer, provider]).catch(() => {});
  58  |   });
  59  | 
  60  |   test('Provider has pending request in notified_providers', async () => {
  61  |     const pool = getPool();
  62  | 
  63  |     const { rows } = await pool.query(
  64  |       `SELECT id, status, notified_providers
  65  |        FROM service_requests WHERE id = $1`,
  66  |       [requestId]
  67  |     );
  68  | 
  69  |     expect(rows[0].status).toBe('notified_multiple');
  70  |     expect(rows[0].notified_providers).toContain(provider.id);
  71  |   });
  72  | 
  73  |   test('Provider accepts request — status changes to accepted', async () => {
  74  |     const pool = getPool();
  75  | 
  76  |     // Act: accept the request (simulating accept_service_request RPC)
  77  |     await pool.query(
  78  |       `UPDATE service_requests
  79  |        SET status = 'accepted', accepted_by_provider_id = $2, updated_at = NOW()
  80  |        WHERE id = $1 AND status = 'notified_multiple'`,
  81  |       [requestId, provider.id]
  82  |     );
  83  | 
  84  |     // Set provider to busy
  85  |     await pool.query(
  86  |       `UPDATE ustaz_registrations SET provider_status = 'busy' WHERE "userId" = $1`,
  87  |       [provider.id]
  88  |     );
  89  | 
  90  |     // Verify: request status is accepted
  91  |     const { rows: requestRows } = await pool.query(
  92  |       `SELECT status, accepted_by_provider_id FROM service_requests WHERE id = $1`,
  93  |       [requestId]
  94  |     );
  95  |     expect(requestRows[0].status).toBe('accepted');
  96  |     expect(requestRows[0].accepted_by_provider_id).toBe(provider.id);
  97  | 
  98  |     // Verify: provider is now busy
  99  |     const { rows: providerRows } = await pool.query(
  100 |       `SELECT provider_status FROM ustaz_registrations WHERE "userId" = $1`,
  101 |       [provider.id]
  102 |     );
  103 |     expect(providerRows[0].provider_status).toBe('busy');
  104 |   });
  105 | 
  106 |   test('Busy provider is excluded from new dispatch', async () => {
  107 |     const pool = getPool();
  108 | 
  109 |     // Try to find providers — busy provider should NOT appear
  110 |     const { rows } = await pool.query(
  111 |       `SELECT user_id FROM find_providers_nearby(33.6844, 73.0479, 5000, 'Plumbing')`
  112 |     );
  113 | 
  114 |     const userIds = rows.map((r: any) => r.user_id);
  115 |     expect(userIds).not.toContain(provider.id);
  116 |   });
  117 | 
  118 |   test('Provider can complete the request — status returns to available', async () => {
  119 |     const pool = getPool();
  120 | 
  121 |     // Advance through the state machine
  122 |     await pool.query(
  123 |       `UPDATE service_requests SET status = 'arriving', updated_at = NOW() WHERE id = $1`,
  124 |       [requestId]
  125 |     );
  126 |     await pool.query(
  127 |       `UPDATE service_requests SET status = 'arrived', provider_arrived_at = NOW(), updated_at = NOW() WHERE id = $1`,
  128 |       [requestId]
  129 |     );
  130 |     await pool.query(
  131 |       `UPDATE service_requests SET status = 'in_progress', service_started_at = NOW(), updated_at = NOW() WHERE id = $1`,
  132 |       [requestId]
  133 |     );
  134 |     await pool.query(
  135 |       `UPDATE service_requests SET status = 'completed', service_completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
  136 |       [requestId]
  137 |     );
  138 | 
  139 |     // Set provider back to available
  140 |     await pool.query(
  141 |       `UPDATE ustaz_registrations SET provider_status = 'available' WHERE "userId" = $1`,
  142 |       [provider.id]
  143 |     );
  144 | 
  145 |     // Verify: provider is available again
  146 |     const { rows: providerRows } = await pool.query(
  147 |       `SELECT provider_status FROM ustaz_registrations WHERE "userId" = $1`,
  148 |       [provider.id]
  149 |     );
  150 |     expect(providerRows[0].provider_status).toBe('available');
  151 | 
  152 |     // Verify: request is completed
  153 |     const { rows: requestRows } = await pool.query(
  154 |       `SELECT status, service_completed_at FROM service_requests WHERE id = $1`,
  155 |       [requestId]
  156 |     );
```