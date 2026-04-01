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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <div className="w-full max-w-md px-4">
        {/* Logo & Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div
              className="h-12 w-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-accent-dark)' }}
            >
              <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-sans)' }}>R</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.015em' }}>
            ROILabz
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
            Dashboard de performance Meta Ads
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 p-3 rounded" style={{ backgroundColor: 'rgba(255,45,120,0.06)', border: '1px solid var(--color-danger)' }}>
            <p className="text-sm mb-1.5" style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}>{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs font-medium"
              style={{ color: 'var(--color-danger)' }}
            >
              Descartar
            </button>
          </div>
        )}

        {/* Login card */}
        <div
          className="p-6 space-y-5"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <GoogleAuthButton
            onSuccess={handleLoginSuccess}
            onError={(err) => setError(err.message)}
            isLoading={isLoading}
          />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--color-border)' }} />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-3 text-xs uppercase tracking-wider"
                style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)' }}
              >
                acesso
              </span>
            </div>
          </div>

          {/* Demo info */}
          <div className="pt-1">
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)' }}>
              Credenciais Demo
            </p>
            <div className="rounded p-3" style={{ backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                demo@roilabz.com • senha123
              </p>
              <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)' }}>
                (Em desenvolvimento)
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)' }}>
            © 2026 ROILabz. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
