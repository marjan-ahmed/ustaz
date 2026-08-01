# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Coding Guidelines (Karpathy Rules)

All code work in this repo must follow these behavioral guidelines to avoid common LLM coding mistakes:

### 1. Think Before Coding
- State assumptions explicitly before writing code.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
- Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked. No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes
- Touch only what's required for the request.
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Clean up only your own orphans (unused imports/variables from YOUR changes), not pre-existing dead code.
- Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
- Define verifiable success criteria before starting.
- For multi-step tasks, state a brief plan with verify checks.
- Loop until verified, not until "it looks right."
- Weak criteria ("make it work") require clarification.

## Project Overview

npm workspaces monorepo for **Ustaz**, a Pakistani home-services marketplace
(Karachi pilot, pre-revenue). Customers request a service, PostGIS matches nearby
verified providers, and the job is tracked live to the door with a 3-day warranty.

Live MVP: `ustaz-bice.vercel.app`. See `README.md` for the pitch-level framing.

## Monorepo Layout

| Workspace | Package | What it is |
|---|---|---|
| `apps/web` | `@ustaz/web` | Next.js 15 (App Router, Turbopack) — the production app. Customer + provider + admin. |
| `apps/website` | `@ustaz/website` | Standalone marketing site, port 3002, deployed to Vercel separately. |
| `apps/mobile` | `@ustaz/mobile` | Expo SDK 54 React Native. Has its own `CLAUDE.md` → `AGENTS.md` (read the versioned Expo docs first). |
| `packages/shared` | `@ustaz/shared` | `theme/`, `types/`, `utils/` behind a root `index.ts` barrel. No `src/`. Also exports `PROVIDER_MIN_WALLET_BALANCE = 60`. |
| `packages/assets` | — | Favicons, `site.webmanifest`, app icons. |

Supabase is the backend for all three apps.

**`packages/shared` is NOT resolvable from `apps/website` on Vercel.** That's why
`KARACHI_AREAS` is deliberately duplicated between
`packages/shared/utils/areas.ts` and an inline copy in
`apps/website/src/components/ResidencyInput.tsx`. Editing one silently diverges
from the other — change both.

## Development Commands

```bash
npm run dev:web         # Next.js Turbopack dev server from apps/web on :3000
npm run dev:website     # marketing site on :3002
npm run dev:mobile      # Expo dev server (port 8082)

npm run build:web       # sets NODE_OPTIONS=--max-old-space-size=4096 (needed; see Windows gotcha)
npm run build:website
npm run build:mobile    # expo export

npm --workspace @ustaz/web run lint       # next lint, per workspace
cd apps/web && npx tsc --noEmit           # typecheck
```

`apps/web` currently has pre-existing `noImplicitAny` errors in
`src/app/auth/callback/route.ts` and `src/lib/server.ts`. They are not yours —
don't "fix" them as a side effect of unrelated work, and don't treat a clean
typecheck as the bar unless you caused a new error.

## Architecture

- **Auth**: Supabase phone OTP via custom Edge Functions (`send-otp` + `verify-otp`).
  Sessions stored in **cookies** via `@supabase/ssr` (NOT localStorage —
  never revert this; server routes read auth from cookies). Mobile additionally
  supports Google Sign-In and email sign-in.
- **DB**: Postgres + PostGIS for proximity matching. RLS is enforced on every
  sensitive table; all privileged operations go through `SECURITY DEFINER` RPCs.
- **Realtime**: two channels — `location-update:{requestId}` (broadcast, hot path)
  and `postgres_changes` for state transitions on `service_requests`.
- **Push (closed-tab)**: FCM HTTP v1 via `send-fcm` Edge Function; tokens in
  `fcm_tokens` (RLS, self-only); `useFcmToken` hook on dashboard + process.
- **Maps**: Google Maps via `@react-google-maps/api`.
- **i18n**: next-intl. Web: EN/UR/AR with RTL. Website: EN/UR only (`apps/website/messages/`).
- **Twilio Verify**: SMS provider for OTP, called from Edge Functions only.

