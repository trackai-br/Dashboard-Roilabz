'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { CreateCampaignModal } from './CreateCampaignModal';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
  darkMode?: boolean;
  onDarkModeToggle?: (enabled: boolean) => void;
}

export function Header({
  title = 'Dashboard',
  onMenuClick,
  darkMode = true,
  onDarkModeToggle
}: HeaderProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b backdrop-blur-md" style={{ backgroundColor: 'var(--bg-card)', borderBottomColor: 'var(--color-tertiary)' }}>
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
            <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--color-brand)' }}>
              {title}
            </h1>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Botão Criar Campanha */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 text-white font-medium rounded-lg transition-all duration-200 shadow-sm"
              style={{ backgroundColor: 'var(--color-brand)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-brand-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-brand)'}
            >
              + Criar Campanha
            </button>

            {/* Botão Bulk Create */}
            <button
              onClick={() => router.push('/campaigns/bulk-create')}
              className="hidden sm:inline-block px-4 py-2 border rounded-lg transition-all duration-200 font-medium"
              style={{ borderColor: 'var(--color-coral)', color: 'var(--color-coral)' }}
            >
              📦 Bulk
            </button>

            {/* Botão Alertas */}
            <button
              onClick={() => router.push('/alerts')}
              className="hidden sm:inline-block px-4 py-2 border rounded-lg transition-all duration-200 font-medium"
              style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-primary)' }}
            >
              🔔
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => onDarkModeToggle?.(!darkMode)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--color-primary)' }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Criação */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
