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
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md px-4">
        {/* Logo & Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">M</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Meta Ads Manager
          </h1>
          <p className="text-gray-400 text-sm">
            Orquestração de campanhas Meta e Google Ads
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-sm text-red-200 mb-2">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs font-medium text-red-400 hover:text-red-300"
            >
              Descartar
            </button>
          </div>
        )}

        {/* Login Container */}
        <div className="border border-gray-800 rounded-2xl p-8 space-y-6 bg-gray-950/50 backdrop-blur-sm">
          {/* Google Sign In Button */}
          <GoogleAuthButton
            onSuccess={handleLoginSuccess}
            onError={(err) => setError(err.message)}
            isLoading={isLoading}
          />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-gray-950 text-xs text-gray-500 uppercase tracking-wider">
                Continuar com
              </span>
            </div>
          </div>

          {/* Demo Credentials (Future) */}
          <div className="pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Credenciais Demo
            </p>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-blue-400 font-mono">
                demo@metaads.com • senha123
              </p>
              <p className="text-xs text-gray-500 mt-2">
                (Em desenvolvimento)
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-700">
            © 2026 Meta Ads Manager. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
