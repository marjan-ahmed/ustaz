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

npm workspaces monorepo for "Ustaz", a Pakistani home-services marketplace
(Karachi pilot). Customers request a service, PostGIS matches nearby verified
providers, and the job is tracked live to the door with a 3-day warranty.

## Monorepo Layout

| Workspace | Package | What it is |
|---|---|---|
| `apps/web` | `@ustaz/web` | Next.js 15 (App Router, Turbopack) — the production app. Customer + provider + admin. |
| `apps/website` | `@ustaz/website` | Standalone marketing site, port 3002, deployed to Vercel separately. |
| `apps/mobile` | `@ustaz/mobile` | Expo React Native. Has its own `CLAUDE.md` → `AGENTS.md` (read the versioned Expo docs first). |
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
```

## Architecture

- **Auth**: Supabase phone OTP via custom Edge Functions (`send-otp` + `verify-otp`).
  Sessions stored in **cookies** via `@supabase/ssr` (NOT localStorage —
  never revert this; server routes read auth from cookies).
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
   `service_requests` from the client is blocked by RLS. Use
   `accept_service_request_authed`, `update_request_to_arriving`, etc.
4. **`auth.uid()` is read server-side, never trusted from body.**
   Routes that need a provider id pull it from the session.
5. **`/dashboard?userId=...` is dead.** Middleware strips the param;
   dashboard derives identity from session.

## Supabase

Project ref: `solrsmnkxklsqklqhgxf`.

Prefer the **Supabase MCP** for schema/data changes — `mcp__supabase__apply_migration`,
`mcp__supabase__execute_sql`, `mcp__supabase__deploy_edge_function`,
`mcp__supabase__get_logs`. Don't print SQL for the user to paste.

`supabase/migrations/` is the DDL history — always use `apply_migration`, not raw
SQL. `supabase/functions/` mirrors deployed Edge Function source.

### Edge Functions (deployed; verify_jwt=false)
- `send-otp` — Twilio Verify send + DB rate limit (`otp_attempts` table).
  v8 returns friendly error messages for 400/401/429/502.
- `verify-otp` — Twilio Verify check → upsert auth user with synthesized email
  `<digits>@phone.ustaz.local` → `admin.generateLink({ type:'magiclink' })` →
  client exchanges `token_hash` via `supabase.auth.verifyOtp` to set the cookie.
- `verify-cnic` — OCR-checks the typed CNIC against the uploaded photo and sets
  `ustaz_registrations.verification_status`. Gates going online (see Wallet).
  Needs `OCR_SPACE_API_KEY`.
- `send-fcm` — FCM HTTP v1 send. Server-to-server only; guarded by
  `x-internal-secret` header. Mints OAuth2 access token from service account,
  looks up `fcm_tokens` for the recipient `userIds`, sends, auto-prunes
  `UNREGISTERED` / `NOT_FOUND` tokens. Called by Next.js routes via
  `src/lib/sendPush.ts` after request creation and accept.

### Required Edge Function secrets
- OTP: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SID`, `PHONE_PEPPER`
- CNIC: `OCR_SPACE_API_KEY`
- Push: `FCM_SERVICE_ACCOUNT_JSON` (rotated key only — never commit), `INTERNAL_API_SECRET`
- Both must also be present in Next.js (`.env.local`) where applicable:
  `NEXT_PUBLIC_FIREBASE_*` (web config), `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, `INTERNAL_API_SECRET`.
Set Supabase-side via Dashboard → Edge Functions → Secrets (multiline values OK
for the FCM JSON). Never paste the service account JSON anywhere except the
Supabase secret store.

### Twilio gotchas
- **Twilio Verify Geo-Permissions**: PK (and most non-US countries) blocked by
  default. Enable per-country in the Verify Service settings.
- **Trial accounts**: only SMS to phone numbers verified in the Twilio Console.

## State Machine — service_requests.status

`notified_multiple → accepted → provider_enroute → arriving → arrived
 → in_progress → work_in_progress → completed`
Terminal: `cancelled`, `no_ustaz_found`, `rejected`.

Each transition is a `SECURITY DEFINER` RPC: `accept_service_request_authed`,
`update_request_to_arriving`, `update_request_to_arrived`,
`update_request_to_in_progress` / `start_service`, `complete_service`,
`cancel_service_request`. The route at `src/app/api/update-request-status/route.ts`
dispatches to them based on `action` and a session-derived `user.id`.

Timer columns populated by these RPCs: `provider_arrived_at` (on `arrived`),
`service_started_at` (on `in_progress`), `service_completed_at` (on `completed`).
`complete_service` also clears `live_locations` for the request and sets the
provider back to `available`.

Adding a status? Update the RPC + the dashboard render conditions + the customer
`RequestStatus` union + the `update-request-status` action list + `RatingModal`
display conditions.

## Dispatch / Matching

`create_service_request_with_notifications` inserts the request then does
**sequential radius expansion over `ARRAY[5000, 10000, 15000]` metres** — it tries
the nearest tier first and widens only if that tier found zero providers. The
tiers intentionally mirror the visiting-fee tiers. If every tier comes back empty
the request goes `no_ustaz_found`.

`find_providers_nearby` filters on `online_status` only — **NOT** `provider_status`.
A `busy` provider is still notified of new requests. Matching also requires a
`service_type` match + `location` within radius (PostGIS `ST_DWithin`); a provider
with no `location`, or who is offline, is skipped. `provider_status` flips
`available → busy` on accept and back on complete/cancel — a stuck `accepted`
request keeps them `busy` forever.

## Wallet / Escrow / Commission

Prepaid wallet model — the provider tops up; the platform deducts its slice
per job. Cash flows directly customer → provider; only the commission is digitized.

Tables: `provider_wallets`, `wallet_transactions`, `topup_requests`.
RPC: `get_wallet(p_provider_id)` returns `(wallet_id, balance, total_earned,
total_commission_paid, recent_transactions, pending_topups)`. **All internal
references use `pw.balance` etc. aliased to avoid the RETURNS TABLE column
ambiguity** (PostgreSQL treats those as in-scope variables).

### Visiting fee + commission (NOT a flat completion fee)

The old flat-60-PKR-on-completion commission is **gone**. Current model:

- `calculate_visiting_fee(p_distance_km)` — ≤5 km → **Rs. 500**, ≤10 km →
  **Rs. 1000**, >10 km → **Rs. 1500** (NULL distance → 1500).
- `accept_service_request` computes it from the real accepted distance and stores
  it on `service_requests.visiting_fee`.
- **12% of the visiting fee is deducted on `arrived`**, inside
  `update_request_to_arrived` — not on completion. It's floored at the available
  balance (`LEAST(ROUND(fee * 0.12), balance)`) and writes a `commission` row to
  `wallet_transactions`. `complete_service` charges nothing.

### Going online is gated by an RPC, not the route

`POST /api/provider-status` contains no gating logic — it just calls
`update_provider_online_status(p_user_id, p_online)`. That `SECURITY DEFINER` RPC
requires **both**, and raises a user-facing EXCEPTION for each (the route surfaces
the message verbatim):

1. `ustaz_registrations.verification_status = 'verified'` (CNIC — see `verify-cnic`).
2. `provider_wallets.balance >= 60` — hardcoded in the RPC, mirrored as
   `PROVIDER_MIN_WALLET_BALANCE` in `packages/shared/index.ts`. Keep them in sync.

It also lazily inserts a zero-balance `provider_wallets` row on first call.

### Topups

`src/app/components/WalletPanel.tsx` shows balance + a topup flow (amount +
Raast/JazzCash ref + receipt upload). Receipts go to the `topup-receipts` storage
bucket via `/api/topup/upload-receipt`. Admin approves via
`/api/admin/topup-action`, which credits the balance + writes a ledger entry.

## Provider Onboarding

Two entry points that converge:

1. **Pre-launch (marketing site)** — `/become-a-provider` →
   `ProviderPrelaunchForm` → `POST /api/provider-registration` →
   `provider_prelaunch_registrations`.
2. **Real signup (web app)** — phone OTP → become-ustaz wizard → `ustaz_registrations`.

The `claim_prelaunch_provider_registration()` trigger links the two on signup so
the wizard can prefill. **It matches on digits-only
`raw_user_meta_data->>'phone'`, NOT `auth.users.phone`** — that column is observed
NULL in this project (the phone is set by `verify-otp`'s `admin.createUser` call
in E.164 form). It strips non-digits on both sides and bails if fewer than 9
digits, so junk metadata like `+92` can't mass-claim rows.

`residency` (major neighborhood, e.g. `"Alfalah Society, Malir Halt"`) exists on
**both** tables — add it to both when changing that field.

## Ratings (two-way after completion)

- **There is NO `ratings` table.** Ratings are stored as columns ON
  `service_requests`: `customer_rated` / `customer_rating_value` /
  `customer_rating_comment` and `provider_rated` / `provider_rating_value`.
  The target's aggregate lives on `ustaz_registrations` (`rating_sum`,
  `rating_count`, `rating_avg`) for providers, `profiles` for customers.
- `rate_user(p_request_id, p_rater_id, p_rating, p_comment)` `SECURITY DEFINER`
  RPC — requires `status='completed'`, caller is a party, blocks double-rating
  via the `*_rated` booleans, updates both the tracking columns and the
  aggregate. Returns `(success, message, both_rated)`. It is `rate_user`, **not**
  `rate_service`.
- `get_provider_stats(p_provider_id)` — avg rating, total ratings, completed jobs.
  Rendered as a 3-tile stats card at the top of the dashboard **profile tab**.
- `RatingModal` props: `requestId, raterId, ratedUserId, ratedUserName,
  onComplete, onClose`.
- **Rating push**: after a successful submit, `RatingModal` fires
  `POST /api/chat/notify` to the **rated provider** (`recipientId = ratedUserId`)
  with a `⭐ You received a N/5 star rating` preview — reuses the chat push
  pipeline. The push *title* falls back to the chat sender-name logic (the customer
  isn't in `ustaz_registrations`), only the body carries the rating text.
- `RatingModal` renders on the customer's `/process` page when
  `requestStatus === 'completed'`. The **× / close button is always available**
  (no lockout) — skip / dismiss does NOT mutate DB, purely client-side cleanup.

## Warranty (3-day free re-fix)

If a job breaks again within 3 days of completion, the customer can claim a
free return visit; refusing penalizes the provider.

- **Table `warranty_claims`**: `(request_id UNIQUE, customer_id, provider_id,
  status, description, claimed_at, provider_responded_at, resolved_at)`.
  `status`: `pending → accepted | refused | resolved`. One claim per request.
- **`ustaz_registrations.warranty_strikes`** int column — incremented on refuse.
- **`respond_to_warranty(p_claim_id, p_response)`** `SECURITY DEFINER` RPC —
  on `'refused'`: deducts **Rs. 200** from `provider_wallets` (floored at 0),
  writes a `penalty` row to `wallet_transactions`, increments `warranty_strikes`.
  RLS: customer insert is validated to a `completed` request owned by them within
  3 days; both parties read; provider updates.
- **Routes**: `POST /api/warranty/claim` (customer files; server re-validates the
  3-day window; FCM to provider) and `POST /api/warranty/respond` (provider
  accept/refuse via the RPC; FCM back to customer).
- **Customer UI** = the **`/history` page** ("My Jobs", linked in the header nav
  + user dropdown). Lists past requests via the **`get_customer_history()`**
  `SECURITY DEFINER` RPC (joins provider name + warranty status +
  `customer_rated` in one call, `user_id = auth.uid()`). Each completed job shows
  exact completion date/time, a live 3-day countdown, and a `🛡️ Claim Warranty`
  button (or the existing claim's status). The old floating warranty card on
  `/process` was REMOVED (intrusive, disappeared on dismiss).
- **Provider UI** = a dedicated **Warranty tab** in the dashboard sidebar (amber
  count badge). Claims are fetched enriched (customer name via
  `get_user_display_name`, service type/address/completion time via the embedded
  `service_requests` FK join) with Accept ("I'll Return & Fix It") / Refuse
  buttons.

## Chat (real-time + push)

- **Tables**: `chat_messages (id, sender_id, recipient_id, message, created_at)`
  — append-only. RLS: `chat_party_select` (only the two parties read);
  `chat_send` requires `sender_id = auth.uid()` AND an existing
  `service_requests` row linking sender and recipient where status is active OR
  `completed` within the last **7 days** (follow-up window — matches Uber).
  `UPDATE`/`DELETE` are revoked from `authenticated`/`anon` entirely so chat
  is provably immutable.
- **NO legacy `validate_chat_message_users` trigger** — dropped. It required
  the recipient to exist in `profiles`, but customers never land in `profiles`
  (we don't use that table). RLS already enforces the party-relationship check
  via `service_requests`, so the trigger was redundant AND wrong (broke
  provider → customer messages).
- **NO legacy `Users can send/view/update` RLS policies** — dropped.
  Permissive `using: true` policies OR'd with the strict ones and silently
  defeated them.
- **Realtime**: subscribe to `postgres_changes` INSERT on `chat_messages`
  with NO filter; `postgres_changes` doesn't support `and(or(...))` / compound
  filters and silently drops them. RLS gates which rows the client actually
  receives. Always dedupe by `id` and reconcile optimistic rows by matching
  `_pending` + content (see `ChatComponent.tsx` and the dashboard `chat` tab).
- **Optimistic UI is required.** Both surfaces insert an `id: temp_…` message
  immediately with `_pending: true`, then swap it for the real row when the
  realtime echo lands, or roll it back on RLS / network failure (restoring the draft).
- **Chat push** (`/api/chat/notify`): cookie-auth derives the sender from the
  session, looks up the sender's display name, and fires `sendPush`
  fire-and-forget. Called after every successful `chat_messages` INSERT on both
  sides. Uses the same `send-fcm` pipeline.
- **Unread chat badge** on the provider sidebar mirrors the requests badge:
  a per-provider `unread-chat:{providerId}` channel increments `unreadChatCount`
  on inbound INSERTs that aren't from us and aren't the currently-focused
  conversation; the badge clears the instant the Chat tab opens.
- **Bubble colours (WhatsApp model, both surfaces)**: own/sent = brand orange
  `#db4b0d` white text; received = white bubble dark text. So each party sees
  their own messages orange and the other's white. Timestamps/ticks switch to
  `text-white/70` on the orange bubble.
