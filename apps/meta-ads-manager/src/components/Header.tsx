'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { Rocket, Bell, Sun, Moon } from 'lucide-react';
import { MetaTokenStatus } from './MetaTokenStatus';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title = 'Dashboard', onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        backgroundColor: 'var(--color-bg-sidebar)',
        borderBottom: '1px solid var(--color-border)',
        minHeight: '52px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '52px' }}>

        {/* Left: hamburger (mobile) + page title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onMenuClick}
            className="md:hidden"
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
            }}
            aria-label="Abrir menu"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '14px',
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
            margin: 0,
          }}>
            {title}
          </h1>
        </div>

        {/* Right: status + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MetaTokenStatus />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-tertiary)',
              transition: 'all 120ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-bg-surface)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
            }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Alerts */}
          <button
            onClick={() => router.push('/alerts')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-tertiary)',
              transition: 'all 120ms ease',
            }}
            aria-label="Alertas"
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-bg-surface)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
            }}
          >
            <Bell size={14} />
          </button>

          {/* Primary CTA */}
          <button
            onClick={() => router.push('/campaigns/setup')}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Rocket size={13} strokeWidth={2} />
            Nova Campanha
          </button>
        </div>
      </div>
    </header>
  );
}
