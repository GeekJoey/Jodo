import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://bbmdviffgxarxuptfftp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'sb_publishable_Hg57bTwkf9g2Jf6IxOXUkg_SWSfrYPp';

interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

function loadEnv(): void {
  return;
}

function getSupabaseCredentials(): SupabaseCredentials {
  loadEnv();
  return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY };
}

function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();

  if (token) {
    return createClient(url, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      db: {
        timeout: 60000,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createClient(url, anonKey, {
    db: {
      timeout: 60000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { loadEnv, getSupabaseCredentials, getSupabaseClient };
