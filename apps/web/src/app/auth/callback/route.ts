import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function isAllowedMobileRedirect(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === 'ustaz:' && url.hostname === 'auth') return true;
    if (url.protocol === 'exp:' && url.pathname.endsWith('/--/auth')) return true;
    return false;
  } catch {
    return false;
  }
}

function appendCallbackParams(target: string, source: URL): string {
  const targetUrl = new URL(target);
  for (const [key, value] of source.searchParams.entries()) {
    if (key === 'mobile_redirect_to') continue;
    targetUrl.searchParams.set(key, value);
  }
  return targetUrl.toString();
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';
  const mobileRedirectTo = url.searchParams.get('mobile_redirect_to');

  if (mobileRedirectTo) {
    if (!isAllowedMobileRedirect(mobileRedirectTo)) {
      return NextResponse.redirect(new URL('/auth/login?error=invalid-mobile-redirect', url.origin));
    }
    return NextResponse.redirect(appendCallbackParams(mobileRedirectTo, url));
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            } catch {
              // Route handlers can set cookies; ignore only unexpected runtime constraints.
            }
          },
        },
      },
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}