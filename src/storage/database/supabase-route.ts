import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/storage/database/supabase-config';

export function createSupabaseRouteClient(request: NextRequest) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Route handlers in this app rely on the proxy for session refresh.
      },
    },
  });
}

export async function requireSupabaseUser(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase: null, user: null };
  }

  return { supabase, user };
}
