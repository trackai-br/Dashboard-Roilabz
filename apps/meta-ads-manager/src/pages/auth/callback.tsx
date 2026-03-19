import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have a valid session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session) {
          // User is authenticated, create user record if it doesn't exist
          const { user } = session;
          if (user) {
            const { error: upsertError } = await supabase
              .from('users')
              .upsert(
                {
                  id: user.id,
                  email: user.email || '',
                  full_name: user.user_metadata?.full_name || '',
                  avatar_url: user.user_metadata?.avatar_url || '',
                  provider: 'google',
                },
                {
                  onConflict: 'id',
                }
              );

            if (upsertError) console.error('Error upserting user:', upsertError);
          }

          // Redirect to dashboard
          router.push('/dashboard');
        } else {
          // No session, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=auth_failed');
      }
    };

    handleCallback();
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
