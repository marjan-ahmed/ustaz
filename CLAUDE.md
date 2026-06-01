# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application called "Ustaz" that connects users with home service providers (electricians, plumbers, carpenters) in Pakistan. The app allows users to request services, find nearby providers, and track their service requests in real-time.

## Architecture

Next.js 15 (App Router, Turbopack) frontend, Supabase backend.

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
- **i18n**: next-intl (EN/UR/AR with RTL).
- **Twilio Verify**: SMS provider for OTP, called from Edge Functions only.
- **Mobile target**: Capacitor (`capacitor.config.ts`) — re-uses same Supabase
  JWT, RPCs, and Realtime channels; no auth re-implementation needed.

### Key Components
- **ServiceContext**: Manages service request state (address, service type, coordinates).
- **API Routes (`src/app/api/`)**: ALL routes use `createServerClient` from
  `@supabase/ssr` and derive `user.id` from `auth.getUser()` — never trust
  `userId` or `providerId` from the request body.
- **`ProviderLocationTracker`**: Always-mounted at top of dashboard `<main>`;
  uses `watchPosition` + broadcasts on `location-update:{requestId}` and
  persists every ping to `live_locations` (upsert on `request_id`).
- **`useProviderLocation` / customer `/process` page**: subscribes to broadcast
  + polls `live_locations` every 5 s as race-condition safety net.

## Critical Invariants — Do Not Violate

1. **Browser session storage is cookies, NOT localStorage.**
   `client/supabaseClient.ts` MUST use `createBrowserClient` from `@supabase/ssr`.
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

## Development Commands

```bash
npm run dev           # Turbopack dev server on :3000
npm run build         # production build
npm run start         # serve the build
npm run lint          # eslint
```

## Supabase

Project ref: `solrsmnkxklsqklqhgxf`.

Prefer the **Supabase MCP** for schema/data changes — `mcp__supabase__apply_migration`,
`mcp__supabase__execute_sql`, `mcp__supabase__deploy_edge_function`,
`mcp__supabase__get_logs`. Don't print SQL for the user to paste.

### Edge Functions (deployed; verify_jwt=false)
- `send-otp` — Twilio Verify send + DB rate limit (`otp_attempts` table).
- `verify-otp` — Twilio Verify check → upsert auth user with synthesized email
  `<digits>@phone.ustaz.local` → `admin.generateLink({ type:'magiclink' })` →
  client exchanges `token_hash` via `supabase.auth.verifyOtp` to set the cookie.
- `send-fcm` — FCM HTTP v1 send. Server-to-server only; guarded by
  `x-internal-secret` header. Mints OAuth2 access token from service account,
  looks up `fcm_tokens` for the recipient `userIds`, sends, auto-prunes
  `UNREGISTERED` / `NOT_FOUND` tokens. Called by Next.js routes via
  `src/lib/sendPush.ts` after request creation and accept.

