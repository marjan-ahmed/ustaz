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
 * Verify the admin session cookie in Edge Runtime.
 * Parses the JSON payload (before the last '.') and checks expiry + email match.
 * Full HMAC signature verification happens in API routes (Node.js runtime).
 */
function verifyAdminCookieEdge(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;

  try {
    const lastDot = cookieValue.lastIndexOf('.');
    if (lastDot === -1) return false;

    const payload = cookieValue.slice(0, lastDot);
    const parsed = JSON.parse(payload);

    // Verify expiry
    if (!parsed.exp || parsed.exp < Date.now()) return false;

    // Verify email matches configured admin
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

    // Verify admin session cookie (payload expiry + email check)
    const adminSession = req.cookies.get('admin_session')?.value;
    if (!verifyAdminCookieEdge(adminSession)) {
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