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
      <header className="border-b border-dark-800/50 bg-dark-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left: Menu + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 hover:bg-dark-800 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-gray-300"
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
            <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-growth-500 to-energy-400 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Botão Criar Campanha */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-growth-500 to-growth-600 hover:from-growth-600 hover:to-growth-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-glow-green"
            >
              + Criar Campanha
            </button>

            {/* Botão Bulk Create */}
            <button
              onClick={() => router.push('/campaigns/bulk-create')}
              className="hidden sm:inline-block px-4 py-2 border border-energy-500/30 bg-energy-500/5 hover:bg-energy-500/10 text-energy-400 font-medium rounded-lg transition-all duration-200"
            >
              📦 Bulk
            </button>

            {/* Botão Alertas */}
            <button
              onClick={() => router.push('/alerts')}
              className="hidden sm:inline-block px-4 py-2 border border-gray-600 bg-dark-800/50 hover:bg-dark-800 text-gray-300 rounded-lg transition-all duration-200"
            >
              🔔
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => onDarkModeToggle?.(!darkMode)}
              className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
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
