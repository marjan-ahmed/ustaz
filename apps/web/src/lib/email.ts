// Email dispatch seam.
//
// IMPORTANT (architecture note): Ustaz logs in with PHONE OTP. The Supabase
// auth user's email is a synthesized placeholder (`<digits>@phone.ustaz.local`)
// that `verify-otp` keys the login on. Supabase's built-in SMTP can ONLY send
// to that *identity* address (via auth.updateUser/confirmation), so it cannot
// verify a user's real *profile* email without hijacking the login identity.
//
// Therefore profile-email verification sends through a normal transactional
// provider. This is the single place to wire one in. Until a provider key is
// set, requests still succeed and (in non-production) the link is logged so the
// flow is fully testable end-to-end.

interface SendResult {
  sent: boolean;
  devLink?: string; // returned to caller only in non-production
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<SendResult> {
  const isProd = process.env.NODE_ENV === 'production';

  // ── Provider: Resend (drop-in). Set RESEND_API_KEY + EMAIL_FROM to enable. ──
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Ustaz <no-reply@ustaz.app>';
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject: 'Verify your email — Ustaz',
          html: verificationHtml(verifyUrl),
        }),
      });
      if (!res.ok) {
        console.error('[email] Resend send failed', res.status, await res.text().catch(() => ''));
        return { sent: false, devLink: isProd ? undefined : verifyUrl };
      }
      return { sent: true };
    } catch (e) {
      console.error('[email] Resend send error', e);
      return { sent: false, devLink: isProd ? undefined : verifyUrl };
    }
  }

  // ── No provider configured ──
  // Don't hard-fail the request; surface the link in dev so the flow is testable.
  if (!isProd) {
    console.log(`[email] (no provider) verification link for ${to}: ${verifyUrl}`);
    return { sent: false, devLink: verifyUrl };
  }
  console.warn('[email] No email provider configured (RESEND_API_KEY unset) — email not sent.');
  return { sent: false };
}

function verificationHtml(url: string): string {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h2 style="color:#111828">Verify your email</h2>
    <p style="color:#444;line-height:1.6">
      Tap the button below to confirm this email address for your Ustaz account.
      This link expires in 30 minutes.
    </p>
    <a href="${url}" style="display:inline-block;background:#db4b0d;color:#fff;
       text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;margin:16px 0">
      Verify Email
    </a>
    <p style="color:#999;font-size:12px">If you didn't request this, you can ignore this email.</p>
  </div>`;
}
