import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [eyesClosed, setEyesClosed] = useState(false);

  // Panda blink animation
  useEffect(() => {
    const blink = () => {
      setEyesClosed(true);
      setTimeout(() => setEyesClosed(false), 150);
    };

    const scheduleNextBlink = () => {
      const delay = 2500 + Math.random() * 3000;
      return setTimeout(() => {
        blink();
        scheduleNextBlink();
      }, delay);
    };

    const timeout = scheduleNextBlink();
    return () => clearTimeout(timeout);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoading(true);
    setTimeout(() => router.push('/dashboard'), 500);
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

      {/* Pulsing grid background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(22, 163, 74, 0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(22, 163, 74, 0.07) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        animation: 'gridPulse 4s ease-in-out infinite',
      }} />

      {/* Radial fade overlay to focus center */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 60% 60% at 50% 50%, transparent 0%, var(--color-bg-base) 80%)',
        pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Login card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '380px',
        padding: '0 20px',
        animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* Panda SVG */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <svg viewBox="0 0 80 80" width="64" height="64" aria-hidden="true" style={{ filter: 'drop-shadow(0 4px 12px rgba(22,163,74,0.2))' }}>
              {/* Ears */}
              <circle cx="20" cy="22" r="14" fill="#1c1c1e" />
              <circle cx="60" cy="22" r="14" fill="#1c1c1e" />
              <circle cx="20" cy="22" r="7" fill="#2c2c2e" />
              <circle cx="60" cy="22" r="7" fill="#2c2c2e" />

              {/* Face */}
              <circle cx="40" cy="46" r="32" fill="#f5f5f5" />

              {/* Eye patches */}
              <ellipse cx="27" cy="39" rx="11" ry="10" fill="#1c1c1e" transform="rotate(-10 27 39)" />
              <ellipse cx="53" cy="39" rx="11" ry="10" fill="#1c1c1e" transform="rotate(10 53 39)" />

              {/* Eyes white */}
              <ellipse
                cx="27" cy="39"
                rx="6"
                ry={eyesClosed ? 0.5 : 5.5}
                fill="white"
                style={{ transition: 'ry 80ms ease' }}
              />
              <ellipse
                cx="53" cy="39"
                rx="6"
                ry={eyesClosed ? 0.5 : 5.5}
                fill="white"
                style={{ transition: 'ry 80ms ease' }}
              />

              {/* Pupils */}
              {!eyesClosed && (
                <>
                  <circle cx="28" cy="40" r="2.5" fill="#1c1c1e" />
                  <circle cx="54" cy="40" r="2.5" fill="#1c1c1e" />
                  {/* Eye shine */}
                  <circle cx="29.5" cy="38.5" r="1" fill="white" opacity="0.8" />
                  <circle cx="55.5" cy="38.5" r="1" fill="white" opacity="0.8" />
                </>
              )}

              {/* Nose */}
              <ellipse cx="40" cy="52" rx="4" ry="3" fill="#1c1c1e" />

              {/* Smile */}
              <path d="M 33 58 Q 40 65 47 58" stroke="#1c1c1e" strokeWidth="2.5" fill="none" strokeLinecap="round" />

              {/* Blush */}
              <ellipse cx="18" cy="52" rx="6" ry="3.5" fill="rgba(239,68,68,0.2)" />
              <ellipse cx="62" cy="52" rx="6" ry="3.5" fill="rgba(239,68,68,0.2)" />
            </svg>
          </div>

          <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '24px', letterSpacing: '-0.04em', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            ROILabz
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--color-text-tertiary)', letterSpacing: '-0.01em' }}>
            Dashboard de performance Meta Ads
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-danger)' }}>{error}</p>
          </div>
        )}

        {/* Form card */}
        <div style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px', letterSpacing: '-0.01em' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="input"
              style={{ letterSpacing: '-0.01em' }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px', letterSpacing: '-0.01em' }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
            />
          </div>

          {/* Sign in button */}
          <button
            disabled={isLoading}
            aria-busy={isLoading}
            className="btn-primary w-full justify-center"
            style={{ marginTop: '2px', padding: '10px 16px', fontSize: '14px' }}
          >
            {isLoading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Entrando...
              </span>
            ) : 'Entrar'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '2px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              ou
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          </div>

          {/* Google */}
          <GoogleAuthButton
            onSuccess={handleLoginSuccess}
            onError={err => setError(err.message)}
            isLoading={isLoading}
          />
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '28px', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
          © 2026 ROILabz. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
