'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { Rocket, Package, Bell } from 'lucide-react';
import { MetaTokenStatus } from './MetaTokenStatus';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title = 'Dashboard', onMenuClick }: HeaderProps) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-40 flex-shrink-0"
      style={{
        backgroundColor: 'var(--color-bg-sidebar)',
        borderBottom: '1px solid var(--color-border)',
        minHeight: '52px',
      }}
    >
      <div className="px-6 flex items-center justify-between" style={{ minHeight: '52px' }}>
        {/* Left: hamburger (mobile) + page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 rounded transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Abrir menu"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1
            className="text-sm font-semibold"
            style={{
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.01em',
              margin: 0,
              fontSize: '14px',
            }}
          >
            {title}
          </h1>
        </div>

        {/* Right: status + actions */}
        <div className="flex items-center gap-2">
          <MetaTokenStatus />

          {/* Primary CTA */}
          <button
            onClick={() => router.push('/campaigns/setup')}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Rocket size={13} strokeWidth={2} aria-hidden="true" />
            Nova Campanha
          </button>

          {/* Secondary actions — hidden on mobile */}
          <button
            onClick={() => router.push('/campaigns/setup')}
            className="hidden sm:flex btn-ghost items-center gap-1.5"
            style={{ fontSize: '12px', padding: '6px 10px', color: 'var(--color-text-secondary)' }}
            aria-label="Subida em massa"
          >
            <Package size={13} strokeWidth={1.5} aria-hidden="true" />
            Bulk
          </button>

          <button
            onClick={() => router.push('/alerts')}
            className="hidden sm:flex btn-ghost items-center gap-1.5"
            style={{ fontSize: '12px', padding: '6px 10px', color: 'var(--color-text-secondary)' }}
            aria-label="Alertas"
          >
            <Bell size={13} strokeWidth={1.5} aria-hidden="true" />
            Alertas
          </button>
        </div>
      </div>
    </header>
  );
}