### Key Components
- **ServiceContext**: Manages service request state (address, service type, coordinates).
- **API Routes (`apps/web/src/app/api/`)**: ALL routes use `createServerClient` from
  `@supabase/ssr` and derive `user.id` from `auth.getUser()` — never trust
  `userId` or `providerId` from the request body.
- **`ProviderLocationTracker`**: Always-mounted at top of dashboard `<main>`;
  uses `watchPosition` + broadcasts on `location-update:{requestId}` and
  persists every ping to `live_locations` (upsert on `request_id`).
- **`useProviderLocation` / customer `/process` page**: subscribes to broadcast
  + polls `live_locations` every 5 s as race-condition safety net.

## Critical Invariants — Do Not Violate

1. **Browser session storage is cookies, NOT localStorage.**
   `apps/web/client/supabaseClient.ts` MUST use `createBrowserClient` from `@supabase/ssr`.
   Reverting to plain `@supabase/supabase-js` breaks every server route.
2. **Provider `userId` = `auth.uid()`.** Registration is gated by phone OTP;
   no random UUIDs. RLS on `ustaz_registrations` enforces this.
3. **All state mutations go through RPCs.** Direct UPDATE on
   `service_requests` from the client is blocked by RLS.
4. **`auth.uid()` is read server-side, never trusted from body.**
5. **`/dashboard?userId=...` is dead.** Middleware strips the param;
   dashboard derives identity from session.

## Supabase

Project ref: `solrsmnkxklsqklqhgxf`.

Prefer the **Supabase MCP** for schema/data changes — `mcp__supabase__apply_migration`,
`mcp__supabase__execute_sql`, `mcp__supabase__deploy_edge_function`,
`mcp__supabase__get_logs`. Don't print SQL for the user to paste.

`supabase/migrations/` is the DDL history — always use `apply_migration`, not raw
SQL. `supabase/functions/` mirrors deployed Edge Function source.

### Deployed Edge Functions (all `verify_jwt=false`)
- `send-otp` — Twilio Verify send + DB rate limit (`otp_attempts` table).
- `verify-otp` — Twilio Verify check → upsert auth user with synthesized email
  `<digits>@phone.ustaz.local` → `admin.generateLink({ type:'magiclink' })` →
  client exchanges `token_hash` via `supabase.auth.verifyOtp` to set the cookie.
- `verify-cnic` — sends the uploaded CNIC image to **OCR.space** and compares the
  extracted number against the typed one; writes `cnic_verifications` and sets
  `ustaz_registrations.verification_status`. Gates going online.
- `send-fcm` — FCM HTTP v1 send. Server-to-server only; guarded by
  `x-internal-secret`. Auto-prunes `UNREGISTERED` / `NOT_FOUND` tokens.
  Called by Next.js routes via `src/lib/sendPush.ts`.

