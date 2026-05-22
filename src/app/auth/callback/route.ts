// import { NextRequest, NextResponse } from 'next/server';
// import { createServerClient } from '@supabase/ssr';
// import { cookies } from 'next/headers';

// export async function GET(req: NextRequest) {
//   const url = new URL(req.url);
//   const code = url.searchParams.get('code');
//   const next = url.searchParams.get('next') ?? '/';

//   if (code) {
//     const cookieStore = await cookies();
//     const supabase = createServerClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//       {
//         cookies: {
//           get: (n) => cookieStore.get(n)?.value,
//           set: (n, v, o) => cookieStore.set({ name: n, value: v, ...o }),
//           remove: (n, o) => cookieStore.set({ name: n, value: '', ...o }),
//         },
//       },
//     );
//     await supabase.auth.exchangeCodeForSession(code);
//   }
//   return NextResponse.redirect(new URL(next, url.origin));
// }

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // 1. Use getAll to read cookies
          getAll() {
            return cookieStore.getAll();
          },
          // 2. Use setAll to set or remove cookies
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The Server Component context might sometimes prevent setting cookies,
              // but since this is a Route Handler, it should work smoothly.
            }
          },
        },
      },
    );
    
    // Exchange the temporary code for an active user session
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}