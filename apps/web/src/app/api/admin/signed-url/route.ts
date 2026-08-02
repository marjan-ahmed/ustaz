import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/adminAuth';

/**
 * Mints a short-lived signed URL for a private storage object.
 *
 * `provider-docs` (CNIC scans) and `topup-receipts` used to be public buckets,
 * so the admin screens stored and rendered `/object/public/...` URLs directly.
 * Those buckets are now private, so admins fetch a signed URL through here
 * instead. Service-role client: RLS is bypassed, which is why the admin session
 * is verified first and the bucket is allow-listed.
 */
const ALLOWED_BUCKETS = new Set([
  'provider-docs',
  'topup-receipts',
  'verification-docs',
  'entrance-photos',
]);

const TTL_SECONDS = 300;

/** Pull `{ bucket, path }` out of a stored Supabase storage URL. */
function parseStorageUrl(raw: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(raw);
    // .../storage/v1/object/{public|sign|authenticated}/{bucket}/{path...}
    const parts = u.pathname.split('/').filter(Boolean);
    const objectIdx = parts.indexOf('object');
    if (objectIdx === -1) return null;
    const rest = parts.slice(objectIdx + 1);
    if (rest.length < 2) return null;
    // Skip the access-mode segment when present.
    const start = ['public', 'sign', 'authenticated'].includes(rest[0]) ? 1 : 0;
    const bucket = rest[start];
    const path = rest.slice(start + 1).map(decodeURIComponent).join('/');
    if (!bucket || !path) return null;
    return { bucket, path };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req.cookies.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'Storage access is not configured' }, { status: 500 });
  }

  let body: { url?: string; bucket?: string; path?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const target = body.url
    ? parseStorageUrl(body.url)
    : body.bucket && body.path
      ? { bucket: body.bucket, path: body.path }
      : null;

  if (!target) {
    return NextResponse.json({ error: 'Provide a storage `url`, or `bucket` and `path`' }, { status: 400 });
  }
  if (!ALLOWED_BUCKETS.has(target.bucket)) {
    return NextResponse.json({ error: 'Bucket not allowed' }, { status: 403 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.storage
    .from(target.bucket)
    .createSignedUrl(target.path, TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error('[admin/signed-url] failed', { bucket: target.bucket, error: error?.message });
    return NextResponse.json({ error: 'Could not sign that object' }, { status: 404 });
  }

  return NextResponse.json({ url: data.signedUrl, expiresIn: TTL_SECONDS });
}