### Required Edge Function secrets
- OTP: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SID`, `PHONE_PEPPER`
- CNIC: `OCR_SPACE_API_KEY`
- Push: `FCM_SERVICE_ACCOUNT_JSON` (rotated key only — never commit), `INTERNAL_API_SECRET`

Set via Dashboard → Edge Functions → Secrets. Never paste the FCM service account
JSON anywhere except the Supabase secret store.

### Twilio gotchas
- **Verify Geo-Permissions**: PK is blocked by default. Enable per-country in the
  Verify Service settings.
- **Trial accounts**: only SMS to numbers verified in the Twilio Console.

## State Machine — service_requests.status

`notified_multiple → accepted → provider_enroute → arriving → arrived
 → in_progress → work_in_progress → completed`
Terminal: `cancelled`, `no_ustaz_found`, `rejected`.

Each transition is a `SECURITY DEFINER` RPC: `accept_service_request_authed`,
`update_request_to_arriving`, `update_request_to_arrived`,
`update_request_to_in_progress` / `start_service`, `complete_service`,
`cancel_service_request`. `src/app/api/update-request-status/route.ts`
dispatches to them based on `action` and a session-derived `user.id`.

Timer columns: `provider_arrived_at`, `service_started_at`, `service_completed_at`.
`complete_service` also clears `live_locations` for the request and sets the
provider back to `available`.

Adding a status? Update the RPC + the dashboard render conditions + the customer
`RequestStatus` union + the `update-request-status` action list + `RatingModal`
display conditions.

## Dispatch / Matching

`create_service_request_with_notifications(p_service_type, p_request_latitude,
p_request_longitude, p_request_details, p_radius_meters, p_landmark,
p_entrance_photo_url)` inserts the request then does **sequential radius
expansion over `ARRAY[5000, 10000, 15000]` metres** — nearest tier first, widening
only if that tier found zero providers. The tiers intentionally mirror the
visiting-fee tiers. If every tier is empty the request goes `no_ustaz_found`.

`find_providers_nearby` filters on `online_status` only — **NOT** `provider_status`.
A `busy` provider is still notified. Matching also requires a `service_type` match
+ `location` within radius (`ST_DWithin`); a provider with no `location`, or who is
offline, is skipped. `provider_status` flips `available → busy` on accept and back
on complete/cancel — a stuck `accepted` request keeps them `busy` forever
(`release_stuck_providers(p_stale_minutes)` exists to clear these, but see the
scheduling gotcha below).

**Overloaded matching RPCs — read before adding another.** These exist in multiple
signatures and PostgREST resolves by argument names:
`find_providers_nearby` (×2), `find_providers_nearby_ranked` (×2),
`get_nearby_providers` (×2), `get_nearest_ustaz` (×2), plus
`find_providers_nearby_unified`, `find_nearby_providers`, and
`get_provider_reliability_score`. Adding another overload risks an ambiguous-function
error at runtime. Prefer editing an existing signature over creating a new one, and
check which one the caller actually uses.

## Wallet / Escrow / Commission

Prepaid wallet model — the provider tops up; the platform deducts its slice
per job. Cash flows directly customer → provider; only the commission is digitized.

Tables: `provider_wallets`, `wallet_transactions`, `topup_requests`.
RPC: `get_wallet(p_provider_id)`. **All internal references use `pw.balance` etc.
aliased to avoid RETURNS TABLE column ambiguity** (PostgreSQL treats those as
in-scope variables).

### Visiting fee + commission (NOT a flat completion fee)

- `calculate_visiting_fee(p_distance_km)` — ≤5 km → **Rs. 500**, ≤10 km →
  **Rs. 1000**, >10 km → **Rs. 1500** (NULL distance → 1500).
- `accept_service_request` computes it from the real accepted distance and stores
  it on `service_requests.visiting_fee`.
- **12% of the visiting fee is deducted on `arrived`**, inside
  `update_request_to_arrived` — *not* on completion. Floored at the available
  balance (`LEAST(ROUND(fee * 0.12), balance)`) and writes a `commission` row to
  `wallet_transactions`. **`complete_service` charges nothing.**

These figures are published in the Terms of Use (`/terms` §9). Changing them means
updating the RPC *and* the legal pages in both `apps/web` and `apps/website`.

### Going online is gated by an RPC, not the route

`POST /api/provider-status` contains no gating logic — it calls
`update_provider_online_status(p_user_id, p_online)`. That `SECURITY DEFINER` RPC
requires **both**, raising a user-facing EXCEPTION for each (the route surfaces
the message verbatim):

1. `ustaz_registrations.verification_status = 'verified'`.
2. `provider_wallets.balance >= 60` — hardcoded in the RPC, mirrored as
   `PROVIDER_MIN_WALLET_BALANCE` in `packages/shared/index.ts`. Keep in sync.

It also lazily inserts a zero-balance `provider_wallets` row on first call.
Note this gates *going online only* — a provider already online whose balance
drops is not forced offline.

### Topups

`WalletPanel.tsx` shows balance + a topup flow. The only methods offered are
**JazzCash and Easypaisa** (amount + transaction reference + receipt upload).
Receipts go to the `topup-receipts` bucket via `/api/topup/upload-receipt`.
Admin approves via `/api/admin/topup-action` → `approve_topup_request`.

## Provider Onboarding & Verification

Two entry points that converge:

1. **Pre-launch (marketing site)** — `/become-a-provider` → `ProviderPrelaunchForm`
   → `POST /api/provider-registration` → `provider_prelaunch_registrations`.
2. **Real signup (web app)** — phone OTP → become-ustaz wizard → `ustaz_registrations`.

`claim_prelaunch_provider_registration()` links the two on signup. **It matches on
digits-only `raw_user_meta_data->>'phone'`, NOT `auth.users.phone`** — that column
is observed NULL in this project. It strips non-digits on both sides and bails if
fewer than 9 digits, so junk metadata like `+92` can't mass-claim rows.

`residency` exists on **both** tables — add it to both when changing that field.

### Two verification paths coexist
- **Automated OCR** (`cnic_verifications`, live — has rows): `verify-cnic` Edge
  Function → OCR.space → `decision`, `ocr_number`, `ocr_result`.
- **Manual review** (`verification_submissions`, built but currently empty):
  `submit_verification` → admin `/admin/verification` →
  `approve_verification` / `reject_verification`.

Both set `ustaz_registrations.verification_status`. `protect_verification_fields`
is a trigger guarding those columns from client writes.

## Ratings (two-way after completion)

- **There is NO `ratings` table.** Ratings live as columns ON `service_requests`:
  `customer_rated` / `customer_rating_value` / `customer_rating_comment` and
  `provider_rated` / `provider_rating_value`. Aggregates live on
  `ustaz_registrations` (`rating_sum`, `rating_count`, `rating_avg`) for providers
  and on `profiles` for customers.
- `rate_user(p_request_id, p_rater_id, p_rating, p_comment)` is the one to call.
  A legacy `rate_service(...)` with a different signature also still exists —
  don't call it by mistake.
- `get_provider_stats(p_provider_id)` — rendered as a 3-tile card on the dashboard
  **profile tab**.
- `RatingModal` props: `requestId, raterId, ratedUserId, ratedUserName,
  onComplete, onClose`. Renders on `/process` when `requestStatus === 'completed'`.
  The **× close button is always available** — skip/dismiss does NOT mutate DB.
- After submit it fires `POST /api/chat/notify` to the rated provider, reusing the
  chat push pipeline (the push *title* falls back to chat sender-name logic).

## Warranty (3-day free re-fix)

- **`warranty_claims`**: `(request_id UNIQUE, customer_id, provider_id, status,
  description, claimed_at, provider_responded_at, resolved_at)`.
  `status`: `pending → accepted | refused | resolved`. One claim per request.
- **`ustaz_registrations.warranty_strikes`** incremented on refuse.
- **`respond_to_warranty(p_claim_id, p_response)`** — on `'refused'`: deducts
  **Rs. 200** (floored at 0), writes a `penalty` row, increments strikes.
- **Routes**: `POST /api/warranty/claim`, `POST /api/warranty/respond`.
- **Customer UI** = the **`/history` page**, via `get_customer_history()`.
  Shows completion time, a live 3-day countdown, and a claim button.
- **Provider UI** = the **Warranty tab** in the dashboard sidebar (amber badge).

## Safety Incidents, Standing & Appeals

A whole subsystem beyond the core booking flow — easy to miss.

- **`incidents`** — `(request_id, provider_id, customer_id, incident_type, status,
  severity, evidence, provider_response, customer_response, resolution,
  penalty_applied, penalty_amount, reviewed_by, reviewed_at)`.
  RPCs: `create_incident`, `resolve_incident`, `detect_incidents`.
  Routes: `/api/provider/report-incident`, `/api/admin/resolve-incident`.
- **`incident_check_ins`** — `(incident_id, sent_at, responded_at, response_type,
  gps_at_response)`. RPCs `send_check_in_prompt` / `respond_to_check_in`.
  **This captures GPS outside an active Service Request** — the one exception to
  "we only track during a job". The legal pages call this out explicitly; keep them
  aligned if you change it.
- **`appeals`** — `(incident_id, provider_id, appeal_type, reason, evidence, status,
  admin_response, reviewed_by, reviewed_at)`. RPCs `submit_appeal` / `resolve_appeal`.
  Routes: `/api/provider/submit-appeal`, `/api/admin/resolve-appeal`.
- **`provider_performance`** (per category) — `completed_jobs, rating_avg,
  recency_weighted_avg, incident_count, justified_complaint_count,
  disputed_complaint_count`. Updated by `update_provider_performance`.
- **`provider_standing`** (per provider) — `tier, tier_changed_at,
  tier_change_reason, suspension_active, suspension_reason, suspension_until,
  probation_jobs_remaining`. Recomputed by `recalculate_provider_tier`.

These feed matching rank via `get_provider_reliability_score`. Because they can
suspend an account automatically, the Terms (§17 automated decisions, §19 appeals)
and Privacy Policy (§11) describe them — update the legal pages alongside any
behaviour change.

## Chat (real-time + push)

- **`chat_messages (id, sender_id, recipient_id, message, created_at)`** —
  append-only. RLS: `chat_party_select`; `chat_send` requires
  `sender_id = auth.uid()` AND a `service_requests` row linking sender and
  recipient where status is active OR `completed` within the last **7 days**.
  `UPDATE`/`DELETE` are revoked from `authenticated`/`anon` entirely.
- **NO legacy `validate_chat_message_users` trigger** — dropped. It required the
  recipient to exist in `profiles`, which broke provider → customer messages.
- **NO legacy `Users can send/view/update` RLS policies** — dropped. Permissive
  `using: true` policies OR'd with the strict ones and silently defeated them.
- **Realtime**: subscribe to `postgres_changes` INSERT with NO filter;
  compound `and(or(...))` filters are silently dropped. RLS gates what arrives.
  Always dedupe by `id` and reconcile optimistic rows by matching `_pending`.
- **Optimistic UI is required.** Insert `id: temp_…` with `_pending: true`, swap on
  the realtime echo, roll back on failure (restoring the draft).
- **Chat push** (`/api/chat/notify`): cookie-auth derives the sender, looks up the
  display name, fires `sendPush` fire-and-forget.
- **Unread badge**: per-provider `unread-chat:{providerId}` channel; clears when
  the Chat tab opens.
- **Bubble colours (both surfaces)**: own/sent = brand orange `#db4b0d` white text;
  received = white bubble dark text.
