const DEFAULT_SUPABASE_URL = 'https://bbmdviffgxarxuptfftp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWR2aWZmZ3hhcnh1cHRmZnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzgyNzEsImV4cCI6MjA4NTUxNDI3MX0.qqceYnTa7zTtD-Sl1JbNFs1l_0JStdTzrrIXiXv62k54';

function readNonEmptyEnv(value: string | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value : fallback;
}

export const SUPABASE_URL = readNonEmptyEnv(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  DEFAULT_SUPABASE_URL,
);

export const SUPABASE_ANON_KEY = readNonEmptyEnv(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_ANON_KEY,
);
