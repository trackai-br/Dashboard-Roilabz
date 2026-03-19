'use client';

import React from 'react';
import { useRouter } from 'next/router';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({
  title = 'Dashboard',
  onMenuClick,
}: HeaderProps) {
  const router = useRouter();

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(26, 26, 46, 0.8)',
          borderBottomColor: 'var(--border-light)',
        }}
      >
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left: Menu + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--color-primary)' }}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1
              className="text-2xl font-display font-bold"
              style={{
                color: 'var(--neon-green)',
                textShadow: '0 0 12px rgba(57, 255, 20, 0.3)',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                letterSpacing: '0.05em',
              }}
            >
              {title}
            </h1>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Botão Criar Campanha */}
            <button
              onClick={() => router.push('/campaigns/setup')}
              className="px-4 py-2 font-medium rounded-lg transition-all duration-200"
              style={{
                backgroundColor: 'var(--neon-green)',
                color: 'var(--bg-deepest)',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontWeight: 600,
                letterSpacing: '0.05em',
                boxShadow: '0 0 12px rgba(57, 255, 20, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(57, 255, 20, 0.6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 12px rgba(57, 255, 20, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              + CRIAR CAMPANHA
            </button>

            {/* Botão Bulk Create */}
            <button
              onClick={() => router.push('/campaigns/bulk-create')}
              className="hidden sm:inline-block px-4 py-2 border rounded-lg transition-all duration-200 font-medium"
              style={{
                borderColor: 'rgba(57, 255, 20, 0.3)',
                color: 'var(--neon-green)',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontWeight: 500,
                letterSpacing: '0.05em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--neon-green)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(57, 255, 20, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(57, 255, 20, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              📦 BULK
            </button>

            {/* Botão Alertas */}
            <button
              onClick={() => router.push('/alerts')}
              className="hidden sm:inline-block px-4 py-2 border rounded-lg transition-all duration-200 font-medium"
              style={{
                borderColor: 'rgba(57, 255, 20, 0.2)',
                color: 'var(--neon-cyan)',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontWeight: 500,
                letterSpacing: '0.05em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 240, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(57, 255, 20, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🔔 ALERTAS
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
