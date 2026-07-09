# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: state-machine.spec.ts >> State Machine Lifecycle >> Step 1: Provider clicks "I'm on my way" → arriving
- Location: e2e\state-machine.spec.ts:42:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /I'm on my way/i })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('button', { name: /I'm on my way/i })

```

```yaml
- text: Internal Server Error
```

# Test source

```ts
  1   | /**
  2   |  * E2E: Full State Machine Lifecycle
  3   |  *
  4   |  * Tests the provider-side workflow:
  5   |  *   accepted → arriving → arrived → in_progress → completed
  6   |  *
  7   |  * Each step opens a fresh browser context and verifies the UI responds
  8   |  * correctly to the current request status from the DB.
  9   |  *
  10  |  * IMPORTANT: Tests run serially and share DB state. Each step reads the
  11  |  * request status left by the previous step — do NOT call
  12  |  * advanceRequestStatus redundantly between steps.
  13  |  */
  14  | import { test, expect } from '@playwright/test';
  15  | import { createTestPair, signInByCookie, deleteTestUsers } from './helpers/auth';
  16  | import { createServiceRequest, cleanTestData, advanceRequestStatus, getPool } from './helpers/db';
  17  | import type { TestUser } from './helpers/auth';
  18  | 
  19  | let customer: TestUser;
  20  | let provider: TestUser;
  21  | let requestId: string;
  22  | 
  23  | test.describe('State Machine Lifecycle', () => {
  24  |   test.describe.configure({ mode: 'serial' });
  25  | 
  26  |   test.beforeAll(async () => {
  27  |     const pair = await createTestPair('sm-lifecycle');
  28  |     customer = pair.customer;
  29  |     provider = pair.provider;
  30  | 
  31  |     // Create a service request pre-accepted (status = 'accepted')
  32  |     requestId = await createServiceRequest(customer.id, provider.id);
  33  | 
  34  |     // Do NOT advance here — Step 1 will do the first transition via UI
  35  |   });
  36  | 
  37  |   test.afterAll(async () => {
  38  |     await cleanTestData(customer.id, provider.id).catch(() => {});
  39  |     await deleteTestUsers([customer, provider]).catch(() => {});
  40  |   });
  41  | 
  42  |   test('Step 1: Provider clicks "I\'m on my way" → arriving', async ({ browser }) => {
  43  |     const ctx = await browser.newContext({ permissions: ['geolocation'] });
  44  |     const page = await ctx.newPage();
  45  | 
  46  |     await ctx.setGeolocation({ latitude: 33.6844, longitude: 73.0479 });
  47  |     await signInByCookie(ctx, provider.email);
  48  |     await page.goto('/dashboard');
  49  |     await page.waitForLoadState('networkidle');
  50  | 
  51  |     // ArrivalWorkflow should show "I'm on my way" button (en_route step)
  52  |     const onMyWayBtn = page.getByRole('button', { name: /I'm on my way/i });
> 53  |     await expect(onMyWayBtn).toBeVisible({ timeout: 15_000 });
      |                              ^ Error: expect(locator).toBeVisible() failed
  54  |     await onMyWayBtn.click();
  55  | 
  56  |     // Toast should confirm
  57  |     await expect(page.getByText(/Marked as arriving/i)).toBeVisible({ timeout: 10_000 });
  58  | 
  59  |     await ctx.close();
  60  |   });
  61  | 
  62  |   test('Step 2: Provider clicks "I\'ve arrived" → arrived + timestamp populated', async ({ browser }) => {
  63  |     const ctx = await browser.newContext({ permissions: ['geolocation'] });
  64  |     const page = await ctx.newPage();
  65  | 
  66  |     await ctx.setGeolocation({ latitude: 33.6844, longitude: 73.0479 });
  67  |     await signInByCookie(ctx, provider.email);
  68  |     await page.goto('/dashboard');
  69  |     await page.waitForLoadState('networkidle');
  70  | 
  71  |     // ArrivalWorkflow should show "I've arrived" button (still en_route step)
  72  |     const arrivedBtn = page.getByRole('button', { name: /I've arrived/i });
  73  |     await expect(arrivedBtn).toBeVisible({ timeout: 15_000 });
  74  |     await arrivedBtn.click();
  75  | 
  76  |     await expect(page.getByText(/You have arrived!/i)).toBeVisible({ timeout: 10_000 });
  77  | 
  78  |     // Verify DB: provider_arrived_at should be populated
  79  |     const pool = getPool();
  80  |     const { rows } = await pool.query(
  81  |       `SELECT provider_arrived_at FROM service_requests WHERE id = $1`,
  82  |       [requestId],
  83  |     );
  84  |     expect(rows[0]?.provider_arrived_at).not.toBeNull();
  85  | 
  86  |     await ctx.close();
  87  |   });
  88  | 
  89  |   test('Step 3: Provider clicks "Start Service" → in_progress + timer starts', async ({ browser }) => {
  90  |     const ctx = await browser.newContext({ permissions: ['geolocation'] });
  91  |     const page = await ctx.newPage();
  92  | 
  93  |     await ctx.setGeolocation({ latitude: 33.6844, longitude: 73.0479 });
  94  |     await signInByCookie(ctx, provider.email);
  95  |     await page.goto('/dashboard');
  96  |     await page.waitForLoadState('networkidle');
  97  | 
  98  |     // ArrivalWorkflow should show "Start Service" button (arrived step)
  99  |     const startBtn = page.getByRole('button', { name: /Start Service/i });
  100 |     await expect(startBtn).toBeVisible({ timeout: 15_000 });
  101 |     await startBtn.click();
  102 | 
  103 |     await expect(page.getByText(/Service started!/i)).toBeVisible({ timeout: 10_000 });
  104 | 
  105 |     // Verify DB: service_started_at populated
  106 |     const pool = getPool();
  107 |     const { rows } = await pool.query(
  108 |       `SELECT service_started_at FROM service_requests WHERE id = $1`,
  109 |       [requestId],
  110 |     );
  111 |     expect(rows[0]?.service_started_at).not.toBeNull();
  112 | 
  113 |     // ServiceTimer should be visible
  114 |     await expect(page.getByText(/Service Duration|Elapsed time/i)).toBeVisible({ timeout: 5_000 });
  115 | 
  116 |     await ctx.close();
  117 |   });
  118 | 
  119 |   test('Step 4: Provider clicks "Complete Service" → completed + provider status = available', async ({ browser }) => {
  120 |     const ctx = await browser.newContext({ permissions: ['geolocation'] });
  121 |     const page = await ctx.newPage();
  122 | 
  123 |     await ctx.setGeolocation({ latitude: 33.6844, longitude: 73.0479 });
  124 |     await signInByCookie(ctx, provider.email);
  125 |     await page.goto('/dashboard');
  126 |     await page.waitForLoadState('networkidle');
  127 | 
  128 |     const completeBtn = page.getByRole('button', { name: /Complete Service/i });
  129 |     await expect(completeBtn).toBeVisible({ timeout: 15_000 });
  130 |     await completeBtn.click();
  131 | 
  132 |     await expect(page.getByText(/Service completed!/i)).toBeVisible({ timeout: 10_000 });
  133 | 
  134 |     // Verify DB: service_completed_at populated, provider_status = 'available'
  135 |     const pool = getPool();
  136 |     const { rows: srRows } = await pool.query(
  137 |       `SELECT service_completed_at FROM service_requests WHERE id = $1`,
  138 |       [requestId],
  139 |     );
  140 |     expect(srRows[0]?.service_completed_at).not.toBeNull();
  141 | 
  142 |     const { rows: regRows } = await pool.query(
  143 |       `SELECT provider_status FROM ustaz_registrations WHERE userId = $1`,
  144 |       [provider.id],
  145 |     );
  146 |     expect(regRows[0]?.provider_status).toBe('available');
  147 | 
  148 |     await ctx.close();
  149 |   });
  150 | });
  151 | 
```