- **Provider's conversation list** is seeded from recent `service_requests`, NOT
  only from existing `chat_messages`. Customer names come from
  `get_user_display_name(p_user_id)` (reads `auth.users.raw_user_meta_data`).

## Customer conveniences

- **`saved_addresses`** — `(label, address, latitude, longitude, landmark,
  entrance_photo_url, is_default)`. The entrance photo is shown to a matched provider.
- **`address_service_history`** — `(address_id, request_id, provider_id,
  service_type, issue_description, recurring_issue)`. Powers `get_address_history`
  and `check_recurring_issue`.
- **`favorites`** — `get_favorite_providers(p_customer_id)`.
- **`email_verifications`** — `create_email_verification` / `consume_email_verification`,
  routes under `/api/email/verify/*`.

## Provider tracking card

`ProviderTrackingInfo` on `/process`:
- Status-aware coloured header strip mapping every `service_requests.status` to a
  colour + label + sub-line + icon. Pulse "Live" dot on fresh broadcast ping.
- ETA + Distance tiles. **Distance < 1 km renders as meters**.
- Reverse-geocodes provider lat/lng via Google Geocoding. Debounced 600 ms,
  module-level cache keyed at ~11 m precision. Falls back to raw coords.

The card stays mounted through **every** active status. The `ACTIVE_STATUSES`
constant in `process/page.tsx` is the single source of truth — update it, the
visibility gate, and the map `searchPhase` together.

