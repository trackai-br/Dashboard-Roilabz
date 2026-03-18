'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export function BottomNav() {
  const router = useRouter();

  const navItems = [
    { icon: '📊', label: 'Home', href: '/dashboard' },
    { icon: '🎯', label: 'Campanhas', href: '/campaigns' },
    { icon: '🔔', label: 'Alertas', href: '/alerts' },
    { icon: '⚙️', label: 'Config', href: '/settings' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t backdrop-blur-md" style={{ backgroundColor: 'var(--color-teal)', borderTopColor: 'var(--color-teal-light)' }}>
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors"
              style={{ color: isActive ? 'var(--color-sidebar-active)' : 'var(--color-sidebar-text)' }}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
