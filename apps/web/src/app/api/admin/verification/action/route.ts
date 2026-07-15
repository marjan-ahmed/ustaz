import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const adminSession = cookieStore.get('admin_session')?.value;
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { submission_id, action, notes } = body;

  if (!submission_id || !action) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Action must be approve or reject' }, { status: 400 });
  }

  // Get the submission
  const { data: submission, error: fetchError } = await supabase
    .from('verification_submissions')
    .select('*')
    .eq('id', submission_id)
    .single();

  if (fetchError || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const verifiedAt = action === 'approve' ? new Date().toISOString() : null;
  const expiresAt = action === 'approve'
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Update submission status
  const { error: updateSubmissionError } = await supabase
    .from('verification_submissions')
    .update({
      status: newStatus,
      admin_notes: notes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submission_id);

  if (updateSubmissionError) {
    return NextResponse.json({ error: updateSubmissionError.message }, { status: 500 });
  }

  // Update provider's verification_status
  const verificationStatus = action === 'approve' ? 'verified' : 'rejected';
  const { error: updateProviderError } = await supabase
    .from('ustaz_registrations')
    .update({
      verification_status: verificationStatus,
      verified_at: verifiedAt,
      verification_expires_at: expiresAt,
      verification_notes: notes || null,
    })
    .eq('userId', submission.provider_id);

  if (updateProviderError) {
    return NextResponse.json({ error: updateProviderError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Verification ${action === 'approve' ? 'approved' : 'rejected'}`,
  });
}