## Admin Portal

Separate session-isolated portal, gated by env `ADMIN_EMAIL` / `ADMIN_PASSWORD`
(server-only) with `admin_login_attempts` + `check_admin_login_rate(p_ip)`.

Pages: `/admin/login`, `/admin/dashboard` (topups), `/admin/providers`,
`/admin/verification`, `/admin/incidents`, `/admin/appeals`, `/admin/observability`.

Admin routes are gated separately from customer/provider session cookies and
should never run under the public Supabase RLS context.

## Marketing Website (apps/website)

Standalone Next.js 15 landing page, port 3002, deployed on Vercel separately.
**No booking flow** — it funnels to the app, a waitlist, and provider pre-registration.

API routes: `/api/waitlist`, `/api/provider-registration`, `/api/stats`.
`src/lib/supabase.ts` is a server-side service-role client.

### Design system

Brand tokens — **use ONLY these**:
`#DB4B0D` primary orange · `#FF6B4A` light · `#C24309` dark hover ·
`#0F1729` dark navy · `#FFF7ED` cream.
NO other colors (no blue, green, purple, yellow). Neutral `gray-*` for text/borders only.

Typography:
- **Headings**: Clash Grotesk via Fontshare CDN `<link>`, **NOT** `next/font`.
  Applied with inline `style={{fontFamily: 'Clash Grotesk, sans-serif'}}` on every
  heading. Do NOT use a Tailwind `font-heading` class.
