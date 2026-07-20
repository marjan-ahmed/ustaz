# Full E2E Test Implementation Plan

## Overview

10 test files, ~35 test cases, covering all critical user journeys for web + mobile.

---

## File 1: Fix `apps/web/e2e/helpers/db.ts`

### Changes
- Remove dead `DELETE FROM ratings` query (line 38-41) — `ratings` table doesn't exist
- Add cleanup for `service_requests` rating columns instead
- Add cleanup for `favorites` table
- Add cleanup for `saved_addresses` and `address_service_history`

### Updated `cleanTestData`
```typescript
export async function cleanTestData(
  customerUserId: string,
  providerUserId: string,
): Promise<void> {
  const p = getPool();
  // Reset rating columns on service_requests (no separate ratings table)
  await p.query(
    `UPDATE service_requests
     SET customer_rated = false, customer_rating_value = NULL,
         customer_rating_comment = NULL, provider_rated = false,
         provider_rating_value = NULL
     WHERE user_id = $1 OR accepted_by_provider_id = $2`,
    [customerUserId, providerUserId],
  );
  await p.query(
    `DELETE FROM live_locations WHERE provider_id = $1`,
    [providerUserId],
  );
  await p.query(
    `DELETE FROM favorites WHERE customer_id = $1 OR provider_id = $2`,
    [customerUserId, providerUserId],
  );
  await p.query(
    `DELETE FROM incidents WHERE provider_id = $1 OR request_id IN (
      SELECT id FROM service_requests WHERE user_id = $2 OR accepted_by_provider_id = $1
    )`,
    [providerUserId, customerUserId],
  );
  await p.query(
    `DELETE FROM provider_performance WHERE provider_id = $1`,
    [providerUserId],
  );
  await p.query(
    `DELETE FROM provider_standing WHERE provider_id = $1`,
    [providerUserId],
  );
  await p.query(
    `DELETE FROM appeals WHERE provider_id = $1`,
    [providerUserId],
  );
  await p.query(
    `DELETE FROM service_requests WHERE user_id = $1 OR accepted_by_provider_id = $2`,
    [customerUserId, providerUserId],
  );
  await p.query(
    `DELETE FROM notifications WHERE sender_user_id = $1 OR recipient_user_id = $2`,
    [customerUserId, providerUserId],
  );
  await p.query(
    `UPDATE ustaz_registrations SET provider_status = 'available' WHERE userId = $1`,
    [providerUserId],
  );
}
```

---

## File 2: Fix `apps/web/e2e/rating.spec.ts`

### Changes
- Remove `DELETE FROM ratings` in afterAll (line 36)
- Fix Scenario A DB assertion to query `service_requests` instead of `ratings`
- Fix Scenario C to actually verify provider stats

### Key Fix (Scenario A DB assertion)
```typescript
// OLD (broken):
const { rows } = await pool.query(
  `SELECT rating, comment FROM ratings WHERE request_id = $1 AND rater_id = $2`,
  [requestId, customer.id],
);

// NEW (correct):
const { rows } = await pool.query(
  `SELECT customer_rating_value, customer_rating_comment
   FROM service_requests WHERE id = $1 AND user_id = $2`,
  [requestId, customer.id],
);
expect(rows[0]?.customer_rating_value).toBe(4);
expect(rows[0]?.customer_rating_comment).toContain('Great service');
```

---

## File 3: `apps/web/e2e/customer-booking.spec.ts`

### Test Cases
1. **Customer can create a service request via DB** — Create request, verify status='notified_multiple', verify provider notified
2. **Customer sees active request on /process page** — Sign in, navigate to /process, verify request card visible
3. **Customer can cancel an active request** — Sign in, click cancel, verify status='cancelled'

### Setup
- Create customer + provider pair
- Provider must have wallet balance >= 60, online_status=true, provider_status='available'
- Provider must have location set (PostGIS)

---

## File 4: `apps/web/e2e/provider-acceptance.spec.ts`

### Test Cases
1. **Provider sees incoming requests on dashboard** — Sign in, verify request tab shows pending request
2. **Provider can accept a request** — Click accept, verify provider_status='busy', verify request status='accepted'
3. **Provider cannot accept when busy** — Accept request, verify second request not shown (provider is busy)

