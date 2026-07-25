// @ts-nocheck
// verify-cnic Edge Function - OCR cross-check of a provider's typed CNIC + fields
// against the uploaded CNIC photos, then writes the verification verdict.
//
// Auth (mirrors send-fcm): server-to-server via INTERNAL_API_SECRET header, OR a
// provider Bearer JWT (userId is then derived from the token, never trusted from body).
//
// Decision:
//   verified       - number matches, name matches, not expired, adult, front<->back
//                    consistent, not a duplicate.
//   rejected       - a confident fraud signal (number mismatch / duplicate CNIC /
//                    expired / under-18 / front<->back mismatch).
//   pending_review - unreadable image, or a lone soft name mismatch -> manual review.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const FETCH_TIMEOUT_MS = 20_000;

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

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// --- OCR (isolated: swap this one fn to change engines) ----------------------
async function ocrText(imageUrl: string): Promise<string> {
  const apiKey = Deno.env.get('OCR_SPACE_API_KEY');
  if (!apiKey) throw new Error('OCR_SPACE_API_KEY not configured');
  try {
    const res = await fetchWithTimeout('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        apikey: apiKey,
        url: imageUrl,
        OCREngine: '2',
        scale: 'true',
        isOverlayRequired: 'false',
      }),
    });
    if (!res.ok) {
      console.error('[verify-cnic] OCR http', res.status);
      return '';
    }
    const data = await res.json();
    if (data?.IsErroredOnProcessing) {
      console.error('[verify-cnic] OCR error', JSON.stringify(data?.ErrorMessage));
      return '';
    }
    return String(data?.ParsedResults?.[0]?.ParsedText ?? '');
  } catch (e: any) {
    console.error('[verify-cnic] OCR exception', e.message);
    return '';
  }
}

// --- extraction helpers ------------------------------------------------------
const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');

// Find the first 13-digit CNIC run, tolerating dashes/spaces between groups.
function extractCnic(text: string): string | null {
  if (!text) return null;
  const m = text.match(/\d[\d\s-]{11,}\d/g);
  if (m) {
    for (const cand of m) {
      const d = onlyDigits(cand);
      if (d.length === 13) return d;
    }
  }
  // fallback: any bare 13-digit run
  const bare = onlyDigits(text).match(/\d{13}/);
  return bare ? bare[0] : null;
}

// Parse dd.mm.yyyy / dd-mm-yyyy / dd/mm/yyyy into a Date (or null).
function parseDates(text: string): Date[] {
  const out: Date[] = [];
  const re = /\b(\d{2})[.\-/](\d{2})[.\-/](\d{4})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const d = +m[1], mo = +m[2], y = +m[3];
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
      out.push(new Date(Date.UTC(y, mo - 1, d)));
    }
  }
  return out;
}

