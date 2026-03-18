'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open }: SidebarProps) {
  const router = useRouter();

  const navItems = [
    { icon: '📊', label: 'Dashboard', href: '/dashboard' },
    { icon: '🎯', label: 'Campanhas', href: '/campaigns' },
    { icon: '🔔', label: 'Alertas', href: '/alerts' },
    { icon: '⚙️', label: 'Configurações', href: '/settings' },
  ];

  return (
    <aside className="w-72 bg-dark-900 border-r border-dark-700/50 h-screen overflow-y-auto flex flex-col">
      {/* Logo */}
      <div className="px-8 py-8 border-b border-dark-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-growth-500 to-energy-500 flex items-center justify-center">
            <span className="text-white font-display font-bold">M</span>
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-white">Meta Ads</h1>
            <p className="text-xs text-gray-500">Manager Pro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-growth-500/20 to-energy-500/20 border border-energy-500/30 text-energy-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-dark-800/50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-energy-400" />}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-6 border-t border-dark-700/50">
        <button className="w-full px-4 py-2 border border-dark-700 hover:border-dark-600 text-gray-400 hover:text-white rounded-lg transition-all text-sm font-medium">
          Logout
        </button>
      </div>
    </aside>
  );
}
