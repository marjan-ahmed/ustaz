// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { createServerClient } from '@supabase/ssr';

// const PROVIDER_AUTH = '/auth/provider-login';
// const CUSTOMER_AUTH = '/auth/login';

// export async function middleware(req: NextRequest) {
//   const res = NextResponse.next();

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get: (n) => req.cookies.get(n)?.value,//error occuring!!!
//         set: (n, v, o) => res.cookies.set({ name: n, value: v, ...o }),
//         remove: (n, o) => res.cookies.set({ name: n, value: '', ...o }),
//       },
//     },
//   );

//   const { data: { user } } = await supabase.auth.getUser();
//   const path = req.nextUrl.pathname;

//   // Logged-in user landing on "/" goes to dashboard.
//   if (user && path === '/') {
//     const url = req.nextUrl.clone();
//     url.pathname = '/dashboard';
//     return NextResponse.redirect(url);
//   }

//   // Provider-only routes
//   if (!user && (path.startsWith('/dashboard') || path.startsWith('/become-ustaz'))) {
//     const url = req.nextUrl.clone();
//     url.pathname = PROVIDER_AUTH;
//     url.searchParams.set('next', path);
//     return NextResponse.redirect(url);
//   }

//   // Customer-only routes
//   if (!user && path.startsWith('/process')) {
//     const url = req.nextUrl.clone();
//     url.pathname = CUSTOMER_AUTH;
//     url.searchParams.set('next', path);
//     return NextResponse.redirect(url);
//   }

//   // Strip legacy ?userId= from /dashboard URLs — provider id now comes
//   // exclusively from the authenticated session.
//   if (path === '/dashboard' && req.nextUrl.searchParams.has('userId')) {
//     const url = req.nextUrl.clone();
//     url.searchParams.delete('userId');
//     return NextResponse.redirect(url);
//   }

//   return res;
// }

// export const config = {
//   matcher: ['/', '/dashboard/:path*', '/become-ustaz/:path*', '/process/:path*'],
// };
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROVIDER_AUTH = '/auth/provider-login';
const CUSTOMER_AUTH = '/auth/login';

/**
 * Verify the admin session cookie in Edge Runtime using Web Crypto.
 * Performs FULL HMAC-SHA256 signature verification (constant-time), then
 * checks expiry and that the embedded email still matches the configured
 * admin. Fails closed if the signing secret is absent.
 *
 * Cookie format: `base64url(JSON payload).hexHmac` (see src/lib/adminAuth.ts).
 */
async function verifyAdminCookieEdge(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;

  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || secret.length < 16) return false; // fail closed

  const lastDot = cookieValue.lastIndexOf('.');
  if (lastDot === -1) return false;

  const payload = cookieValue.slice(0, lastDot);
  const sigHex = cookieValue.slice(lastDot + 1);

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const expected = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison.
    if (sigHex.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= sigHex.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (diff !== 0) return false;

    let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const parsed = JSON.parse(atob(b64));
    if (!parsed.exp || parsed.exp < Date.now()) return false;

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || parsed.email !== adminEmail) return false;

    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // ─── Admin route protection (Edge Runtime safe — no Node.js crypto) ───
  if (path.startsWith('/admin')) {
    // Allow access to login page
    if (path === '/admin/login') {
      return NextResponse.next();
    }

    // Verify admin session cookie — FULL HMAC signature + expiry + email
    const adminSession = req.cookies.get('admin_session')?.value;
    if (!(await verifyAdminCookieEdge(adminSession))) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // Authenticated admin — allow access
    return NextResponse.next();
  }

  // 1. Create an initial response
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // 2. Initialize Supabase with getAll and setAll
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // 3. Always run getUser() to refresh the token if necessary
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-in user landing on "/" goes to dashboard.
  if (user && path === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Provider-only routes
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/become-ustaz'))) {
    const url = req.nextUrl.clone();
    url.pathname = PROVIDER_AUTH;
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // Customer-only routes
  if (!user && path.startsWith('/process')) {
    const url = req.nextUrl.clone();
    url.pathname = CUSTOMER_AUTH;
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // Strip legacy ?userId= from /dashboard URLs
  if (path === '/dashboard' && req.nextUrl.searchParams.has('userId')) {
    const url = req.nextUrl.clone();
    url.searchParams.delete('userId');
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/become-ustaz/:path*', '/process/:path*', '/admin', '/admin/:path*'],
};