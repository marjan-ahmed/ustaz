# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\web\e2e\dispatch-integrity.spec.ts >> Dispatch Integrity: Busy Provider Exclusion >> Busy provider must NOT appear in find_providers_nearby results
- Location: apps\web\e2e\dispatch-integrity.spec.ts:41:7

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
  2   |  * E2E: Dispatch Integrity — Busy Provider Exclusion
  3   |  *
  4   |  * Tests that providers with provider_status = 'busy' (mid-job) are NOT
  5   |  * included in dispatch results from find_providers_nearby.
  6   |  *
  7   |  * BUG: find_providers_nearby only checks online_status, not provider_status.
  8   |  * A busy provider still receives new job notifications.
  9   |  *
  10  |  * TDD: These tests MUST fail before the fix, proving the bug exists.
  11  |  */
  12  | import { test, expect } from '@playwright/test';
  13  | import { createTestPair, signInByCookie, deleteTestUsers } from './helpers/auth';
  14  | import {
  15  |   createServiceRequest,
  16  |   cleanTestData,
  17  |   getPool,
  18  |   createProviderWithStatus,
  19  |   cleanupDispatchTest,
  20  | } from './helpers/db';
  21  | import type { TestUser } from './helpers/auth';
  22  | 
  23  | let customer: TestUser;
  24  | let provider: TestUser;
  25  | 
  26  | test.describe('Dispatch Integrity: Busy Provider Exclusion', () => {
  27  |   test.describe.configure({ mode: 'serial' });
  28  | 
  29  |   test.beforeAll(async () => {
  30  |     const pair = await createTestPair('dispatch');
  31  |     customer = pair.customer;
  32  |     provider = pair.provider;
  33  |   });
  34  | 
  35  |   test.afterAll(async () => {
> 36  |     await cleanupDispatchTest(provider.id).catch(() => {});
      |                                        ^ TypeError: Cannot read properties of undefined (reading 'id')
  37  |     await cleanTestData(customer.id, provider.id).catch(() => {});
  38  |     await deleteTestUsers([customer, provider]).catch(() => {});
  39  |   });
  40  | 
  41  |   test('Busy provider must NOT appear in find_providers_nearby results', async () => {
  42  |     const pool = getPool();
  43  | 
  44  |     // Setup: provider is online, has wallet balance, but provider_status = 'busy'
  45  |     await createProviderWithStatus(provider.id, {
  46  |       onlineStatus: true,
  47  |       providerStatus: 'busy',
  48  |       serviceType: 'Plumbing',
  49  |       latitude: 33.6844,
  50  |       longitude: 73.0479,
  51  |       walletBalance: 100,
  52  |     });
  53  | 
  54  |     // Act: call find_providers_nearby at the same location
  55  |     const { rows } = await pool.query(
  56  |       `SELECT user_id FROM find_providers_nearby(33.6844, 73.0479, 5000, 'Plumbing')`
  57  |     );
  58  | 
  59  |     // ASSERT: Busy provider must NOT be in the results
  60  |     // This will FAIL before the fix (proving the bug), and PASS after
  61  |     const userIds = rows.map((r: any) => r.user_id);
  62  |     expect(userIds).not.toContain(provider.id);
  63  |   });
  64  | 
  65  |   test('Regression: create_service_request_with_notifications excludes busy providers', async () => {
  66  |     const pool = getPool();
  67  | 
  68  |     // Setup: provider is online, has wallet, but busy
  69  |     await createProviderWithStatus(provider.id, {
  70  |       onlineStatus: true,
  71  |       providerStatus: 'busy',
  72  |       serviceType: 'Plumbing',
  73  |       latitude: 33.6844,
  74  |       longitude: 73.0479,
  75  |       walletBalance: 100,
  76  |     });
  77  | 
  78  |     // Verify: create_service_request_with_notifications checks provider_status = 'available'
  79  |     // by reading the function definition and confirming the WHERE clause
  80  |     const { rows: funcRows } = await pool.query(
  81  |       `SELECT pg_get_functiondef(p.oid) as definition
  82  |        FROM pg_proc p
  83  |        JOIN pg_namespace n ON p.pronamespace = n.oid
  84  |        WHERE n.nspname = 'public'
  85  |        AND p.proname = 'create_service_request_with_notifications'`
  86  |     );
  87  | 
  88  |     const definition = funcRows[0]?.definition || '';
  89  |     // The function should check provider_status = 'available' in its nearby CTE
  90  |     expect(definition).toContain("'available'");
  91  |     expect(definition).toContain('provider_status');
  92  |   });
  93  | 
  94  |   test('Stuck busy provider with stale accepted request must be excluded', async () => {
  95  |     const pool = getPool();
  96  | 
  97  |     // Setup: provider is online, has wallet, but busy with a stale request
  98  |     await createProviderWithStatus(provider.id, {
  99  |       onlineStatus: true,
  100 |       providerStatus: 'busy',
  101 |       serviceType: 'Plumbing',
  102 |       latitude: 33.6844,
  103 |       longitude: 73.0479,
  104 |       walletBalance: 100,
  105 |     });
  106 | 
  107 |     // Create a request that is stuck in 'accepted' status
  108 |     const requestId = await createServiceRequest(customer.id, provider.id);
  109 | 
  110 |     // Verify provider is busy
  111 |     const { rows: beforeRows } = await pool.query(
  112 |       `SELECT provider_status FROM ustaz_registrations WHERE "userId" = $1`,
  113 |       [provider.id]
  114 |     );
  115 |     expect(beforeRows[0].provider_status).toBe('busy');
  116 | 
  117 |     // Stale the request (set created_at to 45 minutes ago)
  118 |     await pool.query(
  119 |       `UPDATE service_requests SET created_at = NOW() - INTERVAL '45 minutes' WHERE id = $1`,
  120 |       [requestId]
  121 |     );
  122 | 
  123 |     // Act: try to find providers — busy provider should be excluded
  124 |     const { rows: dispatchRows } = await pool.query(
  125 |       `SELECT user_id FROM find_providers_nearby(33.6844, 73.0479, 5000, 'Plumbing')`
  126 |     );
  127 |     const dispatchedIds = dispatchRows.map((r: any) => r.user_id);
  128 | 
  129 |     // ASSERT: Busy provider must NOT be dispatched
  130 |     // Before fix: this FAILS (bug exists)
  131 |     // After fix + release_stuck_providers: this PASSES
  132 |     expect(dispatchedIds).not.toContain(provider.id);
  133 |   });
  134 | });
  135 | 
```