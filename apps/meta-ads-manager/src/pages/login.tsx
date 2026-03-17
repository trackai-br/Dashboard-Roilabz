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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      {/* Background accent */}
      <div className="fixed top-0 right-0 -z-10 h-96 w-96 rounded-full bg-blue-100 dark:bg-blue-900/20 blur-3xl opacity-50" />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">📊</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Meta Ads Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerenciar suas campanhas Meta e Google Ads em um único lugar
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Descartar
              </button>
            </div>
          )}

          {/* Login button */}
          <GoogleAuthButton
            onSuccess={handleLoginSuccess}
            onError={(err) => setError(err.message)}
            isLoading={isLoading}
          />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                ou continue como
              </span>
            </div>
          </div>

          {/* Info text */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Autenticação segura com Google e Supabase
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            © 2026 Dashboard Roilabz. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
