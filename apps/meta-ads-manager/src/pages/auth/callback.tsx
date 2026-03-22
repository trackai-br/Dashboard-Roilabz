import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Listen for the SIGNED_IN event which fires reliably after
    // the Supabase client processes the OAuth code from the URL.
    // Calling getSession() directly races with the async code exchange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          subscription.unsubscribe();
          router.push('/dashboard');
        }
      }
    );

    // Fallback: if the session already exists (e.g. page refresh),
    // redirect immediately.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        subscription.unsubscribe();
        router.push('/dashboard');
      }
    });

    // Safety timeout — if nothing happens in 10s, redirect to login
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      router.push('/login?error=auth_timeout');
    }, 10000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
}
