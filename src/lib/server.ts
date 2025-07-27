// utils/supabase/server.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export function createClient() {
return createRouteHandlerClient({ cookies });
}