'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Target,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open }: SidebarProps) {
  const router = useRouter();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Target, label: 'Campanhas', href: '/campaigns' },
    { icon: Bell, label: 'Alertas', href: '/alerts' },
    { icon: Settings, label: 'Configurações', href: '/settings' },
  ];

  return (
    <aside
      className="w-64 h-screen overflow-y-auto flex flex-col"
      style={{
        backgroundColor: 'var(--color-teal)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      role="navigation"
      aria-label="Menu principal"
    >
      {/* Skip Link — Accessibility */}
      <a
        href="#main-content"
        className="absolute left-0 top-0 px-4 py-2 bg-brand text-white rounded-br"
        style={{
          transform: 'translateY(-100%)',
          pointerEvents: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.pointerEvents = 'auto';
        }}
        onBlur={(e) => {
          e.currentTarget.style.transform = 'translateY(-100%)';
          e.currentTarget.style.pointerEvents = 'none';
        }}
      >
        Pular para conteúdo principal
      </a>

      {/* Logo Section */}
      <div
        className="flex items-center gap-3 p-6"
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          minHeight: '88px',
        }}
      >
        {/* Logo Circle - 44×44px min touch target */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
          style={{
            backgroundColor: 'var(--color-sand)',
            color: 'var(--color-teal)',
            flexShrink: 0,
            minWidth: '48px',
            minHeight: '48px',
          }}
          role="img"
          aria-label="Meta Ads Manager logo"
        >
          M
        </div>

        {/* Logo Text */}
        <div className="flex-1 min-w-0">
          <h1
            className="font-display font-bold leading-tight"
            style={{
              color: 'var(--color-sidebar-text)',
              fontSize: '1.125rem',
              margin: 0,
            }}
          >
            Meta Ads
          </h1>
          <p
            className="text-xs font-medium"
            style={{
              color: 'rgba(245, 243, 240, 0.6)',
              marginTop: '2px',
              margin: '2px 0 0 0',
            }}
          >
            Manager Pro
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 flex flex-col gap-1" aria-label="Navegação principal">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 px-4 py-3 rounded-lg transition-all focus:outline-none"
              style={{
                color: isActive ? 'var(--color-sidebar-active)' : 'var(--color-sidebar-text)',
                backgroundColor: isActive
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'transparent',
                borderLeft: isActive
                  ? '3px solid var(--color-sand)'
                  : '3px solid transparent',
                paddingLeft: isActive ? 'calc(16px - 3px)' : '16px',
                minHeight: '48px',
                outline: 'none',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  router.push(item.href);
                }
              }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              tabIndex={0}
            >
              {/* SVG Icon - 20×20px */}
              <Icon
                size={20}
                strokeWidth={2}
                className="flex-shrink-0"
                aria-hidden="true"
              />
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
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all focus:outline-none"
          style={{
            color: 'var(--color-sidebar-text)',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            minHeight: '48px',
            outline: 'none',
          }}
          aria-label="Logout"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid var(--color-sand)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
