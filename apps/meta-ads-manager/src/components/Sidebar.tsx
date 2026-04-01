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
  FileText,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open }: SidebarProps) {
  const router = useRouter();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard',       href: '/dashboard' },
    { icon: Rocket,          label: 'Subir Campanhas', href: '/campaigns/setup' },
    { icon: Target,          label: 'Campanhas',       href: '/campaigns' },
    { icon: Bell,            label: 'Alertas',         href: '/alerts' },
    { icon: FileText,        label: 'Logs',            href: '/logs' },
    { icon: Settings,        label: 'Configurações',   href: '/settings' },
  ];

  return (
    <aside
      className="w-56 h-screen overflow-y-auto flex flex-col flex-shrink-0"
      style={{
        backgroundColor: 'var(--color-bg-sidebar)',
        borderRight: '1px solid var(--color-border)',
      }}
      role="navigation"
      aria-label="Menu principal"
    >
      {/* Skip link — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        style={{
          backgroundColor: 'var(--color-accent-dark)',
          color: '#fff',
        }}
      >
        Pular para conteúdo principal
      </a>

      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 py-4"
        style={{ borderBottom: '1px solid var(--color-border)', minHeight: '56px' }}
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            backgroundColor: 'var(--color-accent-dark)',
            color: '#ffffff',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.02em',
          }}
          role="img"
          aria-label="ROILabz logo"
        >
          R
        </div>
        <div className="flex-1 min-w-0">
          <span
            className="text-sm font-semibold leading-none block"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}
          >
            ROILabz
          </span>
          <span
            className="text-xs leading-none block mt-0.5"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em' }}
          >
            Meta Ads
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5" aria-label="Navegação principal">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-2.5 px-3 rounded transition-all focus:outline-none focus-visible:ring-1"
              style={{
                color:           isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-bg-surface)' : 'transparent',
                borderLeft:      isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                paddingLeft:     isActive ? 'calc(12px - 2px)' : '12px',
                minHeight:       '36px',
                fontSize:        '13px',
                fontFamily:      'var(--font-sans)',
                fontWeight:      isActive ? 500 : 400,
              }}
              aria-current={isActive ? 'page' : undefined}
              tabIndex={0}
            >
              <Icon size={16} strokeWidth={isActive ? 2 : 1.5} className="flex-shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — Logout */}
      <div className="px-2 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <button
          className="w-full flex items-center gap-2.5 px-3 rounded text-sm transition-all focus:outline-none focus-visible:ring-1"
          style={{
            color:      'var(--color-text-tertiary)',
            minHeight:  '36px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 400,
            fontSize:   '13px',
          }}
          aria-label="Sair da conta"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
            e.currentTarget.style.color = 'var(--color-danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
          }}
        >
          <LogOut size={16} strokeWidth={1.5} aria-hidden="true" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
