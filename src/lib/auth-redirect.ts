export function getSiteUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;

  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    'http://localhost:3000';
  return fromEnv.replace(/\/+$/, '');
}

export function getAuthCallbackUrl(next: string = '/'): string {
  const base = getSiteUrl();
  const safeNext = next.startsWith('/') ? next : `/${next}`;
  return `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
