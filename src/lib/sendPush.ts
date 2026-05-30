// Server-side helper: fire-and-forget FCM push via the send-fcm Edge Function.
// Push failures must NEVER break the request flow, so all errors are swallowed.

export async function sendPush(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  if (!userIds?.length) return;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.INTERNAL_API_SECRET;
  if (!base || !anon || !secret) {
    console.warn('[sendPush] missing env (SUPABASE_URL / ANON_KEY / INTERNAL_API_SECRET) — skipped');
    return;
  }

  try {
    const res = await fetch(`${base}/functions/v1/send-fcm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        'x-internal-secret': secret,
      },
      body: JSON.stringify({ userIds, title, body, data: data ?? {} }),
    });
    if (!res.ok) {
      console.warn('[sendPush] edge function non-200', res.status, await res.text().catch(() => ''));
    }
  } catch (e) {
    console.warn('[sendPush] failed (non-fatal)', e);
  }
}