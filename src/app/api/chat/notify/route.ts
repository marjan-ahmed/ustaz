import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/server';
import { sendPush } from '@/lib/sendPush';

// POST { recipientId, preview }
//   sender is derived from the cookie session (never trusted from the body)
//   fires FCM to the recipient and returns immediately
export async function POST(req: NextRequest) {
  const supabase = await createAuthedClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  let body: { recipientId?: string; preview?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { recipientId, preview } = body;
  if (!recipientId || typeof preview !== 'string') {
    return NextResponse.json(
      { error: 'recipientId and preview are required' },
      { status: 400 },
    );
  }
  if (recipientId === user.id) {
    return NextResponse.json({ ok: true, skipped: 'self' });
  }

  // Resolve sender's display name (provider profile → auth metadata → fallback)
  let senderName = 'New message';
  const { data: prov } = await supabase
    .from('ustaz_registrations')
    .select('"firstName", "lastName"')
    .eq('userId', user.id)
    .maybeSingle();
  if (prov) {
    const composed = `${prov.firstName ?? ''} ${prov.lastName ?? ''}`.trim();
    if (composed) senderName = composed;
  } else {
    const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
    senderName =
      meta.full_name || meta.name || meta.firstName || meta.phone || 'New message';
  }

  // Fire-and-forget — never blocks the chat send response
  sendPush(
    [recipientId],
    senderName,
    preview.slice(0, 140) || 'sent you a message',
    { url: '/chat', senderId: user.id, type: 'chat' },
  ).catch((err) => console.warn('[chat/notify] sendPush failed', err));

  return NextResponse.json({ ok: true });
}
