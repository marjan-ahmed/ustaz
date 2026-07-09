# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: refresh-resilience.spec.ts >> Page Refresh Resilience >> Provider dashboard re-renders ArrivalWorkflow after refresh
- Location: e2e\refresh-resilience.spec.ts:32:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('main')

```

```yaml
- text: Internal Server Error
```

# Test source

```ts
  1  | /**
  2  |  * E2E: Page Refresh Resilience
  3  |  *
  4  |  * Tests that both customer and provider pages recover state after a full page reload.
  5  |  * The app subscribes to Realtime and has resume-request logic that queries
  6  |  * open requests on mount, so a refresh should restore the correct state.
  7  |  */
  8  | import { test, expect } from '@playwright/test';
  9  | import { createTestPair, signInByCookie, deleteTestUsers } from './helpers/auth';
  10 | import { createServiceRequest, cleanTestData, advanceRequestStatus } from './helpers/db';
  11 | import type { TestUser } from './helpers/auth';
  12 | 
  13 | let customer: TestUser;
  14 | let provider: TestUser;
  15 | let requestId: string;
  16 | 
  17 | test.describe('Page Refresh Resilience', () => {
  18 |   test.describe.configure({ mode: 'serial' });
  19 | 
  20 |   test.beforeAll(async () => {
  21 |     const pair = await createTestPair('refresh-resilience');
  22 |     customer = pair.customer;
  23 |     provider = pair.provider;
  24 |     requestId = await createServiceRequest(customer.id, provider.id);
  25 |   });
  26 | 
  27 |   test.afterAll(async () => {
  28 |     await cleanTestData(customer.id, provider.id).catch(() => {});
  29 |     await deleteTestUsers([customer, provider]).catch(() => {});
  30 |   });
  31 | 
  32 |   test('Provider dashboard re-renders ArrivalWorkflow after refresh', async ({ browser }) => {
  33 |     const ctx = await browser.newContext();
  34 |     const page = await ctx.newPage();
  35 |     await ctx.grantPermissions(['geolocation']);
  36 |     await ctx.setGeolocation({ latitude: 33.6844, longitude: 73.0479 });
  37 | 
  38 |     await signInByCookie(ctx, provider.email);
  39 |     await page.goto('/dashboard');
  40 |     await page.waitForLoadState('networkidle');
  41 | 
  42 |     // Wait for initial render — request is 'accepted', so ArrivalWorkflow should show
  43 |     await page.waitForTimeout(3000);
  44 | 
  45 |     // Advance to arriving so we can verify continuity
  46 |     await advanceRequestStatus(requestId, 'arriving', provider.id);
  47 | 
  48 |     // Now refresh the page
  49 |     await page.reload();
  50 |     await page.waitForLoadState('networkidle');
  51 | 
  52 |     // After refresh, the ArrivalWorkflow should still render for this request
  53 |     await page.waitForTimeout(5000);
  54 | 
  55 |     // The dashboard main section should be visible with the active request UI
> 56 |     await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
     |                                        ^ Error: expect(locator).toBeVisible() failed
  57 | 
  58 |     await ctx.close();
  59 |   });
  60 | 
  61 |   test('Customer /process page resumes request tracking after refresh', async ({ browser }) => {
  62 |     const ctx = await browser.newContext();
  63 |     const page = await ctx.newPage();
  64 | 
  65 |     await signInByCookie(ctx, customer.email);
  66 |     await page.goto('/process');
  67 |     await page.waitForLoadState('networkidle');
  68 | 
  69 |     // Wait for the resume-request effect to fire and query open requests
  70 |     await page.waitForTimeout(5000);
  71 | 
  72 |     // The main app shell should be visible
  73 |     await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  74 | 
  75 |     await ctx.close();
  76 |   });
  77 | });
  78 | 
```