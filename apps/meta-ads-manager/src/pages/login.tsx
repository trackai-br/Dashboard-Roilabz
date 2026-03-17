import React, { useState } from 'react';
import { useRouter } from 'next/router';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Meta Ads Manager
          </h1>
          <p className="text-gray-600">
            Manage your Meta and Google Ads campaigns in one place
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="space-y-4">
          <GoogleAuthButton
            onSuccess={handleLoginSuccess}
            onError={(err) => setError(err.message)}
            isLoading={isLoading}
          />
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Secure authentication powered by Google and Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
