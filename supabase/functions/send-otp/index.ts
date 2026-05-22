// Twilio Verify OTP dispatch with phone + IP rate limiting.
// Required env:
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID
//   PHONE_PEPPER                         (random server secret)
// Optional env (Upstash; falls back to a DB table `otp_attempts` if absent):
//   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
// DB fallback table:
//   create table public.otp_attempts (
//     id          bigserial primary key,
//     phone_hash  text not null,
//     ip          text,
//     created_at  timestamptz default now()
//   );
//   create index otp_attempts_phone_hash_idx on public.otp_attempts (phone_hash, created_at desc);
//   create index otp_attempts_ip_idx         on public.otp_attempts (ip, created_at desc);
//   alter table public.otp_attempts enable row level security;  -- no policies = only service_role
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

interface PhoneRequestBody {
  phone?: string;
}

type RateLimitReason = 'phone' | 'ip';

interface HitDbResult {
  ok: boolean;
  reason?: RateLimitReason;
}

interface UpstashResponse {
  result: number | string;
}

interface CorsHeaders {
  [header: string]: string;
}

const PHONE_LIMIT = 3;
const IP_LIMIT = 10;
const WINDOW_MS = 15 * 60_000;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const E164 = /^\+[1-9]\d{7,14}$/;

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });
}

const upstashUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
const upstashToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
const useUpstash = !!(upstashUrl && upstashToken);

async function upstash(cmd: (string | number)[]) {
  const res = await fetch(`${upstashUrl}/${cmd.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${upstashToken}` },
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return res.json() as Promise<{ result: number | string }>;
}

async function hitUpstash(key: string, limit: number): Promise<boolean> {
  const { result: count } = await upstash(['INCR', key]);
  if (Number(count) === 1) await upstash(['PEXPIRE', key, WINDOW_MS]);
  return Number(count) <= limit;
}

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

async function hitDb(phoneHash: string, ip: string): Promise<{ ok: boolean; reason?: string }> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { count: phoneCount, error: pErr } = await admin
    .from('otp_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('phone_hash', phoneHash)
    .gte('created_at', since);
  if (pErr) throw pErr;
  if ((phoneCount ?? 0) >= PHONE_LIMIT) return { ok: false, reason: 'phone' };

  const { count: ipCount, error: iErr } = await admin
    .from('otp_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', since);
  if (iErr) throw iErr;
  if ((ipCount ?? 0) >= IP_LIMIT) return { ok: false, reason: 'ip' };

  const { error: insErr } = await admin
    .from('otp_attempts')
    .insert({ phone_hash: phoneHash, ip });
  if (insErr) throw insErr;
  return { ok: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid json' });
  }

  const phone = (body.phone ?? '').trim();
  if (!E164.test(phone)) return json(400, { error: 'phone must be E.164, e.g. +9230XXXXXXXX' });

  const pepper = Deno.env.get('PHONE_PEPPER');
  if (!pepper) return json(500, { error: 'server misconfigured' });

  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';

  const phoneHash = await sha256(phone + pepper);

  try {
    if (useUpstash) {
      const okPhone = await hitUpstash(`otp:phone:${phoneHash}`, PHONE_LIMIT);
      if (!okPhone) return json(429, { error: 'too many requests for this phone' });
      const okIp = await hitUpstash(`otp:ip:${ip}`, IP_LIMIT);
      if (!okIp) return json(429, { error: 'too many requests from this network' });
    } else {
      const r = await hitDb(phoneHash, ip);
      if (!r.ok) return json(429, { error: `too many requests (${r.reason})` });
    }
  } catch (e) {
    console.error('rate-limit failure', e);
    return json(500, { error: 'rate-limit check failed' });
  }

  const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  const vsid = Deno.env.get('TWILIO_VERIFY_SID');
  if (!sid || !token || !vsid) return json(500, { error: 'twilio not configured' });

  const tw = await fetch(
    `https://verify.twilio.com/v2/Services/${vsid}/Verifications`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, Channel: 'sms' }),
    },
  );

  if (!tw.ok) {
    const detail = await tw.text();
    console.error('twilio send failed', tw.status, detail);
    return json(502, { error: 'failed to send OTP' });
  }

  return json(200, { ok: true });
});