function ageFrom(dob: Date): number {
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const mo = now.getUTCMonth() - dob.getUTCMonth();
  if (mo < 0 || (mo === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

const NADRA_KEYWORDS = [
  'pakistan', 'identity', 'national', 'nadra', 'card number', 'identity number',
  'date of birth', 'date of issue', 'date of expiry', 'holder', 'gender',
];
function looksLikeCnic(text: string): boolean {
  const t = (text || '').toLowerCase();
  return NADRA_KEYWORDS.some((k) => t.includes(k));
}

// Fuzzy name check: how many typed-name tokens (len>=3) appear in the OCR text.
function nameMatches(firstName: string, lastName: string, text: string): boolean | null {
  const norm = (s: string) => (s || '').toUpperCase().replace(/[^A-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const hay = norm(text);
  if (!hay) return null;
  const tokens = norm(`${firstName} ${lastName}`).split(' ').filter((t) => t.length >= 3);
  if (!tokens.length) return null;
  const hits = tokens.filter((t) => hay.includes(t)).length;
  return hits / tokens.length >= 0.5;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  // --- auth: internal secret OR provider JWT ---------------------------------
  const internalSecret = Deno.env.get('INTERNAL_API_SECRET');
  const hasInternalSecret = internalSecret && req.headers.get('x-internal-secret') === internalSecret;

  let jwtUserId: string | null = null;
  if (!hasInternalSecret) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json(401, { error: 'unauthorized' });
    const jwt = authHeader.slice(7);
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? req.headers.get('apikey');
    if (!anonKey) return json(401, { error: 'unauthorized' });
    const verifyRes = await fetchWithTimeout(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${jwt}`, apikey: anonKey },
    });
    if (!verifyRes.ok) return json(401, { error: 'unauthorized' });
    const u = await verifyRes.json();
    jwtUserId = u?.id ?? null;
    if (!jwtUserId) return json(401, { error: 'unauthorized' });
  }

  let payload: {
    userId?: string; firstName?: string; lastName?: string;
    cnicNumber?: string; cnicFrontUrl?: string; cnicBackUrl?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'invalid json' });
  }

  const userId = jwtUserId ?? payload.userId;
  const typedCnic = onlyDigits(payload.cnicNumber ?? '');
  const { firstName = '', lastName = '', cnicFrontUrl, cnicBackUrl } = payload;

  if (!userId) return json(400, { error: 'userId required' });
  if (typedCnic.length !== 13) return json(400, { error: 'cnicNumber must be 13 digits' });
  if (!cnicFrontUrl) return json(400, { error: 'cnicFrontUrl required' });

  const admin = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // --- OCR both sides --------------------------------------------------------
  const [frontText, backText] = await Promise.all([
    ocrText(cnicFrontUrl),
    cnicBackUrl ? ocrText(cnicBackUrl) : Promise.resolve(''),
  ]);

  const frontCnic = extractCnic(frontText);
  const backCnic = cnicBackUrl ? extractCnic(backText) : null;
  const isCnic = looksLikeCnic(frontText) || frontCnic !== null;

  // --- run the checks --------------------------------------------------------
  const numberMatch = frontCnic !== null ? frontCnic === typedCnic : null;
  const frontBackMatch = frontCnic && backCnic ? frontCnic === backCnic : null;
  const nameMatch = nameMatches(firstName, lastName, frontText);

  const dates = parseDates(frontText);
  const years = dates.map((d) => d.getUTCFullYear());
  let expiryDate: Date | null = null;
  let dob: Date | null = null;
  if (dates.length) {
    // heuristic: earliest date = DOB, latest future-ish date = expiry
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
    dob = sorted[0];
    expiryDate = sorted[sorted.length - 1];
    // if the "expiry" isn't actually after issue/dob, treat as unknown
    if (years.length < 2) { expiryDate = null; dob = null; }
  }
  const cnicExpired = expiryDate ? expiryDate.getTime() < Date.now() : null;
  const ageOk = dob ? ageFrom(dob) >= 18 : null;

  // --- duplicate CNIC on a different active provider -------------------------
  let duplicate = false;
  {
    const { data: dups } = await admin
      .from('ustaz_registrations')
      .select('userId')
      .eq('cnic', typedCnic)
      .in('verification_status', ['verified', 'pending_review'])
      .neq('userId', userId);
    duplicate = !!dups?.length;
  }

  // --- decide ----------------------------------------------------------------
  let decision: 'verified' | 'rejected' | 'pending_review';
  let ocrResult: 'match' | 'mismatch' | 'unreadable';
  let reason = '';

  if (duplicate) {
    decision = 'rejected'; ocrResult = 'mismatch';
    reason = 'This CNIC is already registered to another provider.';
  } else if (numberMatch === false) {
    decision = 'rejected'; ocrResult = 'mismatch';
    reason = "The CNIC number you typed doesn't match the number on the photo.";
  } else if (frontBackMatch === false) {
    decision = 'rejected'; ocrResult = 'mismatch';
    reason = 'The CNIC front and back photos are from different cards.';
  } else if (cnicExpired === true) {
    decision = 'rejected'; ocrResult = 'mismatch';
    reason = 'This CNIC has expired. Please renew it and re-submit.';
  } else if (ageOk === false) {
    decision = 'rejected'; ocrResult = 'mismatch';
    reason = 'Providers must be at least 18 years old.';
  } else if (!isCnic) {
    // No NADRA text and no 13-digit run: this is not a CNIC (e.g. a selfie or
    // random document). Bounce it back rather than routing to manual review.
    decision = 'rejected'; ocrResult = 'unreadable';
    reason = "That photo doesn't look like a CNIC. Upload a clear photo of the front of your CNIC card — not a selfie or another document.";
  } else if (numberMatch === null) {
    // It reads like a CNIC, but the number couldn't be extracted (glare/blur).
    decision = 'pending_review'; ocrResult = 'unreadable';
    reason = "We couldn't read your CNIC number clearly. It has been sent for manual review.";
  } else if (nameMatch === false) {
    // Correct CNIC number typed, but under a different name than the card holder.
    decision = 'rejected'; ocrResult = 'mismatch';
    reason = "The name you entered doesn't match the name on the CNIC. Enter your full name exactly as printed on your CNIC.";
  } else if (nameMatch === null) {
    // Couldn't isolate the name from the OCR text — send for manual review.
    decision = 'pending_review'; ocrResult = 'match';
    reason = 'We could not confirm the name on your CNIC. It has been sent for manual review.';
  } else {
    decision = 'verified'; ocrResult = 'match';
    reason = 'Identity verified.';
  }

  const details = {
    number_match: numberMatch,
    name_match: nameMatch,
    front_back_match: frontBackMatch,
    is_cnic: isCnic,
    cnic_expired: cnicExpired,
    age_ok: ageOk,
    duplicate,
    extracted_cnic: frontCnic,
    expiry: expiryDate ? expiryDate.toISOString().slice(0, 10) : null,
    dob: dob ? dob.toISOString().slice(0, 10) : null,
  };

  const now = new Date().toISOString();

  // Record the verdict where the insert trigger can consult it — this works even
  // BEFORE the ustaz_registrations row exists (verify-before-register), so no
  // account row is written when the check fails.
  const { error: vErr } = await admin
    .from('cnic_verifications')
    .upsert({
      user_id: userId,
      cnic: typedCnic,
      decision,
      ocr_result: ocrResult,
      ocr_number: frontCnic,
      details,
      checked_at: now,
    }, { onConflict: 'user_id' });
  if (vErr) {
    console.error('[verify-cnic] persist failed', vErr.message);
    return json(500, { error: 'failed to save verification', details: vErr.message });
  }

  // If a registration row already exists (re-verify / verify-identity), sync it
  // too. On the pre-insert path this matches 0 rows and is a harmless no-op.
  const update: Record<string, unknown> = {
    cnic_ocr_result: ocrResult,
    cnic_ocr_number: frontCnic,
    cnic_ocr_details: details,
    cnic_ocr_checked_at: now,
    verification_status: decision,
  };
  if (decision === 'verified') {
    update.verified_at = now;
    update.verification_expires_at = new Date(Date.now() + 365 * 864e5).toISOString();
  }
  await admin.from('ustaz_registrations').update(update).eq('userId', userId);

  console.log(`[verify-cnic] user=${userId} decision=${decision} result=${ocrResult}`);
  return json(200, { decision, reason, details });
});
