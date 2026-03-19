'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Rocket,
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
    { icon: Rocket, label: 'Subir Campanhas', href: '/campaigns/setup' },
    { icon: Target, label: 'Campanhas', href: '/campaigns' },
    { icon: Bell, label: 'Alertas', href: '/alerts' },
    { icon: Settings, label: 'Configurações', href: '/settings' },
  ];

  return (
    <aside
      className="w-64 h-screen overflow-y-auto flex flex-col backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        borderRight: '1px solid rgba(57, 255, 20, 0.1)',
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
          borderBottom: '1px solid rgba(57, 255, 20, 0.1)',
          minHeight: '88px',
        }}
      >
        {/* Logo Circle - 44×44px min touch target */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
          style={{
            backgroundColor: 'var(--neon-green)',
            color: 'var(--bg-deepest)',
            minWidth: '48px',
            minHeight: '48px',
            boxShadow: '0 0 12px rgba(57, 255, 20, 0.4)',
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontWeight: 700,
            letterSpacing: '0.05em',
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
              color: 'var(--neon-green)',
              fontSize: '1.125rem',
              margin: 0,
              letterSpacing: '0.05em',
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              textShadow: '0 0 8px rgba(57, 255, 20, 0.3)',
            }}
          >
            Meta Ads
          </h1>
          <p
            className="text-xs font-medium"
            style={{
              color: 'var(--color-secondary)',
              marginTop: '2px',
              margin: '2px 0 0 0',
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
            }}
          >
            MANAGER PRO
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
                color: isActive ? 'var(--neon-green)' : 'var(--color-sidebar-text)',
                backgroundColor: isActive
                  ? 'rgba(57, 255, 20, 0.08)'
                  : 'transparent',
                borderLeft: isActive
                  ? '3px solid var(--neon-green)'
                  : '3px solid transparent',
                paddingLeft: isActive ? 'calc(16px - 3px)' : '16px',
                minHeight: '48px',
                outline: 'none',
                boxShadow: isActive ? '0 0 12px rgba(57, 255, 20, 0.15)' : 'none',
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
          borderTop: '1px solid rgba(57, 255, 20, 0.1)',
        }}
      >
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all focus:outline-none"
          style={{
            color: 'var(--color-sidebar-text)',
            backgroundColor: 'rgba(57, 255, 20, 0.08)',
            border: '1px solid rgba(57, 255, 20, 0.15)',
            minHeight: '48px',
            outline: 'none',
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontWeight: 500,
            letterSpacing: '0.03em',
          }}
          aria-label="Logout"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.15)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(57, 255, 20, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.08)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid var(--neon-green)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        >
          <LogOut size={18} />
          <span>LOGOUT</span>
        </button>
      </div>
    </aside>
  );
}
