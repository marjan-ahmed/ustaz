// @ts-nocheck
// send-fcm Edge Function - sends push to all tokens of given users.
// Supports BOTH raw FCM tokens (web/device-token fallback) AND Expo push tokens.
// Server-to-server only; guarded by INTERNAL_API_SECRET shared secret.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const FETCH_TIMEOUT_MS = 10_000;

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

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

  console.log('[send-fcm] minting new OAuth2 token for', sa.client_email);

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
  if (!pem.includes('BEGIN PRIVATE KEY')) {
    throw new Error('FCM_SERVICE_ACCOUNT_JSON private_key is missing BEGIN PRIVATE KEY header');
  }
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

  const res = await fetchWithTimeout('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`OAuth2 token exchange failed: ${res.status} ${errText}`);
  }
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: now + (data.expires_in ?? 3600) };
  console.log('[send-fcm] OAuth2 token acquired, expires in', data.expires_in, 's');
  return cachedToken.token;
}

async function sendViaExpo(
  expoTokens: string[],
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<{ sent: number; failed: number }> {
  if (!expoTokens.length) return { sent: 0, failed: 0 };

  const messages = expoTokens.map((token) => ({
    to: token,
    title,
    body,
    data,
    priority: 'high',
    sound: 'default',
    channelId: 'default',
  }));

  const res = await fetchWithTimeout('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  }, 15_000);

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error('[send-fcm] Expo push failed', res.status, txt.slice(0, 300));
    return { sent: 0, failed: expoTokens.length };
  }

  const result = await res.json();
  const dataArr = Array.isArray(result?.data) ? result.data : [];
  let sent = 0;
  let failed = 0;
  for (const item of dataArr) {
    if (item?.status === 'ok') sent++;
    else {
      failed++;
      console.error('[send-fcm] Expo push individual fail', item?.message ?? item);
    }
  }
  return { sent, failed };
}

async function sendViaFcm(
  fcmTokens: string[],
  accessToken: string,
  projectId: string,
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<{ sent: number; stale: string[] }> {
  if (!fcmTokens.length) return { sent: 0, stale: [] };

  const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  let sent = 0;
  const stale: string[] = [];

  await Promise.all(
    fcmTokens.map(async (token) => {
      const message = {
        message: {
          token,
          notification: { title, body },
          data,
          android: {
            priority: 'high' as const,
            notification: {
              channelId: 'default',
              clickAction: 'ustaz://',
            },
          },
          webpush: {
            notification: {
              title,
              body,
              icon: '/ustaz_logo.png',
              badge: '/icon512_rounded.png',
              requireInteraction: true,
            },
            fcm_options: { link: data.url ?? '/' },
          },
        },
      };
      try {
        const r = await fetchWithTimeout(endpoint, {
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
          console.error('[send-fcm] FCM send failed', r.status, txt.slice(0, 200));
        }
      } catch (e: any) {
        console.error('[send-fcm] FCM send error', e.message);
      }
    }),
  );

  return { sent, stale };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  const internalSecret = Deno.env.get('INTERNAL_API_SECRET');
  const hasInternalSecret = internalSecret && req.headers.get('x-internal-secret') === internalSecret;

  if (!hasInternalSecret) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json(401, { error: 'unauthorized' });
    }
    const jwt = authHeader.slice(7);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? req.headers.get('apikey');
    if (!supabaseAnonKey) return json(401, { error: 'unauthorized' });
    const verifyRes = await fetchWithTimeout(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${jwt}`, apikey: supabaseAnonKey },
    });
    if (!verifyRes.ok) return json(401, { error: 'unauthorized' });
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

  console.log(`[send-fcm] request for ${userIds.length} user(s): ${userIds.join(', ')}`);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data: rows, error } = await admin
    .from('fcm_tokens')
    .select('token, user_agent')
    .in('user_id', userIds);
  if (error) return json(500, { error: 'token lookup failed', details: error.message });
  if (!rows?.length) return json(200, { sent: 0, note: 'no tokens for these users' });

  console.log(`[send-fcm] found ${rows.length} token(s)`);

  const stringData: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) stringData[k] = String(v);

  // Split tokens: Expo push tokens vs raw FCM tokens
  const expoTokens: string[] = [];
  const fcmTokens: string[] = [];
  for (const { token } of rows) {
    if (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) {
      expoTokens.push(token);
    } else {
      fcmTokens.push(token);
    }
  }

  let totalExpoSent = 0;
  let totalExpoFailed = 0;
  let totalFcmSent = 0;
  const allStale: string[] = [];

  // Send to Expo push tokens
  if (expoTokens.length) {
    console.log(`[send-fcm] sending to ${expoTokens.length} Expo token(s)`);
    const expoResult = await sendViaExpo(expoTokens, title, notifBody, stringData);
    totalExpoSent = expoResult.sent;
    totalExpoFailed = expoResult.failed;
  }

  // Send to raw FCM tokens (web / native device-token fallback)
  if (fcmTokens.length) {
    console.log(`[send-fcm] sending to ${fcmTokens.length} FCM token(s)`);

    const saRaw = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON');
    if (!saRaw) return json(500, { error: 'FCM_SERVICE_ACCOUNT_JSON not configured' });

    let sa: any;
    try {
      sa = JSON.parse(saRaw.startsWith('{') ? saRaw : new TextDecoder().decode(Uint8Array.from(atob(saRaw), (c) => c.charCodeAt(0))));
    } catch {
      return json(500, { error: 'FCM_SERVICE_ACCOUNT_JSON is not valid JSON' });
    }

    let accessToken: string;
    try {
      accessToken = await getAccessToken(sa);
    } catch (e: any) {
      console.error('[send-fcm] oauth error', e.message);
      return json(500, { error: `OAuth2 error: ${e.message}` });
    }
    const fcmResult = await sendViaFcm(fcmTokens, accessToken, sa.project_id, title, notifBody, stringData);
    totalFcmSent = fcmResult.sent;
    allStale.push(...fcmResult.stale);
  }

  if (allStale.length) await admin.from('fcm_tokens').delete().in('token', allStale);

  const totalSent = totalExpoSent + totalFcmSent;
  console.log(`[send-fcm] done: expo_sent=${totalExpoSent} fcm_sent=${totalFcmSent} stale=${allStale.length} total=${rows.length}`);
  return json(200, {
    sent: totalSent,
    expo_sent: totalExpoSent,
    fcm_sent: totalFcmSent,
    expo_failed: totalExpoFailed,
    pruned: allStale.length,
    total: rows.length,
  });
});
