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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="w-full max-w-md px-4">
        {/* Logo & Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--color-brand)' }}>
              <span className="text-white font-bold text-2xl font-display">M</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3 font-display" style={{ color: 'var(--color-brand)' }}>
            Meta Ads Manager
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
            Orquestração de campanhas Meta e Google Ads
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-danger-bg)', borderColor: 'var(--color-danger)', borderWidth: '1px' }}>
            <p className="text-sm mb-2" style={{ color: 'var(--color-danger)' }}>{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs font-medium"
              style={{ color: 'var(--color-danger)' }}
            >
              Descartar
            </button>
          </div>
        )}

        {/* Login Container */}
        <div className="rounded-2xl p-8 space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)', borderWidth: '1px' }}>
          {/* Google Sign In Button */}
          <GoogleAuthButton
            onSuccess={handleLoginSuccess}
            onError={(err) => setError(err.message)}
            isLoading={isLoading}
          />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--color-tertiary)' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--color-secondary)' }}>
                Continuar com
              </span>
            </div>
          </div>

          {/* Demo Credentials (Future) */}
          <div className="pt-4" style={{ borderTop: '1px solid var(--color-tertiary)' }}>
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--color-secondary)' }}>
              Credenciais Demo
            </p>
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <p className="text-sm font-mono" style={{ color: 'var(--color-brand)' }}>
                demo@metaads.com • senha123
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--color-secondary)' }}>
                (Em desenvolvimento)
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs" style={{ color: 'var(--color-tertiary)' }}>
            © 2026 Meta Ads Manager. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
