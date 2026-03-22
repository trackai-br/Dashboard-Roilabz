'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  isLoading?: boolean;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  isLoading = false,
}) => {
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsAuthLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid email profile https://www.googleapis.com/auth/adwords',
        },
      });

      if (error) throw error;
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Login failed');
      onError?.(err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const isDisabled = isLoading || isAuthLoading;

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isDisabled}
      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-50 border-0 rounded-lg shadow-lg hover:shadow-xl disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950 focus:outline-none"
    >
      <svg
        width="20" height="20"
        className={`w-5 h-5 ${isDisabled ? 'opacity-50' : ''}`}
        viewBox="0 0 24 24"
      >
        <path
          fill="#FFFFFF"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#FFFFFF"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FFFFFF"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#FFFFFF"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span className={`text-white font-semibold ${isDisabled ? 'opacity-50' : ''}`}>
        {isDisabled ? 'Entrando...' : 'Entrar com Google'}
      </span>
    </button>
  );
};

export default GoogleAuthButton;
