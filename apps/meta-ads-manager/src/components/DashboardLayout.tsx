'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({
  children,
  title,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden dark">
      {/* Sidebar - Desktop only */}
      {!isMobile && (
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-page)' }}>
        {/* Header com action buttons */}
        <Header
          title={title}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-page)' }}>
          {children}
        </main>
      </div>

      {/* Bottom Nav - Mobile only */}
      {isMobile && <BottomNav />}
    </div>
  );
}
