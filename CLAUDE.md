# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an npm workspaces monorepo for "Ustaz", a Pakistani home-services marketplace. The production web app lives in `apps/web`; it lets users request services, find nearby providers, and track service requests in real time.

## Architecture

Monorepo layout: `apps/web` is the Next.js 15 (App Router, Turbopack) frontend, `apps/mobile` is the Expo React Native app, `apps/website` is the standalone marketing landing page, and `packages/shared` holds cross-platform theme tokens, shared types, and utilities. Supabase remains the backend.

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
- **Mobile target**: Expo React Native in `apps/mobile`; no Capacitor setup remains.
  Mobile reuses the same Supabase JWT, RPCs, Realtime channels, and FCM token table with platform-appropriate secure storage.

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

## Development Commands

```bash
npm run dev:web       # Next.js Turbopack dev server from apps/web on :3000
npm run build:web     # production web build
npm run dev:mobile    # Expo dev server from apps/mobile
npm run build:mobile  # Expo export/build script
```

## Marketing Website (apps/website)

Standalone Next.js 15 landing page at `apps/website`. Runs on port 3002
(`next dev --turbopack -p 3002`). Deployed on Vercel separately from the
main app. NO booking functionality — funnels visitors to Play Store/App Store.

### Website Design System

Brand-matched design tokens:
- **Primary orange**: `#DB4B0D` (buttons, links, accents)
- **Primary light**: `#FF6B4A` (gradients, hover states)
- **Primary dark hover**: `#C24309` (button hover)
- **Dark navy**: `#0F1729` (footer, hero CTA, dark sections)
- **Cream**: `#FFF7ED` (card backgrounds, hero surfaces)

Typography:
- **Headings**: Clash Grotesk (Fontshare CDN, applied via inline `style={{fontFamily: 'Clash Grotesk, sans-serif'}}`)
- **Body EN**: Atkinson Hyperlegible (local TTF via `next/font/local`)
- **Body UR**: Gulzar (Google Font), Body AR: IBM Plex Sans Arabic
- **Display/Counter numbers**: Anton (local TTF)

### Website Key Files

- `apps/website/src/app/page.tsx` — Homepage composition (all sections)
- `apps/website/src/components/Header.tsx` — Desktop header + StaggeredMenu
- `apps/website/src/components/Hero.tsx` — Bento hero with cards
- `apps/website/src/components/Services.tsx` — Bento grid services
- `apps/website/src/components/HowItWorks.tsx` — Step-by-step flow
- `apps/website/src/components/AppScreenshots.tsx` — 3D phone mockup
- `apps/website/src/components/TrustBar.tsx` — Real-time stats (Anton numbers)
- `apps/website/src/components/Testimonials.tsx` — Customer reviews
- `apps/website/src/components/DownloadCTA.tsx` — "Coming Soon on Play Store"
- `apps/website/src/components/FAQ.tsx` — Accordion FAQ
- `apps/website/src/components/Footer.tsx` — 5-column footer
- `apps/website/src/components/WaitlistSection.tsx` — Waitlist signup form
- `apps/website/src/app/api/waitlist/route.ts` — Waitlist submission API
- `apps/website/src/lib/supabase.ts` — Server-side Supabase client (service role)
- `apps/website/.env.local` — SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

### Website Gotchas

- `requireCommit: true` in eas.json means the working tree must be clean
  before EAS builds — the website Vercel deploy picks up from git push.
- StaggeredMenu (React Bits) needs `isFixed={true}` for proper mobile layout.
- Clash Grotesk is loaded via CDN `<link>`, NOT `next/font` — applied via
  inline `style` prop on every heading. Do NOT use Tailwind `font-heading`.
- SVG arrows replaced with lucide-react icons across all components.
- DownloadCTA uses "Coming Soon" CTA — app not launched yet.

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

### Waitlist Table

`waitlist` table stores pre-launch customer signups from the marketing website:
- `id` uuid PK, `name` text NOT NULL, `email` text UNIQUE, `source` text,
  `created_at` timestamptz default now()
- RLS: allow anonymous INSERT (public signup), authenticated SELECT only
- Unique constraint on `(email)` to prevent duplicate signups
- API route: `apps/website/src/app/api/waitlist/route.ts` (POST, rate-limited)
- Component: `apps/website/src/components/WaitlistSection.tsx`

## Key Directories

- `apps/web/src/app/` — Next.js App Router pages and layouts.
- `apps/web/src/app/components/` — Reusable UI components for the main application.
- `apps/web/src/components/ui/` — Shadcn UI components.
- `apps/web/src/app/context/` — React Context providers.
- `apps/web/src/app/api/` — API routes.
- `apps/web/src/hooks/` — Custom React hooks.
- `apps/web/src/lib/` — Utility functions and validations.
- `apps/web/src/actions/` — Server actions.
- `client/supabaseClient.ts` — **lives outside `src/`**.
- `apps/web/client/supabaseClient.ts` — **lives outside `apps/web/src/`**.
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

