import { createBrowserClient } from '@supabase/ssr'

export function createClient(options?: any) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'local-build-anon-key';

  return createBrowserClient(url, anonKey, options);
}