- **Body EN**: Atkinson Hyperlegible (local TTF via `next/font/local`).
  **Body UR**: Gulzar. **Body AR**: IBM Plex Sans Arabic.
- **Display/counter numbers**: Anton (local TTF).

### Website gotchas
- `waitlist` table: `name` NOT NULL, `email` UNIQUE, RLS allows anonymous INSERT.
- StaggeredMenu (React Bits) needs `isFixed={true}` for mobile layout.
- DownloadCTA is a "Coming Soon" CTA — the app has not launched.

## Legal pages — six files, keep them in sync

`{terms,privacy-policy,cookie-policy}/page.tsx` exist in **both** `apps/web/src/app/`
and `apps/website/src/app/`. They are separate copies with slightly different
markup (the website versions use double quotes and inline `scroll-mt-24`).

Each page has a `sections` const, headings whose `id` matches, and numbered labels.
**When adding a section, update the `sections` array + the heading `id` + the
heading number + every `§ n` cross-reference together** — they must stay aligned.
Placeholder identity/contact values sit in `TODO(legal)`-marked consts at the top
of each file.

The legal text documents real system behaviour (fee tiers, commission timing,
GPS capture, automated suspension, OCR.space as a CNIC subprocessor). Changing
that behaviour means changing these pages.

## Known dead code / drift

- **`CookieConsent.tsx` is not mounted anywhere.** It renders analytics/marketing
  toggles but nothing imports it, so no consent UI ships. Don't cite it as proof
  consent is collected.
- **No analytics or telemetry is installed** — no GA, no product analytics, no
  error tracking. The legal pages state this explicitly.
- **`public.users` has RLS disabled** and is exposed to the anon key. It is empty
  (0 rows). Either drop it or enable RLS *with* policies — enabling RLS alone
  blocks all access.
- **`pg_cron` is NOT installed.** `purge_old_otp_attempts`, `release_stuck_providers`,
  `check_verification_expiry`, and `detect_incidents` exist but nothing schedules
  them. No data-retention deletion runs automatically; the only automatic cleanup
  is `complete_service` clearing `live_locations` and FCM pruning invalid tokens.
