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
    <aside className="w-72 h-screen overflow-y-auto flex flex-col border-r-3" style={{ backgroundColor: 'var(--color-teal)', borderRightColor: 'var(--color-teal-light)' }}>
      {/* Logo */}
      <div className="px-8 py-8 border-b" style={{ borderBottomColor: 'var(--color-teal-light)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold" style={{ backgroundColor: 'var(--color-sand)' }}>
            <span>M</span>
          </div>
          <div>
            <h1 className="text-lg font-display font-bold" style={{ color: 'var(--color-sidebar-text)' }}>Meta Ads</h1>
            <p className="text-xs" style={{ color: 'var(--color-sand-light)' }}>Manager Pro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
                isActive
                  ? 'border-l-3'
                  : 'hover:opacity-80'
              }`}
              style={{
                color: isActive ? 'var(--color-sidebar-active)' : 'var(--color-sidebar-text)',
                borderLeftColor: isActive ? 'var(--color-brand)' : 'transparent',
                backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-6 border-t" style={{ borderTopColor: 'var(--color-teal-light)' }}>
        <button className="w-full px-4 py-2 border rounded-lg transition-all text-sm font-medium" style={{ borderColor: 'var(--color-teal-light)', color: 'var(--color-sidebar-text)' }}>
          Logout
        </button>
      </div>
    </aside>
  );
}
