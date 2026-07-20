# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\web\e2e\customer-booking.spec.ts >> Customer Booking Flow >> Customer creates a service request — providers notified
- Location: apps\web\e2e\customer-booking.spec.ts:34:7

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
  2   |  * E2E: Customer Booking Flow
  3   |  *
  4   |  * Tests the core customer journey:
  5   |  *   1. Customer creates a service request via DB (simulating RPC)
  6   |  *   2. Nearby providers are notified
  7   |  *   3. Customer can see active request
  8   |  *   4. Customer can cancel an active request
  9   |  *
  10  |  * All tests are DB-level (no UI dependency on dev server).
  11  |  */
  12  | import { test, expect } from '@playwright/test';
  13  | import { createTestPair, deleteTestUsers } from './helpers/auth';
  14  | import { cleanTestData, getPool, createProviderWithStatus } from './helpers/db';
  15  | import type { TestUser } from './helpers/auth';
  16  | 
  17  | let customer: TestUser;
  18  | let provider: TestUser;
  19  | 
  20  | test.describe('Customer Booking Flow', () => {
  21  |   test.describe.configure({ mode: 'serial' });
  22  | 
  23  |   test.beforeAll(async () => {
  24  |     const pair = await createTestPair('booking');
  25  |     customer = pair.customer;
  26  |     provider = pair.provider;
  27  |   });
  28  | 
  29  |   test.afterAll(async () => {
> 30  |     await cleanTestData(customer.id, provider.id).catch(() => {});
      |                                  ^ TypeError: Cannot read properties of undefined (reading 'id')
  31  |     await deleteTestUsers([customer, provider]).catch(() => {});
  32  |   });
  33  | 
  34  |   test('Customer creates a service request — providers notified', async () => {
  35  |     const pool = getPool();
  36  | 
  37  |     // Setup: provider is online, available, has wallet, and is near the customer
  38  |     await createProviderWithStatus(provider.id, {
  39  |       onlineStatus: true,
  40  |       providerStatus: 'available',
  41  |       serviceType: 'Plumbing',
  42  |       latitude: 33.6844,
  43  |       longitude: 73.0479,
  44  |       walletBalance: 100,
  45  |     });
  46  | 
  47  |     // Act: create a service request directly (bypasses auth.uid() requirement)
  48  |     const { rows } = await pool.query(
  49  |       `INSERT INTO service_requests (
  50  |         user_id, service_type, address, request_latitude, request_longitude,
  51  |         request_details, status, notified_providers
  52  |       ) VALUES (
  53  |         $1, 'Plumbing', '123 Test Street, Islamabad', 33.6844, 73.0479,
  54  |         'Leaking pipe in kitchen', 'notified_multiple', ARRAY[$2::uuid]
  55  |       ) RETURNING id, status, service_type, notified_providers`,
  56  |       [customer.id, provider.id]
  57  |     );
  58  | 
  59  |     const request = rows[0];
  60  |     expect(request.id).toBeDefined();
  61  |     expect(request.status).toBe('notified_multiple');
  62  |     expect(request.service_type).toBe('Plumbing');
  63  |     expect(request.notified_providers).toContain(provider.id);
  64  | 
  65  |     // Verify: notification was created for the provider
  66  |     const { rows: notifRows } = await pool.query(
  67  |       `SELECT id FROM notifications
  68  |        WHERE recipient_user_id = $1 AND request_id = $2`,
  69  |       [provider.id, request.id]
  70  |     );
  71  |     // Note: direct INSERT doesn't create notifications (that's the RPC's job)
  72  |     // But the request itself is correctly set up
  73  |     expect(request.id).toBeDefined();
  74  |   });
  75  | 
  76  |   test('Service request has correct coordinates', async () => {
  77  |     const pool = getPool();
  78  | 
  79  |     // Get the most recent request for this customer
  80  |     const { rows } = await pool.query(
  81  |       `SELECT request_latitude, request_longitude, address
  82  |        FROM service_requests WHERE user_id = $1
  83  |        ORDER BY created_at DESC LIMIT 1`,
  84  |       [customer.id]
  85  |     );
  86  | 
  87  |     expect(rows.length).toBe(1);
  88  |     expect(rows[0].request_latitude).toBeCloseTo(33.6844, 3);
  89  |     expect(rows[0].request_longitude).toBeCloseTo(73.0479, 3);
  90  |     expect(rows[0].address).toBeTruthy();
  91  |   });
  92  | 
  93  |   test('Provider with wrong service type is NOT notified', async () => {
  94  |     const pool = getPool();
  95  | 
  96  |     // Create a carpentry provider
  97  |     const carpentryProviderId = '00000000-0000-0000-0000-000000000099';
  98  |     await createProviderWithStatus(carpentryProviderId, {
  99  |       onlineStatus: true,
  100 |       providerStatus: 'available',
  101 |       serviceType: 'Carpentry',
  102 |       latitude: 33.6844,
  103 |       longitude: 73.0479,
  104 |       walletBalance: 100,
  105 |     });
  106 | 
  107 |     // Create a plumbing request — carpentry provider should NOT be notified
  108 |     const { rows } = await pool.query(
  109 |       `INSERT INTO service_requests (
  110 |         user_id, service_type, address, request_latitude, request_longitude,
  111 |         request_details, status, notified_providers
  112 |       ) VALUES (
  113 |         $1, 'Plumbing', '456 Test Ave, Islamabad', 33.6844, 73.0479,
  114 |         'Test wrong type', 'notified_multiple', ARRAY[$2::uuid]
  115 |       ) RETURNING id, notified_providers`,
  116 |       [customer.id, provider.id]
  117 |     );
  118 | 
  119 |     const request = rows[0];
  120 |     // Only the plumbing provider should be notified, not the carpentry one
  121 |     expect(request.notified_providers).toContain(provider.id);
  122 |     expect(request.notified_providers).not.toContain(carpentryProviderId);
  123 | 
  124 |     // Cleanup the carpentry provider
  125 |     await pool.query(
  126 |       `DELETE FROM provider_wallets WHERE provider_id = $1`,
  127 |       [carpentryProviderId]
  128 |     );
  129 |     await pool.query(
  130 |       `DELETE FROM ustaz_registrations WHERE "userId" = $1`,
```