- `profiles` **is** in use (customer aggregates + Google profile data), despite
  earlier notes to the contrary.

## Testing Gotchas (don't skip)

- **Cookie collision / self-requests**: customer + provider in the same Chrome
  profile share cookies → server routes see the wrong `auth.uid()`. Symptom:
  `service_requests.user_id == accepted_by_provider_id`. Test with two profiles
  (one regular, one Incognito) where the customer's phone is **NOT** a registered
  provider.
- **Request tab vs popup**: incoming requests appear in BOTH the
  `ProviderRequestNotification` popup (driven by `notifications` realtime) AND the
  dashboard request tab (`serviceRequests`, no-filter `service_requests` sub).
  The no-filter sub can MISS the first INSERT. Mitigation: re-fetch on every
  `notifications` INSERT, plus an 8 s reconcile poll. `fetchServiceRequests`
  filters to `ACTIVE_REQUEST_STATUSES` only.
- **Provider geolocation**: needs browser location permission. Works on localhost;
  silently fails on non-localhost HTTP (HTTPS required). Check
  `window.isSecureContext` and degrade gracefully rather than hang.
- **Broadcast race**: the customer must subscribe before the provider's first ping
  or it is dropped (broadcast has no replay). The 5 s `live_locations` poll is the
  safety net.
- **postgres_changes filter ops**: only `eq, neq, lt, lte, gt, gte, in`.
  Array `cs` (contains) is silently dropped — filter client-side instead.
- **Windows `.next/cache` rename race**: `next-pwa` + Webpack on Windows can throw
  `Cannot read properties of undefined (reading 'length')` after several
  incremental builds. Fix: `rm -rf .next` before `npm run build`. Vercel is unaffected.
- **FCM service account is the keys-to-the-kingdom**: never paste it in chat, IDE
  selections, or anywhere except the Supabase secret store.

## E2E Tests

Playwright suite in `apps/web/e2e/` (`apps/web/playwright.config.ts`), with a
written `e2e/TEST-PLAN.md`. Specs: `tier0`, `customer-booking`,
`provider-acceptance`, `dispatch-integrity`, `state-machine`, `cancellation`,
`rating`, `warranty-flow`, `chat-flow`, `wallet-topup`, `admin-portal`,
`refresh-resilience`, `mobile-customer`, `mobile-provider`. Helpers in
`e2e/helpers/{auth,db}.ts`.

- **The suite MUST stay serial** — `workers: 1` and `fullyParallel: false`,
  because the tests mutate shared database state. Don't "optimize" this.
- `webServer` auto-starts `npm run dev` on :3000 (`reuseExistingServer` outside CI).
- Config loads `.env.local` via dotenv for `SUPABASE_SERVICE_ROLE_KEY`.

```bash
cd apps/web
npx playwright test                              # everything
npx playwright test e2e/rating.spec.ts           # one file
npx playwright test e2e/rating.spec.ts -g "name" # one test
npx playwright test --headed --debug             # watch it run
```

## Mobile (Expo)

`apps/mobile` has its own `CLAUDE.md` → `AGENTS.md`: **read the versioned Expo
docs before writing any code.** Capacitor has been removed entirely.

Mobile imports brand tokens/types/utilities from `packages/shared`, calls the same
Edge Functions and `SECURITY DEFINER` RPCs as web, and registers push tokens into
the existing `fcm_tokens` table. Web keeps cookie-backed Supabase sessions; mobile
uses platform-appropriate secure storage for the same JWT. Do **not** invent
mobile-specific RPCs or auth flows.

### Navigation (partially refactored)

**Customer tabs** (5): Home | Find | Jobs | Chat | Profile
**Provider tabs** (5): Home | Requests | Wallet | Chat | Profile

- `book.tsx` was split into `find.tsx` + `process.tsx` (root-level Stack screens),
  but a stale `app/(customer)/book.tsx` still exists and is still bundled by
  expo-router's `require.context`.
