# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rating.spec.ts >> Rating Flow >> Scenario A: Customer rates provider after completion
- Location: e2e\rating.spec.ts:43:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Rate Provider/i })
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByRole('heading', { name: /Rate Provider/i })

```

```yaml
- text: Internal Server Error
```

# Test source

```ts
  1   | /**
  2   |  * E2E: Rating Flow
  3   |  *
  4   |  * Tests:
  5   |  * 1. Customer submits a rating after service completion
  6   |  * 2. Duplicate rating prevention (UNIQUE constraint + existingRatings guard)
  7   |  * 3. Provider sees aggregated rating stats
  8   |  */
  9   | import { test, expect } from '@playwright/test';
  10  | import { createTestPair, signInByCookie, deleteTestUsers } from './helpers/auth';
  11  | import { createServiceRequest, cleanTestData, advanceRequestStatus, getPool } from './helpers/db';
  12  | import type { TestUser } from './helpers/auth';
  13  | 
  14  | let customer: TestUser;
  15  | let provider: TestUser;
  16  | let requestId: string;
  17  | 
  18  | test.describe('Rating Flow', () => {
  19  |   test.describe.configure({ mode: 'serial' });
  20  | 
  21  |   test.beforeAll(async () => {
  22  |     const pair = await createTestPair('rating-flow');
  23  |     customer = pair.customer;
  24  |     provider = pair.provider;
  25  | 
  26  |     // Create and complete a service request (advance through all states)
  27  |     requestId = await createServiceRequest(customer.id, provider.id);
  28  |     await advanceRequestStatus(requestId, 'arriving', provider.id);
  29  |     await advanceRequestStatus(requestId, 'arrived', provider.id);
  30  |     await advanceRequestStatus(requestId, 'in_progress', provider.id);
  31  |     await advanceRequestStatus(requestId, 'completed', provider.id);
  32  |   });
  33  | 
  34  |   test.afterAll(async () => {
  35  |     const pool = getPool();
  36  |     await pool.query(`DELETE FROM ratings WHERE request_id = $1`, [requestId]).catch(() => {});
  37  |     await cleanTestData(customer.id, provider.id).catch(() => {});
  38  |     await deleteTestUsers([customer, provider]).catch(() => {});
  39  |     // Note: do NOT call pool.end() here — the singleton pool is shared across test files.
  40  |     // Closing it would break subsequent test files that call getPool().
  41  |   });
  42  | 
  43  |   test('Scenario A: Customer rates provider after completion', async ({ browser }) => {
  44  |     const ctx = await browser.newContext();
  45  |     const page = await ctx.newPage();
  46  | 
  47  |     await signInByCookie(ctx, customer.email);
  48  |     await page.goto('/process');
  49  |     await page.waitForLoadState('networkidle');
  50  | 
  51  |     // Wait for RatingModal to appear
  52  |     const ratingModal = page.getByRole('heading', { name: /Rate Provider/i });
> 53  |     await expect(ratingModal).toBeVisible({ timeout: 20_000 });
      |                               ^ Error: expect(locator).toBeVisible() failed
  54  | 
  55  |     // Click 4th star
  56  |     const starButtons = page.locator('button[aria-label*="star"], button[role="radio"]');
  57  |     await expect(starButtons).toHaveCount(5);
  58  |     await starButtons.nth(3).click(); // 4th star (index 3)
  59  | 
  60  |     // Type a comment
  61  |     const commentArea = page.locator('textarea#rating-comment, textarea[name="comment"]');
  62  |     await expect(commentArea).toBeVisible();
  63  |     await commentArea.fill('Great service! Very professional and on time.');
  64  | 
  65  |     // Click Submit
  66  |     const submitBtn = page.getByRole('button', { name: /Submit Rating|Submit/i });
  67  |     await expect(submitBtn).toBeEnabled();
  68  |     await submitBtn.click();
  69  | 
  70  |     // Should show thank-you message after submission
  71  |     await expect(page.getByText(/Thank you!|Rating submitted!/i)).toBeVisible({ timeout: 10_000 });
  72  | 
  73  |     // Verify DB: rating exists
  74  |     const pool = getPool();
  75  |     const { rows } = await pool.query(
  76  |       `SELECT rating, comment FROM ratings WHERE request_id = $1 AND rater_id = $2`,
  77  |       [requestId, customer.id],
  78  |     );
  79  |     expect(rows[0]?.rating).toBe(4);
  80  |     expect(rows[0]?.comment).toContain('Great service');
  81  | 
  82  |     await ctx.close();
  83  |   });
  84  | 
  85  |   test('Scenario B: Customer cannot rate again (existingRatings guard)', async ({ browser }) => {
  86  |     const ctx = await browser.newContext();
  87  |     const page = await ctx.newPage();
  88  | 
  89  |     await signInByCookie(ctx, customer.email);
  90  |     await page.goto('/process');
  91  |     await page.waitForLoadState('networkidle');
  92  | 
  93  |     // Wait for page to settle — the rating modal should NOT appear again
  94  |     // because the existingRatings state guard prevents it
  95  |     await page.waitForTimeout(3000);
  96  | 
  97  |     const ratingModal = page.getByRole('heading', { name: /Rate Provider/i });
  98  |     await expect(ratingModal).not.toBeVisible({ timeout: 5_000 });
  99  | 
  100 |     await ctx.close();
  101 |   });
  102 | 
  103 |   test('Scenario C: Provider sees rating stats on dashboard', async ({ browser }) => {
  104 |     const ctx = await browser.newContext();
  105 |     const page = await ctx.newPage();
  106 | 
  107 |     await signInByCookie(ctx, provider.email);
  108 |     await page.goto('/dashboard');
  109 |     await page.waitForLoadState('networkidle');
  110 | 
  111 |     // Dashboard should load successfully
  112 |     await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  113 | 
  114 |     await ctx.close();
  115 |   });
  116 | });
  117 | 
```