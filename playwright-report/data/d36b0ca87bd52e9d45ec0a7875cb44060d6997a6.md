# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cancellation.spec.ts >> Cancellation Flow >> Scenario A: Customer cancels request from /process page
- Location: e2e\cancellation.spec.ts:32:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /cancel|cancel request/i })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('button', { name: /cancel|cancel request/i })

```

```yaml
- text: Internal Server Error
```

# Test source

```ts
  1  | /**
  2  |  * E2E: Cancellation Flow
  3  |  *
  4  |  * Tests:
  5  |  * 1. Customer cancels a request from the /process page
  6  |  * 2. Provider no-show cancellation via RPC (DB-level test)
  7  |  * 3. Provider status reset after cancellation
  8  |  */
  9  | import { test, expect } from '@playwright/test';
  10 | import { createTestPair, signInByCookie, deleteTestUsers } from './helpers/auth';
  11 | import { createServiceRequest, cleanTestData, advanceRequestStatus, getPool } from './helpers/db';
  12 | import type { TestUser } from './helpers/auth';
  13 | 
  14 | let customer: TestUser;
  15 | let provider: TestUser;
  16 | let requestId: string;
  17 | 
  18 | test.describe('Cancellation Flow', () => {
  19 |   test.describe.configure({ mode: 'serial' });
  20 | 
  21 |   test.beforeAll(async () => {
  22 |     const pair = await createTestPair('cancel-flow');
  23 |     customer = pair.customer;
  24 |     provider = pair.provider;
  25 |   });
  26 | 
  27 |   test.afterAll(async () => {
  28 |     await cleanTestData(customer.id, provider.id).catch(() => {});
  29 |     await deleteTestUsers([customer, provider]).catch(() => {});
  30 |   });
  31 | 
  32 |   test('Scenario A: Customer cancels request from /process page', async ({ browser }) => {
  33 |     // Create a fresh request for this test
  34 |     requestId = await createServiceRequest(customer.id, provider.id);
  35 | 
  36 |     const ctx = await browser.newContext();
  37 |     const page = await ctx.newPage();
  38 | 
  39 |     await signInByCookie(ctx, customer.email);
  40 |     await page.goto('/process');
  41 |     await page.waitForLoadState('networkidle');
  42 | 
  43 |     // Wait for the cancel button to appear
  44 |     const cancelBtn = page.getByRole('button', { name: /cancel|cancel request/i });
> 45 |     await expect(cancelBtn).toBeVisible({ timeout: 15_000 });
     |                             ^ Error: expect(locator).toBeVisible() failed
  46 | 
  47 |     // Click cancel
  48 |     await cancelBtn.click();
  49 | 
  50 |     // Should see cancellation confirmation
  51 |     await expect(page.getByText(/cancelled|cancelled successfully/i)).toBeVisible({ timeout: 10_000 });
  52 | 
  53 |     // Verify DB: request status is cancelled
  54 |     const pool = getPool();
  55 |     const { rows } = await pool.query(
  56 |       `SELECT status FROM service_requests WHERE id = $1`,
  57 |       [requestId],
  58 |     );
  59 |     expect(rows[0]?.status).toBe('cancelled');
  60 | 
  61 |     await ctx.close();
  62 |   });
  63 | 
  64 |   test('Scenario B: Provider no-show cancellation via DB (RPC path test)', async () => {
  65 |     // Create a new request that will reach 'arrived' state
  66 |     const noShowRequestId = await createServiceRequest(customer.id, provider.id);
  67 |     await advanceRequestStatus(noShowRequestId, 'arriving', provider.id);
  68 |     await advanceRequestStatus(noShowRequestId, 'arrived', provider.id);
  69 | 
  70 |     // Cancel via DB (simulating 15-min no-show)
  71 |     const result = await advanceRequestStatus(noShowRequestId, 'cancelled', provider.id, customer.id);
  72 |     expect(result.success).toBe(true);
  73 | 
  74 |     // Verify DB: request cancelled, provider available
  75 |     const pool = getPool();
  76 |     const { rows: srRows } = await pool.query(
  77 |       `SELECT status FROM service_requests WHERE id = $1`,
  78 |       [noShowRequestId],
  79 |     );
  80 |     expect(srRows[0]?.status).toBe('cancelled');
  81 | 
  82 |     const { rows: regRows } = await pool.query(
  83 |       `SELECT provider_status FROM ustaz_registrations WHERE userId = $1`,
  84 |       [provider.id],
  85 |     );
  86 |     expect(regRows[0]?.provider_status).toBe('available');
  87 | 
  88 |     // Clean up this request
  89 |     await pool.query(`DELETE FROM service_requests WHERE id = $1`, [noShowRequestId]);
  90 |   });
  91 | });
  92 | 
```