- Provider `index.tsx` is pending a split into `index.tsx` + `requests.tsx`.
- Swipe gesture between tabs is NOT implemented (planned).
- Shared chat component extraction from `(customer)/chat.tsx` and
  `(provider)/chat.tsx` is NOT done.

### Key files
- `app/process.tsx` — tracking screen; optional params with DB fallback, realtime sub
- `app/(customer)/find.tsx` — service selection, Google Places, map, request recovery
- `app/auth.tsx` — phone OTP with segmented `OtpInput`, Google OAuth, email sign-in
- `src/components/MapComponents.native.tsx` / `.web.tsx` — react-native-maps with
  ErrorBoundary / web stub
- `src/hooks/useServiceTimer.ts` — timer hook with NaN guard
- `src/lib/ustaz-api.ts` — `sendPhoneOtp()`, `verifyPhoneOtp()`, `setProviderOnlineStatus()`

### EAS builds — run from `apps/mobile`, never the repo root

```bash
cd apps/mobile
eas build --platform android --profile preview --non-interactive
```

The repo root has a stub `eas.json` + `app.json`, and the root `package.json` has
no `expo` dependency — building from there fails at prebuild with
`sh: 1: expo: not found`. The two configs also point at **different EAS projects**:
root → `marjan-ahmed/ustaz` (`a1792892…`), `apps/mobile` → `ustaz-bice/ustaz`
(`048c3fb3…`, package `com.ustaz.mobile`, keystore `cWPBZXsgSC`).

### Build requirements & gotchas
- **`.easignore` at the git root is the only one read**, and when it exists EAS
  **ignores `.gitignore` entirely** (only `.git` and `node_modules` are excluded by
  default). Everything gitignored must be repeated in `.easignore` or it ships in
  the archive. `apps/mobile/.easignore` is never read by the archiver.
- **`buffer` must stay an explicit dependency of `@ustaz/mobile`.**
  `react-native-svg@15.12.1` imports it without declaring it; locally it only
  resolved via `firebase-tools → archiver → readable-stream`, which EAS never
  installs. Don't "clean up" that dependency, and don't re-add a `buffer` entry to
  `metro.config.cjs` `extraNodeModules` — an override there wins over normal
  resolution and points at a path that doesn't exist on EAS.
- `EAS_SKIP_AUTO_FINGERPRINT=1` in `eas.json` `env` applies to the *remote* build
  only. To skip the slow local fingerprint step, set it in your shell before `eas`.
- Every `EXPO_PUBLIC_*` var the source reads must be in the build profile's `env`
  block — `.env.local` is gitignored and no longer ships in the archive.
- `android/` must be committed. Once it exists, `app.json` native config
  (`android.package`, Maps keys) is **ignored** — edit `android/app/build.gradle`
  and `AndroidManifest.xml` directly.
- `react-native-maps` has no Expo config plugin — `com.google.android.geo.API_KEY`
  goes in `AndroidManifest.xml` manually.
- `metro.config.cjs` uses `moduleSuffixes: [".web", ""]` for the web platform split.
- `expo-notifications` must be lazy-imported (dynamic `import()`) guarded by
  `Constants.appOwnership === 'expo'` to prevent an Expo Go crash on SDK 53+.
- **Node.js 22 on Windows** has an ESM import bug with drive-letter paths (`E:\...`).
  Use Node 20 at `C:\node20\node-v20.19.0-win-x64`.
- **Supabase email confirmation** must be disabled for development
  (Dashboard → Auth → Providers → Email → uncheck "Confirm email").
- **KeyboardAvoidingView on Android** needs `behavior='height'` (not `undefined`).

## Video Generation (ustaz-visuals)

Remotion project in `ustaz-visuals/` for marketing/demo videos.
`cd ustaz-visuals && npm run dev` to preview. Not part of the runtime app —
touch only when working on the marketing surface.
