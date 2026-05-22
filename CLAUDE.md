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
- **Maps**: Google Maps via `@react-google-maps/api`.
- **i18n**: next-intl (EN/UR/AR with RTL).
- **Twilio Verify**: SMS provider for OTP, called from Edge Functions only.

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

### Required Edge Function secrets
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SID`, `PHONE_PEPPER`.
Set via Dashboard → Edge Functions → Secrets.

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

Transitions are enforced by RPCs (`accept_service_request_authed`,
`update_request_to_arriving`, etc.). Adding a status? Update the RPC + the
dashboard render conditions + the customer `RequestStatus` union.

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

## Video Generation (ustaz-visuals)

Remotion project in `ustaz-visuals/` for marketing/demo videos.
`cd ustaz-visuals && npm run dev` to preview. Not part of the runtime app —
touch only when working on the marketing surface.
