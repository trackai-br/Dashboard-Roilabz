import { supabase } from './supabase';

/**
 * Wait for Supabase to finish processing any pending auth (e.g. OAuth code exchange).
 * Returns the session once available, or null after timeout.
 */
function waitForSession(timeoutMs = 3000): Promise<import('@supabase/supabase-js').Session | null> {
  return new Promise((resolve) => {
    // First try synchronous check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        resolve(session);
        return;
      }

      // Wait for auth state change (OAuth code exchange may be in progress)
      const timer = setTimeout(() => {
        sub.unsubscribe();
        resolve(null);
      }, timeoutMs);

      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.access_token) {
          clearTimeout(timer);
          sub.unsubscribe();
          resolve(session);
        }
      });
    });
  });
}

/**
 * Fetch autenticado — adiciona Authorization header automaticamente.
 * Tenta refresh se sessao expirou.
 * Redireciona para /login se nao ha sessao.
 */
export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  let session = await waitForSession();

  if (!session?.access_token) {
    try {
      const { data } = await supabase.auth.refreshSession();
      session = data.session;
    } catch {
      // refresh failed (network error, revoked token, etc.)
    }

    if (!session?.access_token) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }
  }

  // Only set Content-Type if not already provided (preserves FormData, etc.)
  const hasContentType = options?.headers &&
    (('Content-Type' in (options.headers as Record<string, string>)) ||
     ('content-type' in (options.headers as Record<string, string>)));

  return fetch(url, {
    ...options,
    headers: {
      ...(hasContentType ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${session.access_token}`,
      ...options?.headers,
    },
  });
}