- **Provider's conversation list** is seeded from recent `service_requests`
  (accepted, or completed/cancelled ≤7 days) so the provider can open a chat
  even before any message exists — NOT only from existing `chat_messages`.
  Customer display names come from **`get_user_display_name(p_user_id)`**
  `SECURITY DEFINER` RPC (reads `auth.users.raw_user_meta_data`:
  `full_name → name → firstName → phone → 'Customer'`), since customers are not
  in `ustaz_registrations` or `profiles`.

## Provider tracking card

`ProviderTrackingInfo` on the customer's `/process` page:
- Status-aware coloured header strip — accepts a `status` prop and maps every
  state in `service_requests.status` to a colour + label + sub-line + icon.
  Pulse-animated "Live" dot when a fresh broadcast ping has arrived.
- ETA + Distance tiles. **Distance < 1 km renders as meters** (`0.42 km` → `420 m`).
- Reverse-geocodes the provider's lat/lng via Google Maps Geocoding API
  (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). Debounced 600 ms, module-level cache keyed
  at ~11 m precision so we don't hammer the API. Falls back to raw coords.

The card stays mounted through **every** active status (`provider_enroute`,
`arriving`, `arrived`, `in_progress`, `work_in_progress`). The `ACTIVE_STATUSES`
constant in `process/page.tsx` is the single source of truth — update it, the
visibility gate, and the map `searchPhase` together when adding states.

