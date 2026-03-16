import React, { useState, ReactNode } from 'react';
import classNames from 'classnames';

interface DashboardLayoutProps {
  children: ReactNode;
  darkMode?: boolean;
  onDarkModeToggle?: (enabled: boolean) => void;
}

interface NavLink {
  name: string;
  href: string;
  icon: string;
  current?: boolean;
}

const navLinks: NavLink[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', current: true },
  { name: 'Insights', href: '/insights', icon: '📈' },
  { name: 'Creatives', href: '/creatives', icon: '🎨' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  darkMode = false,
  onDarkModeToggle,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={classNames(darkMode && 'dark')}>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
                >
                  <span className="sr-only">Open sidebar</span>
                  {sidebarOpen ? '✕' : '☰'}
                </button>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Meta Ads Manager
                </h1>
              </div>

              <div className="flex items-center gap-4">
                {/* Dark mode toggle */}
                <button
                  onClick={() => onDarkModeToggle?.(!darkMode)}
                  className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>

                {/* Notifications */}
                <button
                  className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                  aria-label="Notifications"
                >
                  🔔
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                </button>

                {/* User profile */}
                <button
                  className="inline-flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 w-10 h-10 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  aria-label="User menu"
                >
                  👤
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside
            className={classNames(
              'fixed inset-y-0 left-0 z-30 w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pt-20 transition-transform lg:relative lg:pt-0 lg:translate-x-0',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <nav className="space-y-1 px-4 py-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={classNames(
                    'group flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    link.current
                      ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <span className="text-lg">{link.icon}</span>
                  {link.name}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
