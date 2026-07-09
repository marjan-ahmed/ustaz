(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__4ddc986e._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/apps/web/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

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
__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [middleware-edge] (ecmascript)");
;
;
const PROVIDER_AUTH = '/auth/provider-login';
const CUSTOMER_AUTH = '/auth/login';
/**
 * Verify the admin session cookie in Edge Runtime using Web Crypto.
 * Performs FULL HMAC-SHA256 signature verification (constant-time), then
 * checks expiry and that the embedded email still matches the configured
 * admin. Fails closed if the signing secret is absent.
 *
 * Cookie format: `base64url(JSON payload).hexHmac` (see src/lib/adminAuth.ts).
 */ async function verifyAdminCookieEdge(cookieValue) {
    if (!cookieValue) return false;
    const secret = process.env.INTERNAL_API_SECRET;
    if (!secret || secret.length < 16) return false; // fail closed
    const lastDot = cookieValue.lastIndexOf('.');
    if (lastDot === -1) return false;
    const payload = cookieValue.slice(0, lastDot);
    const sigHex = cookieValue.slice(lastDot + 1);
    try {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', enc.encode(secret), {
            name: 'HMAC',
            hash: 'SHA-256'
        }, false, [
            'sign'
        ]);
        const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
        const expected = Array.from(new Uint8Array(sigBuf)).map((b)=>b.toString(16).padStart(2, '0')).join('');
        // Constant-time comparison.
        if (sigHex.length !== expected.length) return false;
        let diff = 0;
        for(let i = 0; i < expected.length; i++){
            diff |= sigHex.charCodeAt(i) ^ expected.charCodeAt(i);
        }
        if (diff !== 0) return false;
        let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        while(b64.length % 4)b64 += '=';
        const parsed = JSON.parse(atob(b64));
        if (!parsed.exp || parsed.exp < Date.now()) return false;
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail || parsed.email !== adminEmail) return false;
        return true;
    } catch  {
        return false;
    }
}
async function middleware(req) {
    const path = req.nextUrl.pathname;
    // ─── Admin route protection (Edge Runtime safe — no Node.js crypto) ───
    if (path.startsWith('/admin')) {
        // Allow access to login page
        if (path === '/admin/login') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
        }
        // Verify admin session cookie — FULL HMAC signature + expiry + email
        const adminSession = req.cookies.get('admin_session')?.value;
        if (!await verifyAdminCookieEdge(adminSession)) {
            const url = req.nextUrl.clone();
            url.pathname = '/admin/login';
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
        }
        // Authenticated admin — allow access
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // 1. Create an initial response
    let res = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
        request: {
            headers: req.headers
        }
    });
    // 2. Initialize Supabase with getAll and setAll
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://solrsmnkxklsqklqhgxf.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbHJzbW5reGtsc3FrbHFoZ3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NTU0MDgsImV4cCI6MjA2ODMzMTQwOH0.KQ-VUMX-CSG1idPz7pRlIqBjpb7yelwlko-R9AbnHPk"), {
        cookies: {
            getAll () {
                return req.cookies.getAll();
            },
            setAll (cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options })=>req.cookies.set(name, value));
                res = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
                    request: {
                        headers: req.headers
                    }
                });
                cookiesToSet.forEach(({ name, value, options })=>res.cookies.set(name, value, options));
            }
        }
    });
    // 3. Always run getUser() to refresh the token if necessary
    const { data: { user } } = await supabase.auth.getUser();
    // Logged-in user landing on "/" goes to dashboard.
    if (user && path === '/') {
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard';
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
    }
    // Provider-only routes
    if (!user && (path.startsWith('/dashboard') || path.startsWith('/become-ustaz'))) {
        const url = req.nextUrl.clone();
        url.pathname = PROVIDER_AUTH;
        url.searchParams.set('next', path);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
    }
    // Customer-only routes
    if (!user && path.startsWith('/process')) {
        const url = req.nextUrl.clone();
        url.pathname = CUSTOMER_AUTH;
        url.searchParams.set('next', path);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
    }
    // Strip legacy ?userId= from /dashboard URLs
    if (path === '/dashboard' && req.nextUrl.searchParams.has('userId')) {
        const url = req.nextUrl.clone();
        url.searchParams.delete('userId');
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
    }
    return res;
}
const config = {
    matcher: [
        '/',
        '/dashboard/:path*',
        '/become-ustaz/:path*',
        '/process/:path*',
        '/admin',
        '/admin/:path*'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__4ddc986e._.js.map