## Admin Portal

Separate session-isolated portal at `/admin/*`:
- `/admin/login` → POST `/api/admin/login` (env-based `ADMIN_EMAIL`/`ADMIN_PASSWORD`
  in `.env.local`, server-only).
- `/admin/dashboard` → review pending topups, approve/reject via
  `/api/admin/topup-action`.

Admin routes are gated separately from customer/provider session cookies and
should never run under the public Supabase RLS context.

## Marketing Website (apps/website)

Standalone Next.js 15 landing page, port 3002, deployed on Vercel separately from
the main app. **No booking flow** — it funnels visitors to the app, a waitlist, and
provider pre-registration.

API routes: `/api/waitlist`, `/api/provider-registration`, `/api/stats`.
`src/lib/supabase.ts` is a server-side service-role client;
`.env.local` holds `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_PROVIDER_WHATSAPP_GROUP_URL`.

### Design system

Brand tokens — **use ONLY these**:
`#DB4B0D` primary orange · `#FF6B4A` light (gradients/hover) · `#C24309` dark hover ·
`#0F1729` dark navy (footer, dark sections) · `#FFF7ED` cream (card/hero surfaces).
NO other colors (no blue, green, purple, yellow). Neutral `gray-*` is acceptable
for text/borders only. This applies to every component.