- **There is NO `ratings` table.** Ratings are stored as columns ON
  `service_requests`: `customer_rated` / `customer_rating_value` /
  `customer_rating_comment` and `provider_rated` / `provider_rating_value`.
  The target's aggregate lives on `ustaz_registrations` (`rating_sum`,
  `rating_count`, `rating_avg`) for providers, `profiles` for customers.
- `rate_user(p_request_id, p_rater_id, p_rating, p_comment)` `SECURITY DEFINER`
  RPC — requires `status='completed'`, caller is a party, blocks double-rating
  via the `*_rated` booleans, updates both the tracking columns and the
  aggregate. Returns `(success, message, both_rated)`.
- `get_provider_stats(p_provider_id)` — avg rating, total ratings, completed jobs.
  Rendered as a 3-tile stats card at the top of the dashboard **profile tab**
  (Avg Rating / Reviews / Jobs Done).
- The actual submit RPC the client calls is **`rate_user(p_request_id,
  p_rater_id, p_rating, p_comment)`** (not `rate_service`). `RatingModal` props:
  `requestId, raterId, ratedUserId, ratedUserName, onComplete, onClose`.
- **Rating push**: after a successful submit, `RatingModal` fires
  `POST /api/chat/notify` to the **rated provider** (`recipientId = ratedUserId`)
  with a `⭐ You received a N/5 star rating` preview — reuses the chat push
  pipeline. The push *title* falls back to the chat sender-name logic (customer
  isn't in `ustaz_registrations`), only the body carries the rating text.
- `RatingModal` is rendered on the customer's `/process` page when
  `requestStatus === 'completed'`. The **× / close button is always available**
  (no lockout) — skip / dismiss does NOT mutate DB, purely client-side cleanup.
  Title has NO star icon (kept clean).

## Warranty (3-day free re-fix)

If a job breaks again within 3 days of completion, the customer can claim a
free return visit; refusing penalizes the provider.

- **Table `warranty_claims`**: `(request_id UNIQUE, customer_id, provider_id,
  status, description, claimed_at, provider_responded_at, resolved_at)`.
  `status`: `pending → accepted | refused | resolved`. One claim per request.
- **`ustaz_registrations.warranty_strikes`** int column — incremented on refuse.
- **`respond_to_warranty(p_claim_id, p_response)`** `SECURITY DEFINER` RPC —
  on `'refused'`: deducts **Rs. 200** from `provider_wallets` (floored at 0),
  writes a `penalty` row to `wallet_transactions`, increments
  `warranty_strikes`. RLS: customer insert is validated to a `completed` request
  owned by them within 3 days; both parties read; provider updates.
- **Routes**: `POST /api/warranty/claim` (customer files; server re-validates the
  3-day window; FCM to provider) and `POST /api/warranty/respond` (provider
  accept/refuse via the RPC; FCM back to customer).
- **Customer UI** = the **`/history` page** ("My Jobs", linked in the header nav
  + user dropdown). Lists past requests via the
  **`get_customer_history()`** `SECURITY DEFINER` RPC (joins provider name +
  warranty status + `customer_rated` in one call, `user_id = auth.uid()`). Each
  completed job shows exact completion date/time, a live 3-day countdown, and a
  `🛡️ Claim Warranty` button (or the existing claim's status). The old floating
  warranty card on `/process` was REMOVED (intrusive, disappeared on dismiss).
- **Provider UI** = a dedicated **Warranty tab** in the dashboard sidebar (amber
  count badge). Claims are fetched enriched (customer name via
  `get_user_display_name`, service type/address/completion time via the embedded
  `service_requests` FK join) with Accept ("I'll Return & Fix It") / Refuse
  buttons. Provider is alerted by the FCM push from `/api/warranty/claim`.

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
- **Bubble colours (WhatsApp model, both surfaces)**: own/sent messages =
  brand orange `#db4b0d` white text; received = white bubble dark text. So each
  party sees their own messages orange and the other's white. Timestamps/ticks
  switch to `text-white/70` on the orange bubble.
- **Provider's conversation list** is seeded from recent `service_requests`
  (accepted, or completed/cancelled ≤7 days) so the provider can open a chat
  even before any message exists — NOT only from existing `chat_messages`.
  Customer display names come from the **`get_user_display_name(p_user_id)`**
  `SECURITY DEFINER` RPC (reads `auth.users.raw_user_meta_data`:
  `full_name → name → firstName → phone → 'Customer'`), since customers are not
  in `ustaz_registrations` or `profiles`.

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
  no-filter `service_requests` sub can MISS the first INSERT, so the popup fires
  but the tab stays empty. Mitigation: the dashboard also re-fetches
  `serviceRequests` on every `notifications` INSERT for this provider, plus an
  8 s reconcile poll. `fetchServiceRequests` filters to `ACTIVE_REQUEST_STATUSES`
  only (`notified_multiple → work_in_progress`) so finished jobs don't linger.
- **`find_providers_nearby` filters on `online_status` only** — NOT
  `provider_status`. A `busy` provider is still notified of new requests. Matching
  also requires `service_type` match + `location` within radius (PostGIS
  `ST_DWithin`); if a provider has no `location` or is offline they're skipped and
  the request goes `no_ustaz_found`. `provider_status` flips `available → busy`
  on accept and back on complete/cancel — a stuck `accepted` request keeps them
  `busy` forever.
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

Playwright suite in `apps/web/e2e/` (`apps/web/playwright.config.ts`): `cancellation`,
`rating`, `refresh-resilience`, `state-machine`. Helpers in
`apps/web/e2e/helpers/{auth,db}.ts`. Run with `npx playwright test` against a running
dev server. Useful for end-to-end smoke before deploy — covers the
arrival → in_progress → completed → rating loop and refresh-state recovery.

## Mobile (Expo)

The native mobile app lives in `apps/mobile` and uses Expo React Native. Capacitor has been removed entirely. Mobile should import brand tokens/types/utilities from `packages/shared`, call the same Supabase Edge Functions and `SECURITY DEFINER` RPCs as web, and register push tokens into the existing `fcm_tokens` table. Web keeps cookie-backed Supabase sessions; mobile may use platform-appropriate secure storage for the same Supabase JWT. Do **not** invent mobile-specific RPCs or auth flows.

### Mobile Navigation (partially refactored)

**Customer tabs** (5): Home | Find | Jobs | Chat | Profile
**Provider tabs** (5): Home | Requests | Wallet | Chat | Profile

- `book.tsx` was split into `find.tsx` (service selection, address, map) + `process.tsx` (tracking, status, rating). Both are root-level Stack screens.
- Provider `index.tsx` is pending split into `index.tsx` (dashboard) + `requests.tsx`.
- `CustomTabBar.tsx` handles bottom tab bar with floating pill indicator. Pill position is computed from actual tab bar dimensions.
- Swipe gesture between tabs is NOT yet implemented (planned).
- Shared chat component extraction from `(customer)/chat.tsx` and `(provider)/chat.tsx` is NOT yet done.

### Mobile Key Files

- `app/process.tsx` — process/tracking screen, accepts optional params with DB fallback, realtime subscription
- `app/(customer)/find.tsx` — service selection, Google Places, map, existing-request recovery
- `app/auth.tsx` — phone OTP with segmented `OtpInput` (auto-submit, 60s countdown, paste support), Google OAuth, email sign-in
- `src/components/OtpInput.tsx` — segmented 6-digit OTP input
- `src/components/CustomTabBar.tsx` — bottom tab bar with floating pill
- `src/components/MapComponents.native.tsx` — real react-native-maps with ErrorBoundary
- `src/components/MapComponents.web.tsx` — stub for web
- `src/hooks/useServiceTimer.ts` — timer hook with NaN guard
- `src/lib/ustaz-api.ts` — `sendPhoneOtp()`, `verifyPhoneOtp()`, `setProviderOnlineStatus()`

### Mobile Build Requirements

- `EAS_SKIP_AUTO_FINGERPRINT=1` env var required (avoids `expo-dev-launcher` ENOENT)
- `.env.local` must be in `eas.json` preview profile `env` field (gitignored)
- `android/` directory must be committed for EAS builds
- `metro.config.cjs` uses `moduleSuffixes: [".web", ""]` for web platform split
- `react-native-maps` does NOT have an Expo config plugin — API key goes in `AndroidManifest.xml` manually
- `expo-notifications` must be lazy-imported (dynamic `import()`) guarded by `Constants.appOwnership === 'expo'` to prevent Expo Go crash in SDK 53+

### Mobile Gotchas

- **Node.js 22 on Windows** has ESM import bug with drive-letter paths (`E:\...`). Use Node 20 at `C:\node20\node-v20.19.0-win-x64`.
- **Supabase email confirmation** must be disabled for development (Dashboard → Auth → Providers → Email → uncheck "Confirm email").
- **Google user metadata** lives in `user.user_metadata` — fields: `full_name`, `name`, `email`, `avatar_url`, `picture`.
- **KeyboardAvoidingView on Android** needs `behavior='height'` (not `undefined`).
- **Bottom tab bar centering** — pill position computed from `barContentWidth`, `tabCenter`, `targetX` with corrected math.
- **Twilio OTP** — Pakistan geo-permission must be enabled in Twilio Console → Verify Service → Geo Permissions. Trial accounts can only send to verified caller IDs.
- **`send-otp` Edge Function v8** — returns friendly error messages for 400/401/429/502 status codes.

## Video Generation (ustaz-visuals)

Remotion project in `ustaz-visuals/` for marketing/demo videos.
`cd ustaz-visuals && npm run dev` to preview. Not part of the runtime app —
touch only when working on the marketing surface.
