import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Lazy initialization - creates instances only when first accessed
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null;

// Singleton getter - defers creation to first access (safe for build/SSR)
function getSupabaseClient(): ReturnType<typeof createClient<Database>> {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
      );
    }
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// Proxy that defers initialization to first property access (safe for SSR/build)
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});

// Admin instance - for server-side operations only
// Only available when SUPABASE_SERVICE_ROLE_KEY is set
// Type-safe: Database generic ensures .update() and .insert() have correct types
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance && supabaseServiceKey) {
    supabaseAdminInstance = createClient<Database>(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdminInstance;
})();