Typography:
- **Headings**: Clash Grotesk — loaded via Fontshare CDN `<link>`, **NOT**
  `next/font`. Applied with an inline `style={{fontFamily: 'Clash Grotesk, sans-serif'}}`
  on every heading. Do NOT use a Tailwind `font-heading` class.
- **Body EN**: Atkinson Hyperlegible (local TTF via `next/font/local`).
  **Body UR**: Gulzar. **Body AR**: IBM Plex Sans Arabic.
- **Display/counter numbers**: Anton (local TTF).

### Website gotchas

- `waitlist` table: `id` uuid PK, `name` NOT NULL, `email` UNIQUE, `source`,
  `created_at`. RLS allows anonymous INSERT (public signup), authenticated SELECT
  only. The UNIQUE email prevents duplicate signups.
- StaggeredMenu (React Bits) needs `isFixed={true}` for proper mobile layout.
- SVG arrows were replaced with lucide-react icons across all components.
- DownloadCTA is a "Coming Soon" CTA — the app has not launched.
- `requireCommit: true` in `eas.json` means the working tree must be clean before
  EAS builds; the website Vercel deploy picks up from git push.

## Legal pages

Three standalone, server-rendered pages under
`apps/web/src/app/{terms,privacy-policy,cookie-policy}/page.tsx`. Each shares the
same structure: hero with `Last updated` + `ReadingTime`, numbered grid ToC,
`<article>` body with `text-2xl font-extrabold mt-6` headings whose `id` matches
the ToC entry. **Cookie Policy** lists the actual cookies we set
(`sb-{ref}-auth-token`, `NEXT_LOCALE`, `firebase-messaging-sw.js`, etc.) and is
explicit about NOT using advertising / cross-site trackers. Footer links to all
three from the Legal column. When adding a section, update the `sections` const +
the heading `id` + the anchor link together — they MUST stay aligned.

