'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, Target, Bell, Settings } from 'lucide-react';

export function BottomNav() {
  const router = useRouter();

  const navItems = [
    { icon: LayoutDashboard, label: 'Home',      href: '/dashboard' },
    { icon: Target,          label: 'Campanhas', href: '/campaigns' },
    { icon: Bell,            label: 'Alertas',   href: '/alerts' },
    { icon: Settings,        label: 'Config',    href: '/settings' },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0"
      style={{
        backgroundColor: 'var(--color-bg-sidebar)',
        borderTop: '1px solid var(--color-border)',
      }}
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-around" style={{ height: '56px' }}>
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 px-4 transition-colors"
              style={{
                color:    isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                minWidth: '44px',
                height:   '100%',
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} aria-hidden="true" />
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-sans)', fontWeight: isActive ? 600 : 400 }}>
                {item.label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-0"
                  style={{
                    width: '24px',
                    height: '2px',
                    backgroundColor: 'var(--color-accent)',
                    borderRadius: '1px',
                  }}
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
