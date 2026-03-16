import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KPICard } from '@/components/KPICard';
import { CampaignTable } from '@/components/CampaignTable';
import { useMetaAccounts, useMetaAccountsKPIs } from '@/hooks/useMetaAccounts';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();
  const [pageOffset, setPageOffset] = useState(0);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(JSON.parse(saved));
    } else {
      // Use system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDark);
    }
  }, []);

  // Save dark mode preference
  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('darkMode', JSON.stringify(enabled));
  };

  // Queries
  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useMetaAccounts();
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useMetaAccountsKPIs(selectedAccountId);
  const {
    data: campaigns,
    isLoading: campaignsLoading,
    error: campaignsError,
  } = useMetaCampaigns({
    accountId: selectedAccountId,
    limit: 50,
    offset: pageOffset,
  });

  // Set default account on load
  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const errorMessage = accountsError?.message || kpisError?.message || campaignsError?.message;

  return (
    <DashboardLayout darkMode={darkMode} onDarkModeToggle={handleDarkModeToggle}>
      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Error loading dashboard: {errorMessage}
          </p>
        </div>
      )}

      {/* Account Selector */}
      <div className="mb-8 flex items-center gap-4">
        <label htmlFor="account-select" className="font-medium text-gray-700 dark:text-gray-300">
          Account:
        </label>
        <select
          id="account-select"
          value={selectedAccountId || ''}
          onChange={(e) => {
            setSelectedAccountId(e.target.value || undefined);
            setPageOffset(0);
          }}
          disabled={accountsLoading}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white disabled:opacity-50"
        >
          <option value="">All Accounts</option>
          {accounts?.map((account) => (
            <option key={account.id} value={account.id}>
              {account.account_name} ({account.account_id})
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Spend (MTD)"
            value={`$${kpis?.totalSpend.toFixed(2) || '0.00'}`}
            unit="USD"
            icon="💰"
            loading={kpisLoading}
          />
          <KPICard
            title="Impressions (7d)"
            value={kpis?.impressions.toLocaleString() || '0'}
            icon="👁️"
            loading={kpisLoading}
          />
          <KPICard
            title="Avg CPC"
            value={`$${kpis?.avgCpc.toFixed(2) || '0.00'}`}
            icon="💵"
            loading={kpisLoading}
          />
          <KPICard
            title="Avg ROAS"
            value={kpis?.avgRoas.toFixed(2) || '0.00'}
            unit="x"
            icon="📈"
            loading={kpisLoading}
          />
        </div>
      </section>

      {/* Campaign Table */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          All Campaigns
        </h2>
        <CampaignTable
          campaigns={campaigns || []}
          loading={campaignsLoading}
          error={campaignsError?.message}
          accountSelector={
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by: {selectedAccountId ? 'Selected Account' : 'All Accounts'}
            </label>
          }
        />

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setPageOffset(Math.max(0, pageOffset - 50))}
            disabled={pageOffset === 0}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Showing campaigns {pageOffset + 1} to {pageOffset + 50}
          </span>
          <button
            onClick={() => setPageOffset(pageOffset + 50)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}