## Testing Gotchas (don't skip)

- **Cookie collision / self-requests**: customer + provider in the same Chrome
  profile share cookies → server routes see the wrong `auth.uid()`. Symptom in
  data: `service_requests.user_id == accepted_by_provider_id` (a provider both
  created and accepted a request). These self-requests corrupt test flows and
  leave the provider stuck `busy`. Test with two profiles (one regular, one
  Incognito) where the customer signs in with a phone number that is **NOT**
  registered as a provider.
- **Request tab vs popup (two surfaces)**: incoming requests appear in BOTH the
  `ProviderRequestNotification` floating popup (driven by the `notifications`
  table realtime) AND the dashboard request tab (`serviceRequests`, driven by a
  no-filter `service_requests` realtime sub + `fetchServiceRequests`). The
  no-filter sub can MISS the first INSERT, so the popup fires but the tab stays
  empty. Mitigation: the dashboard re-fetches `serviceRequests` on every
  `notifications` INSERT for this provider, plus an 8 s reconcile poll.
  `fetchServiceRequests` filters to `ACTIVE_REQUEST_STATUSES` only
  (`notified_multiple → work_in_progress`) so finished jobs don't linger.
- **Provider geolocation**: `ProviderLocationTracker` needs browser location
  permission. On localhost it works; on a non-localhost HTTP origin it silently
  fails (HTTPS required). Client geolocation code should check
  `window.isSecureContext` and degrade gracefully rather than hang.
- **Broadcast race**: the customer must subscribe before the provider's first ping
  or that ping is dropped (broadcast has no replay). The 5 s `live_locations` poll
  on the customer side is the safety net.
- **postgres_changes filter ops**: only `eq, neq, lt, lte, gt, gte, in`.
  Array `cs` (contains) is silently dropped — filter client-side instead.
