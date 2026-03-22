'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';
import { useRouter } from 'next/router';

type TokenState = 'ok' | 'expiring' | 'expired' | 'disconnected' | 'loading';

interface TokenStatus {
  state: TokenState;
  daysLeft: number | null;
}

function useTokenStatus(): TokenStatus & { isLoading: boolean } {
  const { data, isLoading } = useQuery<TokenStatus>({
    queryKey: ['meta-token-status'],
    queryFn: async () => {
      const res = await authenticatedFetch('/api/auth/meta/connection');

      if (!res.ok || res.status === 404) return { state: 'disconnected', daysLeft: null };

      const conn = await res.json();
      if (!conn || conn.connection_status !== 'active') return { state: 'disconnected', daysLeft: null };
      if (conn.connection_status === 'expired') return { state: 'expired', daysLeft: 0 };

      if (!conn.meta_token_expires_at) return { state: 'ok', daysLeft: null };

      const daysLeft = Math.round(
        (new Date(conn.meta_token_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft <= 0) return { state: 'expired', daysLeft: 0 };
      if (daysLeft <= 7) return { state: 'expiring', daysLeft };
      return { state: 'ok', daysLeft };
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2,
  });

  return { state: data?.state ?? 'loading', daysLeft: data?.daysLeft ?? null, isLoading };
}

export function MetaTokenStatus() {
  const { state, daysLeft, isLoading } = useTokenStatus();
  const router = useRouter();

  if (isLoading || state === 'loading') return null;

  if (state === 'ok') {
    return (
      <span
        title={daysLeft ? `Token Meta válido — expira em ${daysLeft} dias` : 'Meta conectado'}
        className="relative flex h-2.5 w-2.5"
      >
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40"
          style={{ backgroundColor: 'var(--color-success)' }}
        />
        <span
          className="relative inline-flex rounded-full h-2.5 w-2.5"
          style={{ backgroundColor: 'var(--color-success)', boxShadow: '0 0 6px rgba(0, 255, 136, 0.5)' }}
        />
      </span>
    );
  }

  if (state === 'expiring') {
    return (
      <button
        onClick={() => router.push('/connections')}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
        style={{
          color: 'var(--color-warning)',
          backgroundColor: 'rgba(255, 183, 3, 0.1)',
          border: '1px solid rgba(255, 183, 3, 0.3)',
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          letterSpacing: '0.03em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 183, 3, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--color-warning)' }} />
        Expira em {daysLeft}d
      </button>
    );
  }

  if (state === 'expired') {
    return (
      <button
        onClick={() => router.push('/connections')}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
        style={{
          color: 'var(--color-danger)',
          backgroundColor: 'rgba(255, 51, 51, 0.1)',
          border: '1px solid rgba(255, 51, 51, 0.3)',
          fontFamily: "'Space Grotetz', system-ui, sans-serif",
          letterSpacing: '0.03em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 51, 51, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--color-danger)' }} />
        Expirado
      </button>
    );
  }

  // disconnected
  return (
    <button
      onClick={() => router.push('/connections')}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
      style={{
        color: 'var(--color-tertiary)',
        backgroundColor: 'rgba(112, 112, 128, 0.1)',
        border: '1px solid rgba(112, 112, 128, 0.3)',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        letterSpacing: '0.03em',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 0 8px rgba(112, 112, 128, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--color-tertiary)' }} />
      Não conectado
    </button>
  );
}