### Setup
- Create customer + provider pair
- Create a service request with status='notified_multiple'
- Provider has wallet balance >= 60

---

## File 5: `apps/web/e2e/chat-flow.spec.ts`

### Test Cases
1. **Customer can send a message** — Sign in as customer, navigate to chat, send message, verify it appears
2. **Provider receives the message** — Sign in as provider, navigate to chat, verify message visible
3. **Provider can reply** — Send reply, verify it appears
4. **Customer sees the reply** — Sign in as customer, verify reply visible

### Setup
- Create customer + provider pair
- Create an accepted service request (chat requires active request)
- Both users sign in via cookie injection

---

## File 6: `apps/web/e2e/wallet-topup.spec.ts`

### Test Cases
1. **Provider sees wallet balance** — Sign in, navigate to wallet tab, verify balance displayed
2. **Provider can initiate top-up** — Click top-up, enter amount, submit, verify topup_requests row created
3. **Admin can approve top-up** — Sign in as admin, navigate to /admin/dashboard, approve top-up, verify wallet balance increased

### Setup
- Create provider with wallet balance=0
- Admin credentials from env vars (ADMIN_EMAIL, ADMIN_PASSWORD)

---

## File 7: `apps/web/e2e/warranty-flow.spec.ts`

### Test Cases
1. **Customer can file warranty claim** — Sign in as customer, navigate to /history, click claim warranty, submit, verify warranty_claims row
2. **Provider sees warranty claim** — Sign in as provider, navigate to warranty tab, verify claim visible
3. **Provider can accept warranty claim** — Click accept, verify warranty_claims status='accepted'

### Setup
- Create customer + provider pair
- Create a completed service request (within 3-day window)
- Provider has wallet balance

---

## File 8: `apps/web/e2e/admin-portal.spec.ts`

### Test Cases
1. **Admin can login** — Navigate to /admin/login, enter credentials, verify redirect to /admin/dashboard
2. **Admin dashboard shows stats** — Verify pending top-ups table visible
3. **Admin can view providers** — Navigate to /admin/providers, verify provider list visible
4. **Admin can view verification submissions** — Navigate to /admin/verification, verify page loads

### Setup
- Admin credentials from env vars
- No test user creation needed (reads existing data)

---

## File 9: `apps/web/e2e/mobile-customer.spec.ts`

### Test Cases (Expo web target on :8082)
1. **Mobile home screen loads** — Navigate to :8082, verify home screen visible
2. **Mobile customer can navigate to book** — Click "Find" tab, verify booking screen loads
3. **Mobile customer can select service** — Click a service category, verify selection

### Notes
- Uses `baseURL: 'http://localhost:8082'` override
- Mobile UI uses different selectors (React Native web components)
- Some tests may need adjustment for React Native web rendering

---

## File 10: `apps/web/e2e/mobile-provider.spec.ts`

### Test Cases (Expo web target on :8082)
1. **Mobile provider dashboard loads** — Navigate to :8082, sign in as provider, verify dashboard visible
2. **Mobile provider sees requests** — Verify pending requests section visible
3. **Mobile provider can accept request** — Click accept, verify active job appears

### Notes
- Same mobile web target approach
- Provider must be registered in `ustaz_registrations`

---

## Implementation Order

1. Fix `db.ts` + `rating.spec.ts` (prerequisites)
2. `customer-booking.spec.ts` (core customer flow)
3. `provider-acceptance.spec.ts` (core provider flow)
4. `chat-flow.spec.ts` (communication)
5. `wallet-topup.spec.ts` (financial)
6. `warranty-flow.spec.ts` (post-service)
7. `admin-portal.spec.ts` (admin)
8. `mobile-customer.spec.ts` (mobile customer)
9. `mobile-provider.spec.ts` (mobile provider)

## Run Commands

```bash
# Run all tests
npx playwright test --project=chromium --reporter=list

# Run single file
npx playwright test e2e/customer-booking.spec.ts --project=chromium

# Run with debug
npx playwright test e2e/customer-booking.spec.ts --debug

# Run mobile tests (requires :8082 running)
npx playwright test e2e/mobile-*.spec.ts --project=chromium
```