- **Windows `.next/cache` rename race**: `next-pwa` + Webpack on Windows can throw
  `Cannot read properties of undefined (reading 'length')` after several
  incremental builds. Fix: `rm -rf .next` before `npm run build`. Vercel is
  unaffected (fresh build per deploy).
- **FCM service account is the keys-to-the-kingdom**: never paste it in chat, IDE
  selections, or anywhere except the Supabase secret store. If exposed, delete in
  Firebase IAM → generate new → update secret. Web config + VAPID public key are
  not secrets and may live in `.env.local`.

## E2E Tests

Playwright suite in `apps/web/e2e/` (`apps/web/playwright.config.ts`), with a
written `e2e/TEST-PLAN.md`. Specs: `tier0`, `customer-booking`,
`provider-acceptance`, `dispatch-integrity`, `state-machine`, `cancellation`,
`rating`, `warranty-flow`, `chat-flow`, `wallet-topup`, `admin-portal`,
`refresh-resilience`, `mobile-customer`, `mobile-provider`. Helpers in
`e2e/helpers/{auth,db}.ts`.

- **The suite MUST stay serial** — `workers: 1` and `fullyParallel: false`,
  because the tests mutate shared database state. Don't "optimize" this.
- `webServer` auto-starts `npm run dev` on :3000 (`reuseExistingServer` outside CI),
  so you don't need a dev server already running.
- Config loads `.env.local` via dotenv for helper credentials
  (`SUPABASE_SERVICE_ROLE_KEY`).

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

- `book.tsx` was split into `find.tsx` (service selection, address, map) +
  `process.tsx` (tracking, status, rating). Both are root-level Stack screens.
- Provider `index.tsx` is pending a split into `index.tsx` + `requests.tsx`.
- `CustomTabBar.tsx` computes the floating pill position from actual tab bar
  dimensions (`barContentWidth`, `tabCenter`, `targetX`).
- Swipe gesture between tabs is NOT implemented (planned).
- Shared chat component extraction from `(customer)/chat.tsx` and
  `(provider)/chat.tsx` is NOT done.

### Key files

- `app/process.tsx` — tracking screen; optional params with DB fallback, realtime sub
- `app/(customer)/find.tsx` — service selection, Google Places, map, existing-request recovery
- `app/auth.tsx` — phone OTP with segmented `OtpInput` (auto-submit, 60 s countdown, paste), Google OAuth, email sign-in
- `src/components/MapComponents.native.tsx` / `.web.tsx` — real react-native-maps with ErrorBoundary / web stub
- `src/hooks/useServiceTimer.ts` — timer hook with NaN guard
- `src/lib/ustaz-api.ts` — `sendPhoneOtp()`, `verifyPhoneOtp()`, `setProviderOnlineStatus()`

### Build requirements & gotchas

- `EAS_SKIP_AUTO_FINGERPRINT=1` required (avoids `expo-dev-launcher` ENOENT).
- `.env.local` must be listed in the `eas.json` preview profile `env` field (gitignored).
- `android/` must be committed for EAS builds.
- `metro.config.cjs` uses `moduleSuffixes: [".web", ""]` for the web platform split.
- `react-native-maps` has no Expo config plugin — the API key goes in
  `AndroidManifest.xml` manually.
- `expo-notifications` must be lazy-imported (dynamic `import()`) guarded by
  `Constants.appOwnership === 'expo'` to prevent an Expo Go crash on SDK 53+.
- **Node.js 22 on Windows** has an ESM import bug with drive-letter paths (`E:\...`).
  Use Node 20 at `C:\node20\node-v20.19.0-win-x64`.
- **Supabase email confirmation** must be disabled for development
  (Dashboard → Auth → Providers → Email → uncheck "Confirm email").
- **Google user metadata** lives in `user.user_metadata`: `full_name`, `name`,
  `email`, `avatar_url`, `picture`.
- **KeyboardAvoidingView on Android** needs `behavior='height'` (not `undefined`).

## Video Generation (ustaz-visuals)

Remotion project in `ustaz-visuals/` for marketing/demo videos.
`cd ustaz-visuals && npm run dev` to preview. Not part of the runtime app —
touch only when working on the marketing surface.
