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
    <aside
      className="w-64 h-screen overflow-y-auto flex flex-col"
      style={{
        backgroundColor: 'var(--color-teal)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Logo Section */}
      <div
        className="flex items-center gap-3 p-6"
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Logo Circle */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
          style={{
            backgroundColor: 'var(--color-sand)',
            color: 'var(--color-teal)',
            flexShrink: 0,
          }}
        >
          M
        </div>

        {/* Logo Text */}
        <div className="flex-1 min-w-0">
          <div
            className="font-display font-bold leading-tight"
            style={{
              color: 'var(--color-sidebar-text)',
              fontSize: '1.125rem',
            }}
          >
            Meta Ads
          </div>
          <div
            className="text-xs font-medium"
            style={{
              color: 'rgba(245, 243, 240, 0.6)',
              marginTop: '2px',
            }}
          >
            Manager Pro
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
              style={{
                color: isActive ? 'var(--color-sidebar-active)' : 'var(--color-sidebar-text)',
                backgroundColor: isActive
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'transparent',
                borderLeft: isActive
                  ? '3px solid var(--color-sand)'
                  : '3px solid transparent',
                paddingLeft: isActive ? 'calc(16px - 3px)' : '16px',
              }}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <span
                className="text-sm font-medium transition-opacity"
                style={{
                  opacity: isActive ? 1 : 0.8,
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-6"
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <button
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{
            color: 'var(--color-sidebar-text)',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
