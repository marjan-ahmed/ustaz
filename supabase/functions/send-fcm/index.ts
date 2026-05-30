// @ts-nocheck
// send-fcm Edge Function — sends FCM push via HTTP v1 to all tokens of given users.
// Server-to-server only; guarded by INTERNAL_API_SECRET shared secret.
//
// Required secrets (supabase secrets set ...):
//   FCM_SERVICE_ACCOUNT_JSON  — FULL service-account JSON (the ROTATED one), single-line string
//   INTERNAL_API_SECRET       — long random string; callers send it in x-internal-secret
// Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Body: { userIds: string[], title: string, body: string, data?: Record<string,string> }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function b64url(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;

  const pem = String(sa.private_key).replace(/\\n/g, '\n');
  const keyData = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const bin = atob(keyData);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);

  const key = await crypto.subtle.importKey(
    'pkcs8',
    buf.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)),
  );
  const jwt = `${unsigned}.${b64url(sig)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`OAuth2 token exchange failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: now + (data.expires_in ?? 3600) };
  return cachedToken.token;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  const internalSecret = Deno.env.get('INTERNAL_API_SECRET');
  if (!internalSecret || req.headers.get('x-internal-secret') !== internalSecret) {
    return json(401, { error: 'unauthorized' });
  }

  const saRaw = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON');
  if (!saRaw) return json(500, { error: 'FCM_SERVICE_ACCOUNT_JSON not configured' });
  let sa: any;
  try {
    sa = JSON.parse(saRaw.startsWith('{') ? saRaw : new TextDecoder().decode(Uint8Array.from(atob(saRaw), (c) => c.charCodeAt(0))));
  } catch {
    return json(500, { error: 'FCM_SERVICE_ACCOUNT_JSON is not valid JSON' });
  }

  let payload: { userIds?: string[]; title?: string; body?: string; data?: Record<string, string> };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'invalid json' });
  }
  const { userIds, title, body: notifBody, data = {} } = payload;
  if (!userIds?.length || !title || !notifBody) {
    return json(400, { error: 'userIds (array), title, body required' });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data: rows, error } = await admin
    .from('fcm_tokens')
    .select('token')
    .in('user_id', userIds);
  if (error) return json(500, { error: 'token lookup failed', details: error.message });
  if (!rows?.length) return json(200, { sent: 0, note: 'no tokens for these users' });

  let accessToken: string;
  try {
    accessToken = await getAccessToken(sa);
  } catch (e: any) {
    console.error('[send-fcm] oauth error', e.message);
    return json(500, { error: `OAuth2 error: ${e.message}` });
  }

  const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  const stringData: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) stringData[k] = String(v);

  let sent = 0;
  const stale: string[] = [];

  await Promise.all(
    rows.map(async ({ token }: { token: string }) => {
      const message = {
        message: {
          token,
          notification: { title, body: notifBody },
          data: stringData,
          webpush: {
            notification: {
              title,
              body: notifBody,
              icon: '/ustaz_logo.png',
              badge: '/icon512_rounded.png',
              requireInteraction: true,
            },
            fcm_options: { link: stringData.url ?? '/' },
          },
        },
      };
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      if (r.ok) {
        sent++;
      } else {
        const txt = await r.text();
        if (r.status === 404 || r.status === 400 || /UNREGISTERED|NOT_FOUND|INVALID_ARGUMENT/i.test(txt)) {
          stale.push(token);
        }
        console.error('[send-fcm] send failed', r.status, txt);
      }
    }),
  );

  if (stale.length) await admin.from('fcm_tokens').delete().in('token', stale);

  return json(200, { sent, pruned: stale.length, total: rows.length });
});
