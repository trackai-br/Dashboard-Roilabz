import { supabase } from './supabase';

/**
 * Fetch autenticado — adiciona Authorization header automaticamente.
 * Tenta refresh se sessao expirou.
 * Redireciona para /login se nao ha sessao.
 */
export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  let session = (await supabase.auth.getSession()).data.session;

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
