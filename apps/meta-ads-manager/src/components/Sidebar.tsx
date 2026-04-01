'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  Rocket,
  Target,
  Bell,
  Settings,
  LogOut,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const router = useRouter();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard',       href: '/dashboard' },
    { icon: Rocket,          label: 'Subir Campanhas', href: '/campaigns/setup' },
    { icon: Target,          label: 'Campanhas',       href: '/campaigns' },
    { icon: Bell,            label: 'Alertas',         href: '/alerts' },
    { icon: FileText,        label: 'Logs',            href: '/logs' },
    { icon: Settings,        label: 'Configurações',   href: '/settings' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside
      style={{
        width: open ? '220px' : '56px',
        minWidth: open ? '220px' : '56px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-sidebar)',
        borderRight: '1px solid var(--color-border)',
        transition: 'width 220ms cubic-bezier(0.16,1,0.3,1), min-width 220ms cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
      role="navigation"
      aria-label="Menu principal"
    >
      {/* Logo row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: open ? 'space-between' : 'center',
        padding: open ? '14px 14px 14px 16px' : '14px 0',
        borderBottom: '1px solid var(--color-border)',
        minHeight: '56px',
        flexShrink: 0,
      }}>
        {open && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-accent-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', letterSpacing: '-0.02em' }}>R</span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>ROILabz</span>
              <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>Meta Ads</span>
            </div>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={onToggle}
          aria-label={open ? 'Recolher menu' : 'Expandir menu'}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-tertiary)',
            transition: 'all 120ms ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-bg-surface)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
          }}
        >
          {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!open ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: open ? '0 10px' : '0',
                justifyContent: open ? 'flex-start' : 'center',
                minHeight: '36px',
                borderRadius: '8px',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'rgba(22, 163, 74, 0.12)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 120ms ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-bg-surface)';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-secondary)';
                }
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={16}
                strokeWidth={isActive ? 2 : 1.5}
                style={{
                  flexShrink: 0,
                  color: isActive ? 'var(--color-accent-bright)' : 'inherit',
                }}
              />
              {open && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '6px 6px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        <button
          onClick={handleLogout}
          title={!open ? 'Sair' : undefined}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: open ? '0 10px' : '0',
            justifyContent: open ? 'flex-start' : 'center',
            minHeight: '36px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            color: 'var(--color-text-tertiary)',
            transition: 'all 120ms ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.08)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-danger)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
          }}
        >
          <LogOut size={16} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          {open && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
