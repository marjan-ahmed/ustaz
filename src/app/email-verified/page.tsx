import Link from 'next/link';

export const metadata = { title: 'Email Verification — Ustaz' };

export default async function EmailVerified({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; reason?: string }>;
}) {
  const { status, reason } = await searchParams;
  const ok = status === 'success';

  const reasonText: Record<string, string> = {
    'token-expired': 'This verification link has expired. Please request a new one.',
    'token-already-used': 'This link has already been used.',
    'invalid-token': 'This verification link is invalid.',
    'missing-token': 'No verification token was provided.',
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div
          className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${
            ok ? 'bg-green-100' : 'bg-red-100'
          }`}
        >
          {ok ? '✅' : '⚠️'}
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 mb-2">
          {ok ? 'Email Verified' : 'Verification Failed'}
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          {ok
            ? 'Your email address has been confirmed. You can close this tab.'
            : reasonText[reason ?? ''] || 'We could not verify your email. Please try again.'}
        </p>
        <Link
          href="/"
          className="inline-block bg-[#db4b0d] hover:bg-[#a93a0b] text-white font-semibold px-6 py-2.5 rounded-xl transition"
        >
          Back to Ustaz
        </Link>
      </div>
    </main>
  );
}
