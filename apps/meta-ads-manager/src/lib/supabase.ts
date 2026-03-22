import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Lazy singletons — only created on first use (safe for build/SSR)
let supabaseInstance: SupabaseClient<Database> | null = null;
let supabaseAdminInstance: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
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

function getSupabaseAdmin(): SupabaseClient<Database> | null {
  if (!supabaseAdminInstance && supabaseServiceKey && supabaseUrl) {
    supabaseAdminInstance = createClient<Database>(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdminInstance;
}

// For backwards compatibility — eagerly initialized only if env vars available
// These are used by 20+ files so we keep the named exports
export const supabase: SupabaseClient<Database> = (() => {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  // Return lazy getter proxy only when env vars not yet available (build time)
  return new Proxy({} as SupabaseClient<Database>, {
    get(_target, prop, receiver) {
      const client = getSupabase();
      const value = (client as any)[prop];
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    },
  });
})();

export const supabaseAdmin = getSupabaseAdmin();