### Required Edge Function secrets
- OTP: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SID`, `PHONE_PEPPER`
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

## Key Directories

- `src/app/` — Next.js App Router pages and layouts.
- `src/app/components/` — Reusable UI components for the main application.
- `src/components/ui/` — Shadcn UI components.
- `src/app/context/` — React Context providers.
- `src/app/api/` — API routes.
- `src/hooks/` — Custom React hooks.
- `src/lib/` — Utility functions and validations.
- `src/actions/` — Server actions.
- `client/supabaseClient.ts` — **lives outside `src/`**.
  Import as `'../../../client/supabaseClient'` (no path alias).
- `supabase/functions/` — Edge Function source mirrors (deploy via MCP).
- `supabase/migrations/` — DDL history. Always use `apply_migration`, not raw SQL.

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

## Ratings (two-way after completion)

- `ratings` table: `(request_id, rater_id, rated_user_id, rating, comment)` with
  `UNIQUE(request_id, rater_id)` — one rating per party per request.
- `rate_service(p_request_id, p_rater_id, p_rated_user_id, p_rating, p_comment)`
  RPC — `SECURITY DEFINER`; requires `status='completed'` and caller is a party.
  ON CONFLICT does an UPDATE so re-rating is allowed.
- `get_provider_stats(p_provider_id)` — avg rating, total ratings, completed jobs.
- `RatingModal` is rendered on the customer's `/process` page when
  `requestStatus === 'completed'` and on the provider's dashboard via
  `existingRatings` guard. **Skip / dismiss does NOT mutate DB** — purely
  client-side state cleanup.

## Wallet / Escrow / Commission

Prepaid wallet model — provider tops up; platform deducts commission per
completed job. Cash flows directly customer → provider; only the commission
slice is digitized.

Tables: `provider_wallets`, `wallet_transactions`, `topup_requests`.
RPC: `get_wallet(p_provider_id)` returns `(wallet_id, balance, total_earned,
total_commission_paid, recent_transactions, pending_topups)`. **All
internal references use `pw.balance` etc. aliased to avoid the RETURNS TABLE
column ambiguity** (PostgreSQL treats those as in-scope variables).

UI: `src/app/components/WalletPanel.tsx` shows balance + a topup flow
(amount + Raast/JazzCash ref + receipt upload). Receipts go to the
`topup-receipts` storage bucket via `/api/topup/upload-receipt`. Admin
approves via `/api/admin/topup-action` which credits the balance + writes
a ledger entry.

`provider-status` POST checks wallet ≥ `min_wallet_to_work` before letting
the provider go online — so a 0-balance provider cannot accept jobs.

## Admin Portal

Separate session-isolated portal at `/admin/*`:
- `/admin/login` → POST `/api/admin/login` (env-based `ADMIN_EMAIL`/`ADMIN_PASSWORD`
  in `.env.local`, server-only).
- `/admin/dashboard` → review pending topups, approve/reject via
  `/api/admin/topup-action`.

Admin routes are gated separately from customer/provider session cookies and
should never run under the public Supabase RLS context.

## Legal pages

Three standalone, server-rendered pages under `src/app/{terms,privacy-policy,cookie-policy}/page.tsx`.
Each one shares the same structure: hero with `Last updated` + `ReadingTime`,
numbered grid ToC, `<article>` body with `text-2xl font-extrabold mt-6`
headings whose `id` matches the ToC entry. **Cookie Policy** lists the actual
cookies we set (`sb-{ref}-auth-token`, `NEXT_LOCALE`, `firebase-messaging-sw.js`,
etc.) and is explicit about NOT using advertising / cross-site trackers. Footer
links to all three from the Legal column. When adding a new section, update the
`sections` const + the heading `id` + the anchor link together — they MUST stay
aligned for the ToC to navigate correctly.

## Chat (real-time + push)

- **Tables**: `chat_messages (id, sender_id, recipient_id, message, created_at)`
  — append-only. RLS: `chat_party_select` (only the two parties read);
  `chat_send` requires `sender_id = auth.uid()` AND an existing
  `service_requests` row linking sender and recipient where status is active OR
  `completed` within the last **7 days** (follow-up window — matches Uber).
  `UPDATE`/`DELETE` are revoked from `authenticated`/`anon` entirely so chat
  is provably immutable.
- **NO legacy `validate_chat_message_users` trigger** — dropped. It required
  the recipient to exist in `profiles`, but customers never land in
  `profiles` (we don't use that table). RLS already enforces the
  party-relationship check via `service_requests`, so the trigger was
  redundant AND wrong (broke provider → customer messages).
- **NO legacy `Users can send/view/update` RLS policies** — dropped.
  Permissive `using: true` policies OR'd with the strict ones and silently
  defeated them.
- **Realtime**: subscribe to `postgres_changes` INSERT on `chat_messages`
  with NO filter; `postgres_changes` doesn't support `and(or(...))` /
  compound filters and silently drops them. RLS gates which rows the
  client actually receives. Always dedupe by `id` and reconcile optimistic
  rows by matching `_pending` + content (see `ChatComponent.tsx` and the
  dashboard `chat` tab).
- **Optimistic UI is required.** Both surfaces insert an `id: temp_…`
  message immediately with `_pending: true`, then swap it for the real row
  when the realtime echo lands, or roll it back on RLS / network failure
  (restoring the draft).
- **Chat push** (`/api/chat/notify`): cookie-auth derives the sender from
  the session, looks up the sender's display name, and fires `sendPush`
  fire-and-forget. Called after every successful `chat_messages` INSERT on
  both customer and provider sides. Uses the same `send-fcm` Edge Function
  pipeline.
- **Unread chat badge** on the provider sidebar mirrors the requests badge:
  a per-provider `unread-chat:{providerId}` channel increments
  `unreadChatCount` on inbound INSERTs that aren't from us and aren't the
  currently-focused conversation; the badge clears the instant the Chat
  tab opens.

## Provider tracking card

`ProviderTrackingInfo` on the customer's `/process` page:
- Status-aware coloured header strip — accepts a `status` prop and maps
  every state in `service_requests.status` to a colour + label + sub-line +
  icon. Pulse-animated "Live" dot when a fresh broadcast ping has arrived.
- ETA + Distance tiles. **Distance < 1 km renders as meters** (e.g.
  `0.42 km` → `420 m`).
- Reverse-geocodes the provider's lat/lng via Google Maps Geocoding API
  (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). Debounced 600 ms, module-level
  cache keyed at ~11 m precision so we don't hammer the API. Falls back
  to raw coords on failure.

The card stays mounted through **every** active status (`provider_enroute`,
`arriving`, `arrived`, `in_progress`, `work_in_progress`). The
`ACTIVE_STATUSES` constant in `process/page.tsx` is the single source of
truth — update it, the visibility gate, and the map `searchPhase` together
when adding states.

## Testing Gotchas (don't skip)

- **Cookie collision**: customer + provider in the same Chrome profile share
  cookies → server routes see the wrong `auth.uid()`. Test with two profiles
  (one regular, one Incognito).
- **Provider geolocation**: `ProviderLocationTracker` needs browser location
  permission. On localhost it works; on a non-localhost HTTP origin it silently
  fails (HTTPS required).
- **Broadcast race**: customer must subscribe before provider's first ping or
  that ping is dropped (broadcast has no replay). The 5 s `live_locations`
  poll on the customer side is the safety net.
- **postgres_changes filter ops**: only `eq, neq, lt, lte, gt, gte, in`.
  Array `cs` (contains) is silently dropped — filter client-side instead.
- **Windows `.next/cache` rename race**: `next-pwa` + Webpack on Windows can
  throw `Cannot read properties of undefined (reading 'length')` after several
  incremental builds. Fix: `rm -rf .next` before `npm run build`. Vercel is
  unaffected (fresh build per deploy).
- **FCM service account is the keys-to-the-kingdom**: never paste it in chat,
  IDE selections, or anywhere except the Supabase secret store. If exposed,
  delete in Firebase IAM → generate new → update secret. Web config + VAPID
  public key are not secrets and may live in `.env.local`.

## E2E Tests

Playwright suite in `e2e/` (`playwright.config.ts` at root): `cancellation`,
`rating`, `refresh-resilience`, `state-machine`. Helpers in
`e2e/helpers/{auth,db}.ts`. Run with `npx playwright test` against a running
dev server. Useful for end-to-end smoke before deploy — covers the
arrival → in_progress → completed → rating loop and refresh-state recovery.

## Mobile (Capacitor) — upcoming

`capacitor.config.ts` is the seed for the Android shell. The web app is
designed so the mobile port reuses everything:
- Same Supabase JWT (cookies on web, `localStorage` on mobile is acceptable).
- Same `SECURITY DEFINER` RPCs over PostgREST.
- Same Realtime channel names (`location-update:{requestId}`, `chat:{requestId}`, …).
- FCM tokens registered through the same `fcm_tokens` table; the native FCM
  SDK provides the token, the rest of the pipeline is identical.

Do **not** invent mobile-specific RPCs or auth flows — if it doesn't work on
web first, it shouldn't ship to mobile.

## Video Generation (ustaz-visuals)

Remotion project in `ustaz-visuals/` for marketing/demo videos.
`cd ustaz-visuals && npm run dev` to preview. Not part of the runtime app —
touch only when working on the marketing surface.
